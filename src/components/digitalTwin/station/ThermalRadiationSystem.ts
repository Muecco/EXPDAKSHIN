/**
 * DAKSHIN — THERMAL RADIATION SYSTEM (STATION-AGNOSTIC, DATA-DRIVEN)
 *
 * Renders heat ACTUALLY EMANATING FROM MACHINERY rather than tinting surfaces:
 *
 *   MACHINE → HOT CORE → GLOW → RADIATING HEAT → WEAKER THERMAL FIELD
 *
 * Per thermal source (configured entirely from the station layout manifest):
 *   1. Hot core        — emissive additive globe at the machine
 *   2. Volumetric aura — camera-facing additive billboard, radius = thermalRadius
 *   3. Ground field    — flat radiant footprint on the terrain/floor, showing
 *                        intensity fall-off with distance
 *   4. Heat waves      — expanding ring billboards that pulse outward and fade
 *   5. Radiation drift — a small particle set rising/streaming off the machine
 *
 * Intensity is data-driven:
 *   intensity = thermalOutput × (0.35 + 0.65 × heat),  heat = clamp((T − ambient)/70)
 * so a hot generator blazes while a cold standby unit barely glows, and the
 * field visibly weakens with distance from each machine.
 *
 * Performance:
 *   - One shared radial-gradient texture and one shared ring texture for ALL sources
 *   - Fixed budgets: core(1) + aura(1) + field(1) + waves(3) + particles(20) per source
 *   - Frames inside a single station root group, disposed wholesale on station switch
 */

import * as THREE from 'three';
import type { ThermalSourceSpec } from './types';

// Re-exported so callers can build stations without a second import path.
export type { ThermalSourceSpec };

// ---------------------------------------------------------------------------
// Shared textures (created once, never per source)
// ---------------------------------------------------------------------------

function createRadialGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(255, 238, 210, 1.0)');
  grad.addColorStop(0.12, 'rgba(255, 186, 92, 0.92)');
  grad.addColorStop(0.34, 'rgba(249, 115, 22, 0.55)');
  grad.addColorStop(0.62, 'rgba(220, 38, 38, 0.22)');
  grad.addColorStop(1.0, 'rgba(180, 30, 30, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createHeatRingTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Colourful hollow ring — a heat-wave crest running red → orange → yellow → white
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.26, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, 'rgba(220, 38, 38, 0.0)');
  grad.addColorStop(0.42, 'rgba(220, 38, 38, 0.38)');
  grad.addColorStop(0.62, 'rgba(249, 115, 22, 0.68)');
  grad.addColorStop(0.80, 'rgba(251, 191, 36, 0.90)');
  grad.addColorStop(0.92, 'rgba(255, 247, 230, 0.62)');
  grad.addColorStop(1.0, 'rgba(251, 191, 36, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createParticleTexture(): THREE.Texture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 226, 180, 1.0)');
  grad.addColorStop(0.5, 'rgba(255, 150, 60, 0.5)');
  grad.addColorStop(1, 'rgba(255, 120, 40, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Multi-stop THERMAL FIELD texture — the heart of the colourful radiation look:
 * white-hot core → yellow → orange → red → faded deep red at the rim. One shared
 * texture gives every emitter the full red/yellow/orange spectrum.
 */
function createThermalFieldTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.00, 'rgba(255, 247, 230, 0.98)'); // white hot
  grad.addColorStop(0.10, 'rgba(253, 224, 71, 0.88)');  // yellow
  grad.addColorStop(0.24, 'rgba(251, 146, 60, 0.70)');  // orange
  grad.addColorStop(0.42, 'rgba(239, 68, 68, 0.46)');   // red
  grad.addColorStop(0.66, 'rgba(185, 28, 28, 0.22)');   // deep red
  grad.addColorStop(0.85, 'rgba(127, 29, 29, 0.08)');
  grad.addColorStop(1.00, 'rgba(127, 29, 29, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/** Full thermal palette: 0 = coolest (deep red) → 1 = white hot. */
const THERMAL_RAMP: [number, string][] = [
  [0.0, '#7F1D1D'],
  [0.22, '#DC2626'],
  [0.45, '#F97316'],
  [0.68, '#FBBF24'],
  [0.85, '#FDE68A'],
  [1.0, '#FFF7E6'],
];

const _rampLow = new THREE.Color();
const _rampHigh = new THREE.Color();

/** Samples the thermal palette at `t` (0–1) into `target`. */
export function thermalColor(t: number, target: THREE.Color = new THREE.Color()): THREE.Color {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < THERMAL_RAMP.length - 1; i++) {
    const low = THERMAL_RAMP[i];
    const high = THERMAL_RAMP[i + 1];
    if (clamped >= low[0] && clamped <= high[0]) {
      const span = high[0] - low[0] || 1;
      const f = (clamped - low[0]) / span;
      _rampLow.set(low[1]);
      _rampHigh.set(high[1]);
      return target.copy(_rampLow).lerp(_rampHigh, f);
    }
  }
  return target.set(THERMAL_RAMP[THERMAL_RAMP.length - 1][1]);
}

