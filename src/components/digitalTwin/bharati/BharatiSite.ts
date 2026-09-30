/**
 * DAKSHIN — BHARATI COASTAL SITE
 *
 * Reproduces the BHARATI (Larsemann Hills, Prydz Bay) site context from the
 * orthographic front/side reference and b.png:
 *
 *   • Prydz Bay sea to the west (−X) with drifting ice floes
 *   • Rocky/snowy shoreline banding the coast
 *   • LABORATORY CONTAINERS stacked to the west of the main building
 *   • ACCOMMODATION MODULES stacked to the east
 *   • Ground helipad on the inland rocky rise with a helicopter
 *   • A separate small auxiliary module (per the X-ray reference)
 *   • Scattered boulders and snow patches over the exposed-rock ground
 *
 * Snow-covered, slightly dimmer than the station so the building stays the
 * focal point. Deterministic scatter so the site is stable across rebuilds.
 */

import * as THREE from 'three';

class SeededRandom {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state / 4294967296; }
  range(min: number, max: number): number { return min + this.next() * (max - min); }
}

function blob(radius: number, wobble: number, steps: number, rand: SeededRandom): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = radius * (1 - wobble / 2 + rand.next() * wobble);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  return shape;
}

export class BharatiSite {
  public group: THREE.Group;
  public materials: {
    sea: THREE.MeshStandardMaterial;
    floe: THREE.MeshStandardMaterial;
    shoreline: THREE.MeshStandardMaterial;
    snow: THREE.MeshStandardMaterial;
    boulder: THREE.MeshStandardMaterial;
    containerOrange: THREE.MeshStandardMaterial;
    containerBlue: THREE.MeshStandardMaterial;
    containerRed: THREE.MeshStandardMaterial;
    containerGreen: THREE.MeshStandardMaterial;
    containerWhite: THREE.MeshStandardMaterial;
    helipad: THREE.MeshStandardMaterial;
    trim: THREE.MeshStandardMaterial;
    module: THREE.MeshStandardMaterial;
  };
  private rand: SeededRandom;
  private floes: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_CoastalSite';
    this.rand = new SeededRandom(20120318); // Bharati establishment year

    this.materials = {
      sea: new THREE.MeshStandardMaterial({ color: '#2F6B8E', roughness: 0.32, metalness: 0.05 }),
      floe: new THREE.MeshStandardMaterial({ color: '#DDE7EE', roughness: 0.75, metalness: 0.02 }),
      shoreline: new THREE.MeshStandardMaterial({ color: '#8A8F95', roughness: 0.95 }),
      snow: new THREE.MeshStandardMaterial({ color: '#E6EDF2', roughness: 0.9 }),
      boulder: new THREE.MeshStandardMaterial({ color: '#6B7A84', roughness: 0.95 }),
      containerOrange: new THREE.MeshStandardMaterial({ color: '#E2571E', roughness: 0.62, metalness: 0.32 }),
      containerBlue: new THREE.MeshStandardMaterial({ color: '#1E5F8E', roughness: 0.6, metalness: 0.3 }),
      containerRed: new THREE.MeshStandardMaterial({ color: '#B93A2B', roughness: 0.62, metalness: 0.32 }),
      containerGreen: new THREE.MeshStandardMaterial({ color: '#3F7A4E', roughness: 0.62, metalness: 0.3 }),
      containerWhite: new THREE.MeshStandardMaterial({ color: '#E9EDF0', roughness: 0.55, metalness: 0.25 }),
      helipad: new THREE.MeshStandardMaterial({ color: '#33414D', roughness: 0.75 }),
      trim: new THREE.MeshStandardMaterial({ color: '#004E64', roughness: 0.5, metalness: 0.3 }),
      module: new THREE.MeshStandardMaterial({ color: '#EDF1F4', roughness: 0.5, metalness: 0.18 }),
    };

