/**
 * DAKSHIN — MAITRI CONTAINER FLEET & OUTBUILDINGS
 *
 * Reproduces every auxiliary structure visible in the MAITRI references:
 * - The red/orange container fleet: one isolated unit beyond Arm B, the
 *   5-unit west cluster (including the large white-roofed unit and a white
 *   container), and the two-unit foreground apron pair
 * - The dark green waste container east of the knuckle
 * - The small white hut with pitched grey roof (potable water store)
 * - The far-west greywater treatment shelter
 * - The east utility plant house where the service conduits converge
 * - The small green site loader seen beside Arm A
 *
 * These structures are deliberately NEVER ghosted in X-Ray mode — the
 * reference X-ray view keeps all site context opaque.
 */

import * as THREE from 'three';

interface ContainerSpec {
  x: number;
  z: number;
  colour: string;
  rotationY?: number;
  whiteRoof?: boolean;
}

const CONTAINER_LENGTH = 6.0;
const CONTAINER_HEIGHT = 2.55;
const CONTAINER_DEPTH = 2.45;

export class MaitriContainersAndOutbuildings {
  public group: THREE.Group;

  public materials: {
    orange: THREE.MeshStandardMaterial;
    red: THREE.MeshStandardMaterial;
    white: THREE.MeshStandardMaterial;
    roofWhite: THREE.MeshStandardMaterial;
    darkGreen: THREE.MeshStandardMaterial;
    hutWall: THREE.MeshStandardMaterial;
    hutRoof: THREE.MeshStandardMaterial;
    greyWall: THREE.MeshStandardMaterial;
    trim: THREE.MeshStandardMaterial;
    loaderGreen: THREE.MeshStandardMaterial;
    blue: THREE.MeshStandardMaterial;
    drumGreen: THREE.MeshStandardMaterial;
    tyre: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
  };

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Maitri_ContainersAndOutbuildings';

    this.materials = {
      orange: new THREE.MeshStandardMaterial({ color: '#E2571E', roughness: 0.62, metalness: 0.32 }),
      red: new THREE.MeshStandardMaterial({ color: '#B93A2B', roughness: 0.62, metalness: 0.32 }),
      white: new THREE.MeshStandardMaterial({ color: '#E9EDF0', roughness: 0.55, metalness: 0.25 }),
      roofWhite: new THREE.MeshStandardMaterial({ color: '#F7F9FA', roughness: 0.6, metalness: 0.15 }),
      darkGreen: new THREE.MeshStandardMaterial({ color: '#2F4F3A', roughness: 0.7, metalness: 0.25 }),
      hutWall: new THREE.MeshStandardMaterial({ color: '#EDF1F4', roughness: 0.55, metalness: 0.15 }),
      hutRoof: new THREE.MeshStandardMaterial({ color: '#8A949C', roughness: 0.7, metalness: 0.2 }),
      greyWall: new THREE.MeshStandardMaterial({ color: '#C3CBD1', roughness: 0.6, metalness: 0.2 }),
      trim: new THREE.MeshStandardMaterial({ color: '#004E64', roughness: 0.5, metalness: 0.3 }),
      loaderGreen: new THREE.MeshStandardMaterial({ color: '#3F6B3A', roughness: 0.55, metalness: 0.4 }),
      blue: new THREE.MeshStandardMaterial({ color: '#1E5F8E', roughness: 0.6, metalness: 0.3 }),
      drumGreen: new THREE.MeshStandardMaterial({ color: '#2E6B44', roughness: 0.55, metalness: 0.45 }),
      tyre: new THREE.MeshStandardMaterial({ color: '#1C1C1C', roughness: 0.9 }),
      metal: new THREE.MeshStandardMaterial({ color: '#4B5563', roughness: 0.5, metalness: 0.7 }),
    };