// ---------------------------------------------------------------------------
// Per-source runtime state
// ---------------------------------------------------------------------------

const WAVES_PER_SOURCE = 3;
const PARTICLES_PER_SOURCE = 20;

interface ThermalSourceRuntime {
  spec: ThermalSourceSpec;
  group: THREE.Group;
  core: THREE.Mesh;
  coreMaterial: THREE.MeshBasicMaterial;
  aura: THREE.Sprite;
  auraMaterial: THREE.SpriteMaterial;
  field: THREE.Mesh;
  fieldMaterial: THREE.MeshBasicMaterial;
  waves: THREE.Sprite[];
  waveMaterials: THREE.SpriteMaterial[];
  particles: THREE.Points;
  particleMaterial: THREE.PointsMaterial;
  particlePositions: Float32Array;
  particleLife: Float32Array;
  /** Rated output × live heat, 0 – 1. */
  intensity: number;
}

export class ThermalRadiationSystem {
  public group: THREE.Group;

  private sources: ThermalSourceRuntime[] = [];
  private glowTexture: THREE.Texture;
  private ringTexture: THREE.Texture;
  private particleTexture: THREE.Texture;
  private fieldTexture: THREE.Texture;
  /** Scratch colour reused every frame so the update loop allocates nothing. */
  private scratchColor = new THREE.Color();

  /** 0 = fully faded out (mode inactive), 1 = fully present. */
  private modeProgress = 0;
  private visible = false;
  /** Ambient temperature used for the heat calculation (°C). */
  private ambientTemp = -28.4;
  private frameCounter = 0;

  constructor(name: string, specs: ThermalSourceSpec[]) {
    this.group = new THREE.Group();
    this.group.name = name;
    this.group.visible = false;

    this.glowTexture = createRadialGlowTexture();
    this.ringTexture = createHeatRingTexture();
    this.particleTexture = createParticleTexture();
    this.fieldTexture = createThermalFieldTexture();

    specs.forEach((spec) => this.buildSource(spec));
  }

