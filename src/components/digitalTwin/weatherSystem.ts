import * as THREE from 'three';
import type { WeatherCondition } from '../../types/weather';

/**
 * Procedural Soft Snowflake Texture
 */
function createSnowflakeTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Pale blue-white core with soft translucent halo for visibility against both
  // bright snow-ground and darker atmospheric regions
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0,    'rgba(220, 238, 252, 1.0)');   // Pale blue-white core
  grad.addColorStop(0.18, 'rgba(200, 225, 248, 0.92)');  // Inner halo
  grad.addColorStop(0.45, 'rgba(180, 210, 240, 0.55)');  // Mid halo
  grad.addColorStop(0.72, 'rgba(160, 195, 235, 0.20)');  // Outer translucent fringe
  grad.addColorStop(1,    'rgba(140, 180, 225, 0.0)');   // Fade to transparent

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Procedural Crystal Snowflake Texture (6-ray star)
 */
function createCrystalTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Soft glow disc behind the crystal arms for halo effect
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
  glow.addColorStop(0,    'rgba(190, 225, 248, 0.45)');
  glow.addColorStop(0.6,  'rgba(170, 210, 242, 0.15)');
  glow.addColorStop(1,    'rgba(150, 195, 235, 0.0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);

  ctx.save();
  ctx.translate(32, 32);
  // Ice-blue tinted crystal arms
  ctx.strokeStyle = 'rgba(210, 235, 252, 0.98)';
  ctx.lineWidth = 2.0;
  ctx.shadowColor = 'rgba(160, 210, 248, 0.95)';
  ctx.shadowBlur = 6;

  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 24);

    // Lateral crystal branches
    ctx.moveTo(0, 12);
    ctx.lineTo(6, 16);
    ctx.moveTo(0, 12);
    ctx.lineTo(-6, 16);

    ctx.moveTo(0, 18);
    ctx.lineTo(4, 21);
    ctx.moveTo(0, 18);
    ctx.lineTo(-4, 21);
    ctx.stroke();

    ctx.rotate(Math.PI / 3);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class AntarcticWeatherSystem {
  private scene: THREE.Scene;
  private weatherGroup: THREE.Group;

  // 1. Falling Snow (covers the entire visible 3D plane)
  private snowPoints: THREE.Points;
  private snowPositions: Float32Array;
  private snowVelocities: Float32Array;
  private snowFlutters: Float32Array;
  private snowMaterial: THREE.PointsMaterial;
  private readonly numSnow = 4200;

  // 2. Crystal Snowflakes
  private crystalPoints: THREE.Points;
  private crystalPositions: Float32Array;
  private crystalVelocities: Float32Array;
  private crystalMaterial: THREE.PointsMaterial;
  private readonly numCrystals = 220;

  // 3. Low-Level Ground Blowing Snow
  private groundDriftPoints: THREE.Points;
  private groundDriftPositions: Float32Array;
  private groundDriftVelocities: Float32Array;
  private groundDriftMaterial: THREE.PointsMaterial;
  private readonly numGroundDrift = 750;

  // 4. Wind Flow Streaks (Ribbons)
  private windLines: THREE.LineSegments;
  private windPositions: Float32Array;
  private windAnchors: Float32Array;
  private windPhases: Float32Array;
  private windMaterial: THREE.LineBasicMaterial;
  private readonly numStreaks = 40;
  private readonly segsPerStreak = 5;

  // Ground Mesh reference for accumulation
  private groundMesh: THREE.Mesh | null = null;
  private initialGroundColor = new THREE.Color('#E0E7EC');
  private accumulatedGroundColor = new THREE.Color('#F2F6FA');

  constructor(scene: THREE.Scene, groundMesh?: THREE.Mesh) {
    this.scene = scene;
    this.groundMesh = groundMesh || null;
    this.weatherGroup = new THREE.Group();
    this.weatherGroup.name = 'AntarcticWeatherGroup';
    this.scene.add(this.weatherGroup);

    const snowTex = createSnowflakeTexture();
    const crystalTex = createCrystalTexture();

    // ── 1. Setup Falling Snow across the entire 3D plane ────────────────────
    this.snowPositions = new Float32Array(this.numSnow * 3);
    this.snowVelocities = new Float32Array(this.numSnow);
    this.snowFlutters = new Float32Array(this.numSnow);

    for (let i = 0; i < this.numSnow; i++) {
      // Spread across the entire visible 3D platform (in front of and behind station)
      this.snowPositions[i * 3] = (Math.random() - 0.5) * 260;
      this.snowPositions[i * 3 + 1] = Math.random() * 32 + 0.1;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 260;

      // Varied fall speeds and flutter cycles
      this.snowVelocities[i] = 1.0 + Math.random() * 2.2;
      this.snowFlutters[i] = Math.random() * Math.PI * 2;
    }

    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

    this.snowMaterial = new THREE.PointsMaterial({
      // Pale blue-white tint for crisp contrast against terrain and dark background
      color: '#E0F0FC',
      size: 0.42,
      map: snowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.snowPoints = new THREE.Points(snowGeo, this.snowMaterial);
    this.weatherGroup.add(this.snowPoints);

    // ── 2. Setup Crystal Snowflakes ─────────────────────────────────────────
    this.crystalPositions = new Float32Array(this.numCrystals * 3);
    this.crystalVelocities = new Float32Array(this.numCrystals);

    for (let i = 0; i < this.numCrystals; i++) {
      this.crystalPositions[i * 3] = (Math.random() - 0.5) * 220;
      this.crystalPositions[i * 3 + 1] = Math.random() * 30 + 0.5;
      this.crystalPositions[i * 3 + 2] = (Math.random() - 0.5) * 220;

      this.crystalVelocities[i] = 0.8 + Math.random() * 1.2;
    }

    const crystalGeo = new THREE.BufferGeometry();
    crystalGeo.setAttribute('position', new THREE.BufferAttribute(this.crystalPositions, 3));

    this.crystalMaterial = new THREE.PointsMaterial({
      color: '#D4E9F8',
      size: 0.95,
      map: crystalTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.crystalPoints = new THREE.Points(crystalGeo, this.crystalMaterial);
    this.weatherGroup.add(this.crystalPoints);

    // ── 3. Setup Low-Level Ground Blowing Snow ──────────────────────────────
    this.groundDriftPositions = new Float32Array(this.numGroundDrift * 3);
    this.groundDriftVelocities = new Float32Array(this.numGroundDrift);

    for (let i = 0; i < this.numGroundDrift; i++) {
      this.groundDriftPositions[i * 3] = (Math.random() - 0.5) * 200;
      this.groundDriftPositions[i * 3 + 1] = 0.05 + Math.random() * 1.8;
      this.groundDriftPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      this.groundDriftVelocities[i] = 1.0 + Math.random() * 1.3;
    }

    const groundDriftGeo = new THREE.BufferGeometry();
    groundDriftGeo.setAttribute('position', new THREE.BufferAttribute(this.groundDriftPositions, 3));

    this.groundDriftMaterial = new THREE.PointsMaterial({
      color: '#B8D0E8',
      size: 0.32,
      map: snowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.groundDriftPoints = new THREE.Points(groundDriftGeo, this.groundDriftMaterial);
    this.weatherGroup.add(this.groundDriftPoints);

    // ── 4. Setup Animated Wind Flow Streaks ─────────────────────────────────
    const totalLineVertices = this.numStreaks * this.segsPerStreak * 2;
    this.windPositions = new Float32Array(totalLineVertices * 3);
    this.windAnchors = new Float32Array(this.numStreaks * 3);
    this.windPhases = new Float32Array(this.numStreaks);

    for (let s = 0; s < this.numStreaks; s++) {
      this.windAnchors[s * 3] = (Math.random() - 0.5) * 90;
      this.windAnchors[s * 3 + 1] = 1.0 + Math.random() * 10.0;
      this.windAnchors[s * 3 + 2] = (Math.random() - 0.5) * 90;
      this.windPhases[s] = Math.random() * 50;
    }

    const windGeo = new THREE.BufferGeometry();
    windGeo.setAttribute('position', new THREE.BufferAttribute(this.windPositions, 3));

    this.windMaterial = new THREE.LineBasicMaterial({
      color: '#A8CCE8',
      transparent: true,
      opacity: 0.38,
      linewidth: 1,
      depthWrite: false,
    });
    this.windLines = new THREE.LineSegments(windGeo, this.windMaterial);
    this.weatherGroup.add(this.windLines);
  }

  /**
   * Main Per-Frame Update Loop
   * Driven by requestAnimationFrame in DigitalTwinPanel
   */
  public update(dt: number, weather: WeatherCondition) {
    const delta = Math.min(dt, 0.08);

    // Wind direction unit vectors
    const windRad = (weather.windDirection * Math.PI) / 180;
    const dirX = Math.sin(windRad);
    const dirZ = Math.cos(windRad);

    const windSpeedFactor = (weather.windSpeed / 12);
    const hSpeed = windSpeedFactor * 6.5;

    // ── 1. Update Falling Snow ──────────────────────────────────────────────
    const pos = this.snowPositions;
    const vels = this.snowVelocities;
    const flutters = this.snowFlutters;
    const baseFall = 1.6 + weather.snowIntensity * 1.8;

    for (let i = 0; i < this.numSnow; i++) {
      const idx = i * 3;

      // Vertical fall
      pos[idx + 1] -= (baseFall * vels[i]) * delta;

      // Horizontal wind displacement + subtle natural flutter
      flutters[i] += delta * 2.8;
      const flutterX = Math.sin(flutters[i]) * 0.25;
      const flutterZ = Math.cos(flutters[i]) * 0.25;

      pos[idx] += (dirX * hSpeed + flutterX) * delta;
      pos[idx + 2] += (dirZ * hSpeed + flutterZ) * delta;

      // Recycle when reaching ground or outer volume (extended across entire plane)
      if (
        pos[idx + 1] < 0.1 ||
        pos[idx] > 130 ||
        pos[idx] < -130 ||
        pos[idx + 2] > 130 ||
        pos[idx + 2] < -130
      ) {
        pos[idx + 1] = 28.0 + Math.random() * 3.5;
        // Spawn upstream relative to wind so snowfall enters naturally from windward side
        pos[idx] = (Math.random() - 0.5) * 250 - dirX * 18;
        pos[idx + 2] = (Math.random() - 0.5) * 250 - dirZ * 18;
      }
    }
    this.snowPoints.geometry.attributes.position.needsUpdate = true;

    // Keep snowfall clearly visible in all conditions across the whole environment
    this.snowMaterial.opacity = Math.max(0.40, Math.min(0.92, 0.35 + weather.snowIntensity * 0.55));
    this.snowMaterial.size = 0.36 + weather.snowIntensity * 0.22;

    // ── 2. Update Crystal Snowflakes ────────────────────────────────────────
    const cPos = this.crystalPositions;
    const cVels = this.crystalVelocities;

    for (let i = 0; i < this.numCrystals; i++) {
      const idx = i * 3;
      cPos[idx + 1] -= (1.2 * cVels[i]) * delta;
      cPos[idx] += (dirX * hSpeed * 0.8) * delta;
      cPos[idx + 2] += (dirZ * hSpeed * 0.8) * delta;

      if (cPos[idx + 1] < 0.2 || Math.abs(cPos[idx]) > 110 || Math.abs(cPos[idx + 2]) > 110) {
        cPos[idx + 1] = 27.0 + Math.random() * 3.0;
        cPos[idx] = (Math.random() - 0.5) * 210 - dirX * 14;
        cPos[idx + 2] = (Math.random() - 0.5) * 210 - dirZ * 14;
      }
    }
    this.crystalPoints.geometry.attributes.position.needsUpdate = true;
    this.crystalMaterial.opacity = Math.max(0.30, Math.min(0.85, 0.25 + weather.snowIntensity * 0.60));

    // ── 3. Update Low-Level Ground Blowing Snow ──────────────────────────────
    const gPos = this.groundDriftPositions;
    const gVels = this.groundDriftVelocities;
    const groundSpeed = hSpeed * 1.35; // fast surface skimming

    for (let i = 0; i < this.numGroundDrift; i++) {
      const idx = i * 3;
      gPos[idx] += (dirX * groundSpeed * gVels[i]) * delta;
      gPos[idx + 2] += (dirZ * groundSpeed * gVels[i]) * delta;

      // Wrap ground drift across full terrain
      if (Math.abs(gPos[idx]) > 105 || Math.abs(gPos[idx + 2]) > 105) {
        gPos[idx] = (Math.random() - 0.5) * 190 - dirX * 18;
        gPos[idx + 1] = 0.05 + Math.random() * 1.8;
        gPos[idx + 2] = (Math.random() - 0.5) * 190 - dirZ * 18;
      }
    }
    this.groundDriftPoints.geometry.attributes.position.needsUpdate = true;

    // Ground drift activates significantly in moderate-to-severe winds
    const driftStrength = Math.max(0, (weather.windSpeed - 6) / 22) * weather.snowIntensity;
    this.groundDriftMaterial.opacity = Math.min(0.65, driftStrength * 0.7);

    // ── 4. Update Animated Wind Flow Streaks ─────────────────────────────────
    const wPos = this.windPositions;
    const streakLength = 3.5 + Math.min(6.0, weather.windSpeed * 0.25);
    const segLen = streakLength / this.segsPerStreak;
    let vertIdx = 0;

    for (let s = 0; s < this.numStreaks; s++) {
      this.windPhases[s] += delta * (weather.windSpeed * 0.65);
      if (this.windPhases[s] > 50) this.windPhases[s] = -50;

      const progress = this.windPhases[s];
      const anchorX = this.windAnchors[s * 3] + dirX * progress;
      const anchorY = this.windAnchors[s * 3 + 1];
      const anchorZ = this.windAnchors[s * 3 + 2] + dirZ * progress;

      // Create connected line segment pairs
      for (let seg = 0; seg < this.segsPerStreak; seg++) {
        // Point A
        const distA = seg * segLen;
        const waveA = Math.sin(progress * 0.15 + seg * 0.6) * 0.28;
        const pAx = anchorX + dirX * distA - dirZ * waveA;
        const pAy = anchorY + Math.sin(progress * 0.1 + seg) * 0.15;
        const pAz = anchorZ + dirZ * distA + dirX * waveA;

        // Point B
        const distB = (seg + 1) * segLen;
        const waveB = Math.sin(progress * 0.15 + (seg + 1) * 0.6) * 0.28;
        const pBx = anchorX + dirX * distB - dirZ * waveB;
        const pBy = anchorY + Math.sin(progress * 0.1 + (seg + 1)) * 0.15;
        const pBz = anchorZ + dirZ * distB + dirX * waveB;

        wPos[vertIdx++] = pAx;
        wPos[vertIdx++] = pAy;
        wPos[vertIdx++] = pAz;

        wPos[vertIdx++] = pBx;
        wPos[vertIdx++] = pBy;
        wPos[vertIdx++] = pBz;
      }
    }
    this.windLines.geometry.attributes.position.needsUpdate = true;

    // Wind streak opacity scales with wind speed — boosted so streaks are clearly readable
    this.windMaterial.opacity = Math.max(0.08, Math.min(0.62, (weather.windSpeed / 22) * 0.58));

    // ── 5. Atmospheric Haze Fog Adjustment ──────────────────────────────────
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      // CLEAR: ~0.014; BLIZZARD: ~0.026 (never blanks out the station)
      const targetDensity = 0.014 + weather.snowIntensity * 0.013;
      this.scene.fog.density += (targetDensity - this.scene.fog.density) * 0.05;
    }

    // ── 6. Subtle Visual Snow Accumulation on Ground ─────────────────────────
    if (this.groundMesh && this.groundMesh.material instanceof THREE.MeshStandardMaterial) {
      this.groundMesh.material.color.lerpColors(
        this.initialGroundColor,
        this.accumulatedGroundColor,
        weather.snowIntensity * 0.65
      );
    }
  }

  /**
   * Cleanup Three.js resources
   */
  public dispose() {
    this.weatherGroup.clear();
    this.snowPoints.geometry.dispose();
    this.snowMaterial.dispose();
    this.crystalPoints.geometry.dispose();
    this.crystalMaterial.dispose();
    this.groundDriftPoints.geometry.dispose();
    this.groundDriftMaterial.dispose();
    this.windLines.geometry.dispose();
    this.windMaterial.dispose();
    this.scene.remove(this.weatherGroup);
  }
}