    this.buildContainerFleet();
    this.buildWasteContainer();
    this.buildWhiteHut();
    this.buildTreatmentShelter();
    this.buildUtilityPlantHouse();
    this.buildLoader();
    this.buildDrumCluster();
    this.buildIncinerator();
  }

  /**
   * Chemical & waste incinerator — the unit the station reference labels
   * "Chemical and Waste Incinerator B", fed by its own waste line.
   */
  private buildIncinerator(): void {
    const unit = new THREE.Group();
    unit.position.set(-40.4, 0, 5.2);
    unit.rotation.y = 0.25;

    // Containment body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.4), this.materials.greyWall);
    body.position.y = 1.1;
    body.castShadow = true;
    body.receiveShadow = true;
    unit.add(body);

    // Combustion chamber drum
    const chamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16),
      this.materials.hutRoof
    );
    chamber.rotation.z = Math.PI / 2;
    chamber.position.set(1.7, 1.25, 0);
    chamber.castShadow = true;
    unit.add(chamber);

    // Exhaust stack
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.2, 3.4, 12),
      this.materials.metal
    );
    stack.position.set(-0.8, 3.5, -0.6);
    stack.castShadow = true;
    unit.add(stack);

    // Stack cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12), this.materials.metal);
    cap.position.set(-0.8, 5.24, -0.6);
    unit.add(cap);

    // Access door + control cabinet
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.6, 0.08), this.materials.metal);
    door.position.set(0, 0.85, 1.22);
    unit.add(door);

    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.45), this.materials.trim);
    cabinet.position.set(1.55, 0.55, 1.05);
    unit.add(cabinet);

    this.group.add(unit);
  }

  /**
   * Green cylindrical drums — the fuel/oil drum store visible in the station
   * reference alongside the container yard.
   */
  private buildDrumCluster(): void {
    const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.12, 14);
    const rimGeo = new THREE.TorusGeometry(0.42, 0.045, 6, 14);

    const clusters: { x: number; z: number; count: number }[] = [
      { x: -33.5, z: 9.5, count: 4 },
      { x: -21.5, z: 10.5, count: 3 },
    ];

    clusters.forEach((cluster) => {
      for (let i = 0; i < cluster.count; i++) {
        const drum = new THREE.Mesh(drumGeo, this.materials.drumGreen);
        drum.position.set(
          cluster.x + (i % 2) * 0.95,
          0.56,
          cluster.z + Math.floor(i / 2) * 0.95
        );
        drum.castShadow = true;
        drum.receiveShadow = true;
        this.group.add(drum);

        // Rolling hoops top and bottom
        [0.34, -0.34].forEach((offsetY) => {
          const rim = new THREE.Mesh(rimGeo, this.materials.drumGreen);
          rim.rotation.x = Math.PI / 2;
          rim.position.set(drum.position.x, drum.position.y + offsetY, drum.position.z);
          this.group.add(rim);
        });
      }
    });
  }

  // ── Container fleet ─────────────────────────────────────────────────────

  private buildContainerFleet(): void {
    const fleet: ContainerSpec[] = [
      // Isolated unit beyond Arm B (reference: single container north of complex)
      { x: -14.0, z: -31.0, colour: 'orange', rotationY: 0.15 },

      // West cluster — the fuel farm / stores group with the white-roofed unit
      { x: -38.0, z: 8.0, colour: 'orange', whiteRoof: true, rotationY: -0.08 },
      { x: -41.5, z: 11.5, colour: 'red', rotationY: 0.2 },
      { x: -35.0, z: 12.5, colour: 'red', rotationY: -0.15 },
      { x: -38.5, z: 14.5, colour: 'orange', rotationY: 0.05 },
      { x: -33.0, z: 6.0, colour: 'white', rotationY: 0.1 },

      // Foreground apron pair
      { x: -20.0, z: 14.5, colour: 'orange', rotationY: 0.12 },
      { x: -15.5, z: 15.5, colour: 'red', rotationY: -0.1 },

      // Additional units visible in the station reference yard
      { x: -30.5, z: 8.5, colour: 'blue', rotationY: 0.06 },
      { x: -24.0, z: 12.0, colour: 'red', rotationY: -0.18 },
    ];

    fleet.forEach((spec) => this.buildContainer(spec));
  }

  private buildContainer(spec: ContainerSpec): void {
    const material =
      spec.colour === 'red'
        ? this.materials.red
        : spec.colour === 'white'
        ? this.materials.white
        : spec.colour === 'blue'
        ? this.materials.blue
        : this.materials.orange;

    const container = new THREE.Group();
    container.position.set(spec.x, CONTAINER_HEIGHT / 2 + 0.05, spec.z);
    container.rotation.y = spec.rotationY ?? 0;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(CONTAINER_LENGTH, CONTAINER_HEIGHT, CONTAINER_DEPTH),
      material
    );
    body.castShadow = true;
    body.receiveShadow = true;
    container.add(body);

    // Corrugation ribs (reference containers read as ribbed units)
    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, CONTAINER_HEIGHT - 0.25, CONTAINER_DEPTH + 0.06),
        material
      );
      rib.position.x = i * 1.3;
      container.add(rib);
    }

    // White roof panel on the large unit (reference detail)
    if (spec.whiteRoof) {
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(CONTAINER_LENGTH + 0.1, 0.12, CONTAINER_DEPTH + 0.1),
        this.materials.roofWhite
      );
      roof.position.y = CONTAINER_HEIGHT / 2 + 0.06;
      container.add(roof);
    }

    // Corner posts / door frame detail
    [-1, 1].forEach((side) => {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, CONTAINER_HEIGHT, CONTAINER_DEPTH + 0.08),
        this.materials.metal
      );
      post.position.x = side * (CONTAINER_LENGTH / 2 - 0.1);
      container.add(post);
    });

    this.group.add(container);
  }

  /** Dark green waste container / dumpster east of the knuckle. */
  private buildWasteContainer(): void {
    const dumpster = new THREE.Group();
    dumpster.position.set(4.2, 0.65, 6.0);
    dumpster.rotation.y = 0.2;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.2, 1.6),
      this.materials.darkGreen
    );
    body.castShadow = true;
    dumpster.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(3.06, 0.1, 1.66), this.materials.darkGreen);
    lid.position.y = 0.62;
    dumpster.add(lid);

    this.group.add(dumpster);
  }

  /** Small white hut with pitched grey roof — the potable water store. */
  private buildWhiteHut(): void {
    const hut = new THREE.Group();
    hut.position.set(-36.0, 0, -2.0);
    hut.rotation.y = -0.1;

    const body = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.6, 3.2), this.materials.hutWall);
    body.position.y = 1.3;
    body.castShadow = true;
    body.receiveShadow = true;
    hut.add(body);

    // Hipped roof (pyramid) with the grey tone seen in the reference
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.1, 4), this.materials.hutRoof);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 3.15;
    roof.castShadow = true;
    hut.add(roof);

    // Door and small windows
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.08), this.materials.trim);
    door.position.set(0, 0.95, 1.62);
    hut.add(door);

    [-1.6, 1.6].forEach((x) => {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.08), this.materials.greyWall);
      window.position.set(x, 1.7, 1.62);
      hut.add(window);
    });

    this.group.add(hut);
  }

  /** Far-west shelter receiving the greywater collection line. */
  private buildTreatmentShelter(): void {
    const shelter = new THREE.Group();
    shelter.position.set(-44.0, 0, 2.0);

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 2.8), this.materials.hutWall);
    body.position.y = 1.2;
    body.castShadow = true;
    body.receiveShadow = true;
    shelter.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 3.0), this.materials.hutRoof);
    roof.position.y = 2.42;
    shelter.add(roof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.08), this.materials.greyWall);
    door.position.set(0, 0.85, 1.42);
    shelter.add(door);

    this.group.add(shelter);
  }

  /**
   * East utility plant house — the external utility building the reference
   * pipeline view shows all conduits converging into.
   */
  private buildUtilityPlantHouse(): void {
    const plant = new THREE.Group();
    plant.position.set(7.0, 0, 7.0);
    plant.rotation.y = -0.35;

    const body = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.7, 3.6), this.materials.greyWall);
    body.position.y = 1.35;
    body.castShadow = true;
    body.receiveShadow = true;
    plant.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 3.8), this.materials.hutRoof);
    roof.position.y = 2.75;
    plant.add(roof);

    // Teal band trim (station design language)
    const trim = new THREE.Mesh(new THREE.BoxGeometry(5.04, 0.2, 3.64), this.materials.trim);
    trim.position.y = 2.3;
    plant.add(trim);

    // Exhaust stack
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 2.4, 12), this.materials.metal);
    stack.position.set(-1.6, 3.9, -0.6);
    stack.castShadow = true;
    plant.add(stack);

    // Roller door
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 0.08), this.materials.metal);
    door.position.set(0.6, 1.05, 1.82);
    plant.add(door);

    this.group.add(plant);
  }

  /** Small green site loader parked beside Arm A (reference vehicle). */
  private buildLoader(): void {
    const loader = new THREE.Group();
    loader.position.set(-19.5, 0, 6.5);
    loader.rotation.y = 0.5;

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 1.3), this.materials.loaderGreen);
    chassis.position.y = 0.72;
    chassis.castShadow = true;
    loader.add(chassis);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.2), this.materials.loaderGreen);
    cab.position.set(-0.5, 1.45, 0);
    cab.castShadow = true;
    loader.add(cab);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.24), this.materials.greyWall);
    glass.position.set(-0.5, 1.7, 0);
    loader.add(glass);

    const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 1.5), this.materials.metal);
    bucket.position.set(1.5, 0.6, 0);
    loader.add(bucket);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14);
    [
      [-0.8, 0.45],
      [0.8, 0.45],
    ].forEach(([x]) => {
      [-0.72, 0.72].forEach((z) => {
        const wheel = new THREE.Mesh(wheelGeo, this.materials.tyre);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.42, z);
        wheel.castShadow = true;
        loader.add(wheel);
      });
    });

    this.group.add(loader);
  }

  public dispose(): void {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
  }
}
