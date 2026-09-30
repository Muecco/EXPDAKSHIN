/**
 * DAKSHIN — MAITRI SITE TERRAIN
 *
 * Reproduces the MAITRI site context from the station reference views:
 * - Rocky scree ground detail over the shared base plane
 * - Large frozen lake (south-west) with shore rim and ice crack lines
 * - Smaller open meltwater pond (north-east) with a rocky rim
 * - Dirt/tyre tracks curving around the complex
 * - Dark elongated coal / gravel heap on the west shore
 * - Scattered boulders and irregular snow patches
 *
 * All scatter uses a deterministic LCG so the site looks identical on every
 * scene rebuild (station switching) — no visual popping.
 *
 * NOTE: geometry is a proportional approximation traced from the reference
 * imagery; the references publish no site dimensions.
 */

import * as THREE from 'three';

/** Deterministic pseudo-random generator (stable scatter layout). */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/** Builds an irregular blob polygon (used for water bodies and snow fields). */
function blobShape(radius: number, wobble: number, steps: number, rand: SeededRandom): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius * (1 - wobble / 2 + rand.next() * wobble);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

export class MaitriSiteTerrain {
  public group: THREE.Group;
  public materials: {
    scree: THREE.MeshStandardMaterial;
    ice: THREE.MeshStandardMaterial;
    iceShore: THREE.MeshStandardMaterial;
    meltwater: THREE.MeshStandardMaterial;
    pondBed: THREE.MeshStandardMaterial;
    track: THREE.MeshStandardMaterial;
    coal: THREE.MeshStandardMaterial;
    boulder: THREE.MeshStandardMaterial;
    snow: THREE.MeshStandardMaterial;
  };
  private rand: SeededRandom;
  private thermalTintables: THREE.MeshStandardMaterial[] = [];
  private baseColors = new Map<THREE.MeshStandardMaterial, THREE.Color>();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Maitri_SiteTerrain';
    this.rand = new SeededRandom(19890421); // Maitri establishment year as seed

    this.materials = {
      scree: new THREE.MeshStandardMaterial({ color: '#7D7466', roughness: 0.98, metalness: 0.0 }),
      ice: new THREE.MeshStandardMaterial({ color: '#B9CEDC', roughness: 0.35, metalness: 0.08 }),
      iceShore: new THREE.MeshStandardMaterial({ color: '#C8D6DF', roughness: 0.85, metalness: 0.02 }),
      meltwater: new THREE.MeshStandardMaterial({ color: '#3F6C74', roughness: 0.25, metalness: 0.1 }),
      pondBed: new THREE.MeshStandardMaterial({ color: '#5C6A63', roughness: 0.95 }),
      track: new THREE.MeshStandardMaterial({ color: '#6E6558', roughness: 1.0 }),
      coal: new THREE.MeshStandardMaterial({ color: '#3A3733', roughness: 1.0 }),
      boulder: new THREE.MeshStandardMaterial({ color: '#6B665E', roughness: 0.95 }),
      snow: new THREE.MeshStandardMaterial({ color: '#E8EEF2', roughness: 0.9, metalness: 0.0 }),
    };

    // Materials that receive a cold thermal tint in the heat-map vision mode.
    this.thermalTintables = [this.materials.scree, this.materials.boulder, this.materials.track];
    this.thermalTintables.forEach((m) => this.baseColors.set(m, m.color.clone()));