  private buildSource(spec: ThermalSourceSpec): void {
    const group = new THREE.Group();
    group.position.set(spec.position[0], spec.position[1], spec.position[2]);

    // 1. Hot core at the machine itself
    const coreMaterial = new THREE.MeshBasicMaterial({
      map: this.glowTexture,
      color: '#FFB259',
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), coreMaterial);
    core.renderOrder = 3;
    group.add(core);

    // 2. Volumetric aura — one camera-facing billboard scaled to the thermal radius
    const auraMaterial = new THREE.SpriteMaterial({
      map: this.fieldTexture,
      color: '#F97316',
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const aura = new THREE.Sprite(auraMaterial);
    aura.scale.setScalar(spec.thermalRadius * 2.0);
    aura.position.y = 0.9;
    aura.renderOrder = 2;
    group.add(aura);

    // 3. Ground field — radiant footprint showing fall-off over the terrain/floor
    const fieldMaterial = new THREE.MeshBasicMaterial({
      map: this.fieldTexture,
      color: '#EA580C',
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.y = 0.06;
    field.scale.setScalar(spec.thermalRadius * 2.4);
    field.renderOrder = 1;
    group.add(field);

    // 4. Heat waves — expanding ring crests travelling outward
    const waves: THREE.Sprite[] = [];
    const waveMaterials: THREE.SpriteMaterial[] = [];
    for (let i = 0; i < WAVES_PER_SOURCE; i++) {
      const waveMaterial = new THREE.SpriteMaterial({
        map: this.ringTexture,
        color: '#FDBA74',
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const wave = new THREE.Sprite(waveMaterial);
      wave.position.y = 0.75;
      wave.renderOrder = 2;
      group.add(wave);
      waves.push(wave);
      waveMaterials.push(waveMaterial);
    }

    // 5. Radiation drift particles streaming off the machine
    const particlePositions = new Float32Array(PARTICLES_PER_SOURCE * 3);
    const particleLife = new Float32Array(PARTICLES_PER_SOURCE);
    for (let i = 0; i < PARTICLES_PER_SOURCE; i++) {
      this.seedParticle(particlePositions, particleLife, i, 0.5);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    // Per-particle thermal colours so one emitter shows red, orange AND yellow
    // speckle at the same time instead of a single flat hue.
    const particleColors = new Float32Array(PARTICLES_PER_SOURCE * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < PARTICLES_PER_SOURCE; i++) {
      thermalColor(0.34 + Math.random() * 0.66, tint);
      particleColors[i * 3] = tint.r;
      particleColors[i * 3 + 1] = tint.g;
      particleColors[i * 3 + 2] = tint.b;
    }
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      map: this.particleTexture,
      vertexColors: true,
      size: 0.42,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMaterial);
    particles.renderOrder = 3;
    group.add(particles);

    this.group.add(group);

    this.sources.push({
      spec,
      group,
      core,
      coreMaterial,
      aura,
      auraMaterial,
      field,
      fieldMaterial,
      waves,
      waveMaterials,
      particles,
      particleMaterial,
      particlePositions,
      particleLife,
      intensity: spec.thermalOutput * 0.5,
    });
  }

  /** Places one radiation particle at a random point near the machine. */
  private seedParticle(
    positions: Float32Array,
    life: Float32Array,
    index: number,
    initialLife: number
  ): void {
    const angle = Math.random() * Math.PI * 2;
    const startRadius = Math.random() * 1.1;
    positions[index * 3] = Math.cos(angle) * startRadius;
    positions[index * 3 + 1] = 0.3 + Math.random() * 1.4;
    positions[index * 3 + 2] = Math.sin(angle) * startRadius;
    life[index] = initialLife * (0.4 + Math.random() * 0.6);
  }

  // -------------------------------------------------------------------------
  // Telemetry binding
  // -------------------------------------------------------------------------

  /**
   * Derives each source's intensity from live telemetry. Data-driven: the
   * machine's rated `thermalOutput` is modulated by how far its temperature
   * sits above ambient, so heat output tracks the simulated plant state.
   */
  public applyTelemetry(
    assets: Record<string, { asset_id: string; status?: string; current_temperature?: number; temperature?: number }>,
    ambientTemperature: number
  ): void {
    this.ambientTemp = ambientTemperature;

    this.sources.forEach((source) => {
      const asset = assets[source.spec.id];
      let heat = 0.5; // no telemetry for this source → mid-field
      let severity = 0.35;

      if (asset) {
        const temp = asset.current_temperature ?? asset.temperature ?? ambientTemperature;
        heat = Math.min(1, Math.max(0, (temp - ambientTemperature) / 70));
        severity = 0.4;

        if (asset.status === 'CRITICAL' || asset.status === 'FAILED') severity = 1.0;
        else if (asset.status === 'WARNING' || asset.status === 'DEGRADING') severity = 0.7;
        else if (asset.status === 'OFFLINE' || asset.status === 'UNKNOWN') severity = 0.15;
      }

      source.intensity = Math.min(1, source.spec.thermalOutput * (0.35 + 0.65 * heat) * (0.6 + 0.4 * severity));
    });
  }

  // -------------------------------------------------------------------------
  // Mode control (with smooth fade, used by the mode transition system)
  // -------------------------------------------------------------------------

  /** `progress` 0 → invisible, 1 → fully present. */
  public setModeProgress(progress: number): void {
    this.modeProgress = Math.min(1, Math.max(0, progress));
    this.visible = this.modeProgress > 0.002;
    this.group.visible = this.visible;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  // -------------------------------------------------------------------------
  // Animation
  // -------------------------------------------------------------------------

  public update(dt: number, time: number): void {
    if (!this.visible) return;

    const delta = Math.min(dt, 0.08);
    this.frameCounter++;

    this.sources.forEach((source, sourceIndex) => {
      const intensity = source.intensity * this.modeProgress;
      const radius = source.spec.thermalRadius;

      // ── Colourful thermal ramp ────────────────────────────────────────────
      // Every layer samples a DIFFERENT point of the same red → orange → yellow
      // → white-hot palette, so one machine shows the whole spectrum at once:
      // deep-red ground field, orange aura, yellow travelling waves, white-hot core.
      const heat = 0.3 + 0.7 * intensity; // hotter machines push the whole ramp up

      // 1. Hot core — near-white at full output, warm amber when idling
      thermalColor(0.62 + 0.3 * heat, this.scratchColor);
      source.coreMaterial.color.copy(this.scratchColor);
      source.coreMaterial.opacity = 0.42 + 0.55 * intensity;
      const corePulse = 1 + Math.sin(time * (1.6 + intensity * 2.2) + sourceIndex) * 0.07;
      source.core.scale.setScalar((0.75 + intensity * 0.95) * corePulse);

      // 2. Volumetric aura — orange/yellow band
      thermalColor(0.5 + 0.35 * heat, this.scratchColor);
      source.auraMaterial.color.copy(this.scratchColor);
      source.auraMaterial.opacity = 0.26 * intensity;
      source.aura.scale.setScalar(radius * (2.0 + 0.1 * Math.sin(time * 1.2 + sourceIndex)));

      // 3. Ground radiation field — deep red at the machine, falling off
      thermalColor(0.12 + 0.38 * heat, this.scratchColor);
      source.fieldMaterial.color.copy(this.scratchColor);
      source.fieldMaterial.opacity = 0.34 * intensity;

      // 4. Heat waves — deep red → yellow as they travel outward. The ramp
      //    spans a wide band and each ring is offset so the gradient reads
      //    deep red at the source through orange to yellow at the rim.
      source.waves.forEach((wave, waveIndex) => {
        const phase = (time * (0.28 + intensity * 0.32) + waveIndex / WAVES_PER_SOURCE) % 1;
        const spread = 0.18 + phase * 1.15;
        wave.scale.setScalar(radius * spread * 2.0);
        const fade = Math.sin(phase * Math.PI);
        thermalColor(0.18 + 0.62 * heat + waveIndex * 0.12, this.scratchColor);
        source.waveMaterials[waveIndex].color.copy(this.scratchColor);
        source.waveMaterials[waveIndex].opacity = 0.7 * fade * intensity;
      });

      // 5. Radiation drift particles — rise, spread, fade, recycle
      if (this.frameCounter % 2 === 0 || intensity > 0.5) {
        const positions = source.particlePositions;
        const life = source.particleLife;
        const riseSpeed = 1.1 + intensity * 1.9;

        for (let i = 0; i < PARTICLES_PER_SOURCE; i++) {
          life[i] -= delta * (0.45 + intensity * 0.5);
          if (life[i] <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.0;
            positions[i * 3] = Math.cos(angle) * r;
            positions[i * 3 + 1] = 0.3 + Math.random() * 0.7;
            positions[i * 3 + 2] = Math.sin(angle) * r;
            life[i] = 0.55 + Math.random() * 0.45;
          } else {
            const angleFromCentre = Math.atan2(positions[i * 3 + 2], positions[i * 3]) || 0;
            const outward = (radius * 0.09) * delta * (0.5 + intensity);
            positions[i * 3] += Math.cos(angleFromCentre) * outward;
            positions[i * 3 + 2] += Math.sin(angleFromCentre) * outward;
            positions[i * 3 + 1] += riseSpeed * delta;
          }
        }
        (source.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }
      source.particleMaterial.opacity = 0.75 * intensity;

      void delta;
    });
  }

  /** Number of configured thermal sources (UI provenance). */
  public getSourceCount(): number {
    return this.sources.length;
  }

  /** Ambient temperature the emission field is currently referenced against. */
  public getAmbientTemperature(): number {
    return this.ambientTemp;
  }

  public dispose(): void {
    this.sources.forEach((source) => {
      source.core.geometry.dispose();
      source.coreMaterial.dispose();
      source.auraMaterial.dispose();
      source.field.geometry.dispose();
      source.fieldMaterial.dispose();
      source.waves.forEach((_wave, i) => {
        source.waveMaterials[i].dispose();
      });
      source.particles.geometry.dispose();
      source.particleMaterial.dispose();
    });
    this.sources = [];
    this.glowTexture.dispose();
    this.ringTexture.dispose();
    this.particleTexture.dispose();
    this.fieldTexture.dispose();
  }
}