    this.buildSea();
    this.buildShoreline();
    this.buildContainerYards();
    this.buildGroundHelipad();
    this.buildAuxiliaryModule();
    this.buildBouldersAndSnow();
  }

  // ── Prydz Bay sea (west) + ice floes ─────────────────────────────────────
  private buildSea(): void {
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(70, 90, 8, 8), this.materials.sea);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-58, -0.05, 0);
    sea.receiveShadow = true;
    this.group.add(sea);

    // Drifting ice floes
    for (let i = 0; i < 12; i++) {
      const floe = new THREE.Mesh(
        new THREE.CircleGeometry(this.rand.range(1.2, 3.4), 12),
        this.materials.floe
      );
      floe.rotation.x = -Math.PI / 2;
      floe.position.set(this.rand.range(-88, -26), 0.03, this.rand.range(-36, 36));
      this.group.add(floe);
      this.floes.push(floe);
    }
  }

  // ── Rocky shoreline band along the coast ──────────────────────────────────
  private buildShoreline(): void {
    const shore = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.5, 84),
      this.materials.shoreline
    );
    shore.position.set(-24.5, -0.18, 0);
    shore.receiveShadow = true;
    this.group.add(shore);
  }

  // ── Stacked container yards (lab west, accommodation east) ────────────────
  private buildContainerYards(): void {
    const mats = [
      this.materials.containerOrange,
      this.materials.containerBlue,
      this.materials.containerRed,
      this.materials.containerGreen,
      this.materials.containerWhite,
    ];

    // West — laboratory containers (toward the sea)
    this.buildStack({ x: -14.0, z: 2.0, cols: 3, rows: 2, mats });
    // East — accommodation modules
    this.buildStack({ x: 13.0, z: 2.0, cols: 2, rows: 2, mats });

    // A few single containers on the apron
    [
      [-11.0, 4.5, 'orange'], [-8.5, 4.0, 'blue'], [9.5, 4.2, 'green'], [11.5, -3.0, 'red'],
    ].forEach(([x, z, c]) => {
      const mat = c === 'orange' ? this.materials.containerOrange
        : c === 'blue' ? this.materials.containerBlue
        : c === 'green' ? this.materials.containerGreen
        : this.materials.containerRed;
      const box = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.5, 2.3), mat);
      box.position.set(x as number, 1.28, z as number);
      box.castShadow = true;
      box.receiveShadow = true;
      this.group.add(box);
    });
  }

  private buildStack(opts: { x: number; z: number; cols: number; rows: number; mats: THREE.MeshStandardMaterial[] }): void {
    const { x, z, cols, rows, mats } = opts;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const mat = mats[(r * cols + c) % mats.length];
        const box = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.5, 2.3), mat);
        box.position.set(x + c * 5.6, 1.28 + r * 2.55, z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.group.add(box);
      }
    }
  }

  // ── Ground helipad (inland) with helicopter ──────────────────────────────
  private buildGroundHelipad(): void {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.28, 28), this.materials.helipad);
    pad.position.set(16.0, 0.14, -6.0);
    pad.castShadow = true;
    pad.receiveShadow = true;
    this.group.add(pad);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.0, 32),
      new THREE.MeshBasicMaterial({ color: '#FACC15', side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(16.0, 0.3, -6.0);
    this.group.add(ring);

    // Helicopter silhouette
    const heli = new THREE.Group();
    heli.position.set(16.0, 0.35, -6.0);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.0), this.materials.trim);
    body.position.y = 0.6;
    heli.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.28), this.materials.trim);
    tail.position.set(-2.0, 0.75, 0);
    heli.add(tail);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.05, 0.3), this.materials.boulder);
    rotor.position.y = 1.25;
    heli.add(rotor);
    this.group.add(heli);
  }

  // ── Small auxiliary module (per X-ray reference) ─────────────────────────
  private buildAuxiliaryModule(): void {
    const mod = new THREE.Group();
    mod.position.set(11.0, 0, -5.5);
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 3.0), this.materials.module);
    body.position.y = 1.2;
    body.castShadow = true;
    mod.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 3.2), this.materials.shoreline);
    roof.position.y = 2.42;
    mod.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.08), this.materials.trim);
    door.position.set(0, 0.85, 1.5);
    mod.add(door);
    this.group.add(mod);
  }

  // ── Boulders + snow patches ───────────────────────────────────────────────
  private buildBouldersAndSnow(): void {
    for (let i = 0; i < 14; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(this.rand.range(0.4, 1.4), 0),
        this.materials.boulder
      );
      rock.position.set(this.rand.range(-20, 22), this.rand.range(0, 0.4), this.rand.range(-14, 14));
      rock.rotation.set(this.rand.range(0, 3), this.rand.range(0, 3), this.rand.range(0, 3));
      rock.castShadow = true;
      this.group.add(rock);
    }
    for (let i = 0; i < 10; i++) {
      const patch = new THREE.Mesh(
        new THREE.ShapeGeometry(blob(this.rand.range(1.6, 4.0), 0.45, 16, this.rand)),
        this.materials.snow
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(this.rand.range(-18, 20), 0.016, this.rand.range(-12, 12));
      this.group.add(patch);
    }
  }

  public update(_dt: number, time: number): void {
    // Gentle floe drift
    this.floes.forEach((f, i) => {
      f.position.x += Math.sin(time * 0.2 + i) * 0.002;
      f.position.z += Math.cos(time * 0.16 + i) * 0.002;
    });
  }

  public dispose(): void {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.group.traverse((c) => { if (c instanceof THREE.Mesh) c.geometry.dispose(); });
  }
}
