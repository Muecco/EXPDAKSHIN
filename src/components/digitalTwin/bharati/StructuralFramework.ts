import * as THREE from 'three';

/**
 * StructuralFramework
 *
 * Creates the elevated foundation, steel stilts, cross-trusses,
 * foundation anchor footings, and structural undercarriage of Bharati Station.
 * In Antarctic conditions, elevation on stilts allows 200+ km/h katabatic winds
 * and drifting snow to pass cleanly underneath without building snowbanks.
 */
export class StructuralFramework {
  public group: THREE.Group;
  public materials: {
    steelStilt: THREE.MeshStandardMaterial;
    steelTruss: THREE.MeshStandardMaterial;
    foundationPad: THREE.MeshStandardMaterial;
    accentJoint: THREE.MeshStandardMaterial;
  };

  private stiltMeshes: THREE.Mesh[] = [];
  private trussMeshes: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_StructuralFramework';

    // Materials
    this.materials = {
      steelStilt: new THREE.MeshStandardMaterial({
        color: '#3A4854',
        roughness: 0.45,
        metalness: 0.8,
      }),
      steelTruss: new THREE.MeshStandardMaterial({
        color: '#2C3942',
        roughness: 0.5,
        metalness: 0.75,
      }),
      foundationPad: new THREE.MeshStandardMaterial({
        color: '#606C74',
        roughness: 0.9,
        metalness: 0.1,
      }),
      accentJoint: new THREE.MeshStandardMaterial({
        color: '#D97706',
        roughness: 0.4,
        metalness: 0.6,
      }),
    };