    this.buildFrozenLake();
    this.buildMeltPond();
    this.buildTracks();
    this.buildCoalHeap();
    this.buildBoulderField();
    this.buildSnowPatches();
  }

  // ── Frozen lake (south-west) ─────────────────────────────────────────────

  private buildFrozenLake(): void {
    const centreX = -46;
    const centreZ = -18;

    // Snow-covered shore rim
    const shore = new THREE.Mesh(
      new THREE.ShapeGeometry(blobShape(21, 0.22, 26, this.rand)),
      this.materials.iceShore
    );
    shore.rotation.x = -Math.PI / 2;
    shore.position.set(centreX, 0.014, centreZ);
    shore.receiveShadow = true;
    this.group.add(shore);

    // Ice sheet
    const ice = new THREE.Mesh(
      new THREE.ShapeGeometry(blobShape(18.5, 0.2, 26, this.rand)),
      this.materials.ice
    );
    ice.rotation.x = -Math.PI / 2;
    ice.position.set(centreX, 0.022, centreZ);
    ice.receiveShadow = true;
    this.group.add(ice);

    // Ice crack lines (thin dark strips across the sheet)
    for (let i = 0; i < 7; i++) {
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(this.rand.range(4, 15), 0.01, 0.06),
        new THREE.MeshBasicMaterial({ color: '#8FA6B5', transparent: true, opacity: 0.75 })
      );
      crack.position.set(centreX + this.rand.range(-12, 12), 0.03, centreZ + this.rand.range(-12, 12));
      crack.rotation.y = this.rand.range(0, Math.PI);
      this.group.add(crack);
    }
  }

  // ── Open meltwater pond (north-east) ─────────────────────────────────────

  private buildMeltPond(): void {
    const centreX = 14;
    const centreZ = -20;

    const bed = new THREE.Mesh(
      new THREE.ShapeGeometry(blobShape(11.5, 0.2, 24, this.rand)),
      this.materials.pondBed
    );
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(centreX, 0.012, centreZ);
    bed.receiveShadow = true;
    this.group.add(bed);

    const water = new THREE.Mesh(
      new THREE.ShapeGeometry(blobShape(9.8, 0.18, 24, this.rand)),
      this.materials.meltwater
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(centreX, 0.02, centreZ);
    water.receiveShadow = true;
    this.group.add(water);

    // Rocky rim around the pond
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + this.rand.range(-0.2, 0.2);
      const radius = this.rand.range(10.5, 12.5);
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(this.rand.range(0.5, 1.3), 0),
        this.materials.boulder
      );
      rock.position.set(
        centreX + Math.cos(angle) * radius,
        this.rand.range(0.05, 0.3),
        centreZ + Math.sin(angle) * radius
      );
      rock.rotation.set(this.rand.range(0, 3), this.rand.range(0, 3), this.rand.range(0, 3));
      rock.castShadow = true;
      this.group.add(rock);
    }
  }

  // ── Dirt tracks ──────────────────────────────────────────────────────────

  private buildTracks(): void {
    const trackPaths: [number, number, number][][] = [
      // Track passing behind the complex toward the pond
      [
        [-58, 0.035, 6], [-44, 0.035, 2], [-32, 0.035, -2], [-18, 0.035, -6],
        [-6, 0.035, -10], [4, 0.035, -14], [12, 0.035, -24],
      ],
      // Track curving in front of the complex past the container apron
      [
        [-56, 0.035, 22], [-38, 0.035, 20], [-24, 0.035, 18], [-12, 0.035, 14],
        [0, 0.035, 12], [6, 0.035, 4],
      ],
    ];

    trackPaths.forEach((path) => {
      const curve = new THREE.CatmullRomCurve3(
        path.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
      );
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 1.7, 8, false),
        this.materials.track
      );
      mesh.scale.y = 0.012; // flatten the tube into a ground ribbon
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });
  }

  // ── Coal / gravel heap (west shore) ──────────────────────────────────────

  private buildCoalHeap(): void {
    const heap = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), this.materials.coal);
    heap.scale.set(9, 1.5, 2.4);
    heap.position.set(-44, 0.5, 14);
    heap.rotation.y = 0.18;
    heap.castShadow = true;
    heap.receiveShadow = true;
    this.group.add(heap);
  }

  // ── Boulder field ────────────────────────────────────────────────────────

  private buildBoulderField(): void {
    // Skip the complex footprint, the two water bodies and the container aprons.
    const excluded: [number, number, number][] = [
      [-14, -6, 22],  // complex corridor
      [-46, -18, 22], // frozen lake
      [14, -20, 13],  // melt pond
      [-36, 11, 12],  // fuel farm cluster
    ];

    let placed = 0;
    let attempts = 0;
    while (placed < 22 && attempts < 400) {
      attempts++;
      const x = this.rand.range(-62, 40);
      const z = this.rand.range(-40, 30);
      const blocked = excluded.some(([ex, ez, r]) => Math.hypot(x - ex, z - ez) < r);
      if (blocked) continue;

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(this.rand.range(0.35, 1.5), 0),
        this.materials.boulder
      );
      rock.position.set(x, this.rand.range(-0.05, 0.35), z);
      rock.rotation.set(this.rand.range(0, 3), this.rand.range(0, 3), this.rand.range(0, 3));
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
      placed++;
    }
  }

  // ── Snow patches ─────────────────────────────────────────────────────────

  private buildSnowPatches(): void {
    for (let i = 0; i < 14; i++) {
      const radius = this.rand.range(1.8, 5.5);
      const patch = new THREE.Mesh(
        new THREE.ShapeGeometry(blobShape(radius, 0.45, 18, this.rand)),
        this.materials.snow
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(this.rand.range(-55, 34), 0.016, this.rand.range(-36, 26));
      patch.receiveShadow = true;
      this.group.add(patch);
    }
  }

  // ── Vision-mode support ──────────────────────────────────────────────────

  /**
   * Applies the cold thermal tint the heat-map reference shows for terrain.
   * Pass `null` to restore the natural rock colours.
   */
  public setThermalTint(hexColor: string | null): void {
    this.thermalTintables.forEach((material) => {
      const base = this.baseColors.get(material);
      if (!base) return;
      material.color.copy(hexColor ? new THREE.Color(hexColor) : base);
    });
  }

  /** Water bodies are coldest in the thermal reference — darken when tinted. */
  public setWaterThermalTint(hexColor: string | null): void {
    this.materials.ice.color.set(hexColor ?? '#B9CEDC');
    this.materials.meltwater.color.set(hexColor ?? '#3F6C74');
  }

  public dispose(): void {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
  }
}
