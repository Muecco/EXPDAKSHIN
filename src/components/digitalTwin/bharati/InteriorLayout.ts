import * as THREE from 'three';

/**
 * InteriorLayout
 *
 * Implements the 2-tier internal architectural zoning of BHARATI Station:
 * - Level 1: Generator bay, Battery room, Water desalination/RO bay, HVAC room,
 *            Workshops, Central service corridor, and Air Quality lab
 * - Level 2: Station Command & Control center, Atmospheric Physics lab,
 *            Biology & Earth Science lab, Medical clinic, Crew living berths,
 *            Dining mess hall, and interconnecting vertical stairwell
 *
 * Designed to become fully visible, prominent, and inspectable in X-Ray mode.
 */
export class InteriorLayout {
  public group: THREE.Group;
  public partitionMeshes: THREE.Mesh[] = [];
  public floorMeshes: THREE.Mesh[] = [];

  public materials: {
    deckFloor: THREE.MeshStandardMaterial;
    interiorWall: THREE.MeshStandardMaterial;
    labBench: THREE.MeshStandardMaterial;
    glassPartition: THREE.MeshStandardMaterial;
    accentDoor: THREE.MeshStandardMaterial;
  };

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_InteriorLayout';

    this.materials = {
      deckFloor: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.6,
        metalness: 0.2,
      }),
      interiorWall: new THREE.MeshStandardMaterial({
        color: '#94A3B8',
        roughness: 0.7,
        metalness: 0.1,
      }),
      labBench: new THREE.MeshStandardMaterial({
        color: '#0284C7',
        roughness: 0.4,
        metalness: 0.3,
      }),
      glassPartition: new THREE.MeshStandardMaterial({
        color: '#38BDF8',
        roughness: 0.1,
        metalness: 0.5,
        transparent: true,
        opacity: 0.55,
      }),
      accentDoor: new THREE.MeshStandardMaterial({
        color: '#D97706',
        roughness: 0.5,
        metalness: 0.3,
      }),
    };

    this.buildLevel1Layout();
    this.buildLevel2Layout();
    this.buildVerticalCirculation();
  }

  /**
   * LEVEL 1: Utilities, Power Generation, and Technical Operations (y: 2.3 to 4.3)
   */
  private buildLevel1Layout() {
    // Intermediate floor deck between Level 1 and Level 2 (y = 4.25)
    const midDeck = new THREE.Mesh(
      new THREE.BoxGeometry(13.0, 0.12, 7.0),
      this.materials.deckFloor
    );
    midDeck.position.set(-0.3, 4.25, 0);
    this.group.add(midDeck);
    this.floorMeshes.push(midDeck);

    // 1. Central spine corridor dividing Level 1 north and south
    // Transverse partition wall separating rear Power Plant Bay (x < -2.2)
    const genBayWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.85, 7.0),
      this.materials.interiorWall
    );
    genBayWall.position.set(-2.2, 3.25, 0);
    this.group.add(genBayWall);
    this.partitionMeshes.push(genBayWall);

    // Acoustic firewall separating Generator A and Generator B
    const genAcousticWall = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.85, 0.12),
      this.materials.interiorWall
    );
    genAcousticWall.position.set(-4.5, 3.25, 0);
    this.group.add(genAcousticWall);
    this.partitionMeshes.push(genAcousticWall);

    // 2. Battery Bay partition (x = -2.2 to 0.5, z = -1.2 to -3.5)
    const batWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 1.85, 0.12),
      this.materials.interiorWall
    );
    batWall.position.set(-0.85, 3.25, -1.2);
    this.group.add(batWall);
    this.partitionMeshes.push(batWall);

    // 3. Water Treatment & RO Desalination Bay partition (x = 0.5 to 3.8, z = -1.2 to -3.5)
    const roWall = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 1.85, 0.12),
      this.materials.interiorWall
    );
    roWall.position.set(2.15, 3.25, -1.2);
    this.group.add(roWall);
    this.partitionMeshes.push(roWall);

    // Transverse partition between Battery and RO bays
    const utilityDivider = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.85, 2.3),
      this.materials.interiorWall
    );
    utilityDivider.position.set(0.5, 3.25, -2.35);
    this.group.add(utilityDivider);
    this.partitionMeshes.push(utilityDivider);

    // 4. District HVAC / Thermal Recovery Loop Bay (x = 0.5 to 3.8, z = 1.2 to 3.5)
    const hvacWall = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 1.85, 0.12),
      this.materials.interiorWall
    );
    hvacWall.position.set(2.15, 3.25, 1.2);
    this.group.add(hvacWall);
    this.partitionMeshes.push(hvacWall);

    // 5. Environmental & Air Quality Air-Lock Bay (x = 3.8 to 6.2)
    const envWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.85, 7.0),
      this.materials.interiorWall
    );
    envWall.position.set(3.8, 3.25, 0);
    this.group.add(envWall);
    this.partitionMeshes.push(envWall);
  }

  /**
   * LEVEL 2: Science Laboratories, Command, Crew Living (y: 4.3 to 6.3)
   */
  private buildLevel2Layout() {
    // 1. Station Command & Operations Center (Front panoramic zone: x = 3.8 to 6.2)
    // Glass acoustic partition separating Command Room from labs
    const cmdWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.85, 6.8),
      this.materials.glassPartition
    );
    cmdWall.position.set(3.8, 5.25, 0);
    this.group.add(cmdWall);
    this.partitionMeshes.push(cmdWall);

    // Operations Command Console desk in front window bay
    const cmdDesk = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.75, 3.6),
      this.materials.labBench
    );
    cmdDesk.position.set(5.5, 4.7, 0);
    this.group.add(cmdDesk);

    // Multi-display monitor bank representation
    const monitorBank = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.45, 3.2),
      new THREE.MeshStandardMaterial({ color: '#0F172A', emissive: '#0284C7', emissiveIntensity: 0.35 })
    );
    monitorBank.position.set(5.7, 5.3, 0);
    this.group.add(monitorBank);

    // 2. Science Laboratories Zone (x = 0.5 to 3.8)
    // Central corridor partition (z = 0)
    const labCorridorWall = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 1.85, 0.1),
      this.materials.interiorWall
    );
    labCorridorWall.position.set(2.15, 5.25, 0);
    this.group.add(labCorridorWall);
    this.partitionMeshes.push(labCorridorWall);

    // Lab workstations
    const labBench1 = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.75, 0.6),
      this.materials.labBench
    );
    labBench1.position.set(2.15, 4.7, -2.4);
    this.group.add(labBench1);

    const labBench2 = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.75, 0.6),
      this.materials.labBench
    );
    labBench2.position.set(2.15, 4.7, 2.4);
    this.group.add(labBench2);

    // 3. Medical Clinic & Sickbay (x = -1.5 to 0.5, z = -3.5 to -1.0)
    const medWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.85, 0.1),
      this.materials.interiorWall
    );
    medWall.position.set(-0.5, 5.25, -1.0);
    this.group.add(medWall);
    this.partitionMeshes.push(medWall);

    // 4. Dining Mess & Galley Kitchen (x = -3.8 to -1.5, z = 1.0 to 3.5)
    const messWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.85, 0.1),
      this.materials.interiorWall
    );
    messWall.position.set(-2.65, 5.25, 1.0);
    this.group.add(messWall);
    this.partitionMeshes.push(messWall);

    // Dining tables
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.72, 0.8),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.5 })
    );
    table.position.set(-2.65, 4.7, 2.2);
    this.group.add(table);

    // 5. Crew Living Berths & Sleeping Modules (Rear: x = -6.5 to -3.8)
    const berthCorridorWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 1.85, 0.1),
      this.materials.interiorWall
    );
    berthCorridorWall.position.set(-5.15, 5.25, 0);
    this.group.add(berthCorridorWall);
    this.partitionMeshes.push(berthCorridorWall);

    // Individual room dividing walls
    [-5.8, -4.5].forEach((x) => {
      const roomDiv = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.85, 3.4),
        this.materials.interiorWall
      );
      roomDiv.position.set(x, 5.25, 1.7);
      this.group.add(roomDiv);
      this.partitionMeshes.push(roomDiv);

      const roomDivN = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.85, 3.4),
        this.materials.interiorWall
      );
      roomDivN.position.set(x, 5.25, -1.7);
      this.group.add(roomDivN);
      this.partitionMeshes.push(roomDivN);
    });
  }

  /**
   * Vertical Inter-Deck Circulation Core (Stairwell shaft linking L1, L2, and Roof)
   */
  private buildVerticalCirculation() {
    const stairShaft = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 4.1, 1.4),
      new THREE.MeshStandardMaterial({
        color: '#1E293B',
        roughness: 0.5,
        metalness: 0.6,
      })
    );
    stairShaft.position.set(-0.3, 4.35, 0);
    this.group.add(stairShaft);
    this.partitionMeshes.push(stairShaft);
  }

  public setXRayMode(enabled: boolean) {
    // In X-Ray mode, internal walls become sharp and distinct with cyan/blue edge contrast
    if (enabled) {
      this.materials.interiorWall.color.set('#38BDF8');
      this.materials.interiorWall.roughness = 0.3;
      this.materials.deckFloor.color.set('#0F172A');
    } else {
      this.materials.interiorWall.color.set('#94A3B8');
      this.materials.interiorWall.roughness = 0.7;
      this.materials.deckFloor.color.set('#475569');
    }
  }

  public dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