    this.buildUndercarriage();
  }

  private buildUndercarriage() {
    // 12 Primary Heavy Steel Elevation Stilts arranged in 2 rows along length
    // X coordinates: -6.5, -4.0, -1.5, 1.0, 3.5, 6.0
    // Z coordinates: -3.2, 3.2
    // Height: from ground (y=0) to Level 1 deck underside (y=2.2)
    const stiltHeight = 2.2;
    const stiltRadius = 0.22;
    const xCoords = [-6.5, -4.0, -1.5, 1.0, 3.5, 6.0];
    const zCoords = [-3.2, 3.2];

    const stiltGeo = new THREE.CylinderGeometry(stiltRadius, stiltRadius, stiltHeight, 16);
    const padGeo = new THREE.BoxGeometry(0.85, 0.25, 0.85);
    const collarGeo = new THREE.CylinderGeometry(stiltRadius * 1.35, stiltRadius * 1.45, 0.2, 16);

    xCoords.forEach((x) => {
      zCoords.forEach((z) => {
        // Foundation rock-anchor pad
        const pad = new THREE.Mesh(padGeo, this.materials.foundationPad);
        pad.position.set(x, 0.125, z);
        pad.castShadow = true;
        pad.receiveShadow = true;
        this.group.add(pad);

        // Lower anchor bolt collar
        const collar = new THREE.Mesh(collarGeo, this.materials.accentJoint);
        collar.position.set(x, 0.28, z);
        this.group.add(collar);

        // Main cylindrical stilt column
        const stilt = new THREE.Mesh(stiltGeo, this.materials.steelStilt);
        stilt.position.set(x, stiltHeight / 2, z);
        stilt.castShadow = true;
        stilt.receiveShadow = true;
        this.group.add(stilt);
        this.stiltMeshes.push(stilt);

        // Top load-bearing bracket
        const topBracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.2, 0.7),
          this.materials.steelTruss
        );
        topBracket.position.set(x, stiltHeight - 0.05, z);
        this.group.add(topBracket);
      });

      // Transverse I-Beam connecting left and right stilts at this X position
      const transverseBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.35, Math.abs(zCoords[1] - zCoords[0]) + 0.4),
        this.materials.steelTruss
      );
      transverseBeam.position.set(x, stiltHeight + 0.05, 0);
      transverseBeam.castShadow = true;
      this.group.add(transverseBeam);
      this.trussMeshes.push(transverseBeam);

      // Diagonal cross-brace between left and right stilts (K/X-truss)
      this.createCrossBrace([x, 0.3, zCoords[0]], [x, stiltHeight - 0.1, zCoords[1]]);
      this.createCrossBrace([x, 0.3, zCoords[1]], [x, stiltHeight - 0.1, zCoords[0]]);
    });

    // Longitudinal primary girder beams along length (Z = -3.2 and Z = 3.2)
    const lengthSpan = xCoords[xCoords.length - 1] - xCoords[0] + 1.2;
    const centerX = (xCoords[xCoords.length - 1] + xCoords[0]) / 2;

    zCoords.forEach((z) => {
      const longBeam = new THREE.Mesh(
        new THREE.BoxGeometry(lengthSpan, 0.38, 0.28),
        this.materials.steelTruss
      );
      longBeam.position.set(centerX, stiltHeight + 0.08, z);
      longBeam.castShadow = true;
      this.group.add(longBeam);
      this.trussMeshes.push(longBeam);
    });

    // Longitudinal diagonal wind bracing between stilt bays along sides
    for (let i = 0; i < xCoords.length - 1; i++) {
      const x1 = xCoords[i];
      const x2 = xCoords[i + 1];
      zCoords.forEach((z) => {
        // Alternate diagonal bracing in exterior bays
        if (i % 2 === 0) {
          this.createCrossBrace([x1, 0.3, z], [x2, stiltHeight - 0.1, z]);
        } else {
          this.createCrossBrace([x2, 0.3, z], [x1, stiltHeight - 0.1, z]);
        }
      });
    }

    // Main steel deck baseplate grid supporting the entire modular container structure
    const subfloor = new THREE.Mesh(
      new THREE.BoxGeometry(14.8, 0.18, 7.8),
      new THREE.MeshStandardMaterial({
        color: '#1E293B',
        roughness: 0.6,
        metalness: 0.7,
      })
    );
    subfloor.position.set(centerX, stiltHeight + 0.22, 0);
    subfloor.receiveShadow = true;
    subfloor.castShadow = true;
    this.group.add(subfloor);
  }

  private createCrossBrace(start: [number, number, number], end: [number, number, number]) {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const distance = vStart.distanceTo(vEnd);
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);

    const braceGeo = new THREE.CylinderGeometry(0.06, 0.06, distance, 8);
    const brace = new THREE.Mesh(braceGeo, this.materials.steelTruss);
    brace.position.copy(mid);

    // Orient cylinder towards vector direction
    const orientation = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3().subVectors(vEnd, vStart).normalize();
    const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
    const angle = Math.acos(up.dot(direction));
    orientation.makeRotationAxis(axis, angle);
    brace.quaternion.setFromRotationMatrix(orientation);

    brace.castShadow = true;
    this.group.add(brace);
    this.trussMeshes.push(brace);
  }

  public setXRayMode(enabled: boolean) {
    if (enabled) {
      // Structural columns and trusses become visible at ~70% opacity in X-Ray mode
      this.materials.steelStilt.transparent = true;
      this.materials.steelStilt.opacity = 0.72;
      this.materials.steelStilt.depthWrite = false;
      this.materials.steelStilt.metalness = 0.95;

      this.materials.steelTruss.transparent = true;
      this.materials.steelTruss.opacity = 0.68;
      this.materials.steelTruss.depthWrite = false;
      this.materials.steelTruss.metalness = 0.90;
    } else {
      this.materials.steelStilt.transparent = false;
      this.materials.steelStilt.opacity = 1.0;
      this.materials.steelStilt.depthWrite = true;
      this.materials.steelStilt.metalness = 0.8;

      this.materials.steelTruss.transparent = false;
      this.materials.steelTruss.opacity = 1.0;
      this.materials.steelTruss.depthWrite = true;
      this.materials.steelTruss.metalness = 0.75;
    }
  }

  public setHeatMapColor(hexColor: string | null) {
    if (!hexColor) {
      this.materials.steelStilt.color.set('#3A4854');
      this.materials.steelTruss.color.set('#2C3942');
      return;
    }
    this.materials.steelStilt.color.set(hexColor);
    this.materials.steelTruss.color.set(hexColor);
  }

  public dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
