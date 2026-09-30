import * as THREE from 'three';

/**
 * StationBuilding
 *
 * Implements the exterior architectural shell of BHARATI Antarctic Research Station:
 * - Aerodynamic wind-deflector faceted nose and chamfered profile
 * - Insulated sandwich wall panels and roof sections
 * - Level 2 panoramic ribbon observation glazing (Command Room & Crew Lounge)
 * - Level 1 technical service louvers, air intakes, and crew access portal
 * - Exterior steel gangway, walkway platform, and safety handrails
 * - Roof terrace with Helideck landing platform, ISRO/NRSC satellite radome,
 *   telecom dish, meteorological mast, HVAC chillers, and solar PV arrays
 *
 * Supports transparent / holographic rendering for X-Ray vision mode.
 */
export class StationBuilding {
  public group: THREE.Group;
  public shellMeshes: THREE.Mesh[] = [];
  public roofMeshes: THREE.Mesh[] = [];
  public windowMeshes: THREE.Mesh[] = [];
  public detailMeshes: THREE.Mesh[] = [];

  public materials: {
    wallPanel: THREE.MeshStandardMaterial;
    accentTrim: THREE.MeshStandardMaterial;
    windowGlass: THREE.MeshStandardMaterial;
    roofDeck: THREE.MeshStandardMaterial;
    helideck: THREE.MeshStandardMaterial;
    radome: THREE.MeshStandardMaterial;
    solarCell: THREE.MeshStandardMaterial;
    metalLouver: THREE.MeshStandardMaterial;
    gangwaySteel: THREE.MeshStandardMaterial;
  };

  public edgeLinesGroup: THREE.Group;
  public edgeLineMat: THREE.LineBasicMaterial;

  private isXRayMode: boolean = false;
  private isThermalMode: boolean = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_StationBuilding';

    this.edgeLinesGroup = new THREE.Group();
    this.edgeLinesGroup.name = 'Bharati_EdgeHighlightLines';
    this.group.add(this.edgeLinesGroup);

    this.edgeLineMat = new THREE.LineBasicMaterial({
      color: '#38BDF8',
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    // Normal Materials
    this.materials = {
      wallPanel: new THREE.MeshStandardMaterial({
        color: '#E8EFF4',
        roughness: 0.35,
        metalness: 0.25,
      }),
      accentTrim: new THREE.MeshStandardMaterial({
        color: '#004E64', // Official Deep Teal accent
        roughness: 0.4,
        metalness: 0.4,
      }),
      windowGlass: new THREE.MeshStandardMaterial({
        color: '#1B384A',
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85,
      }),
      roofDeck: new THREE.MeshStandardMaterial({
        color: '#D2DCE4',
        roughness: 0.45,
        metalness: 0.3,
      }),
      helideck: new THREE.MeshStandardMaterial({
        color: '#003645',
        roughness: 0.6,
        metalness: 0.3,
      }),
      radome: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.15,
        metalness: 0.1,
      }),
      solarCell: new THREE.MeshStandardMaterial({
        color: '#0E1F3D',
        roughness: 0.2,
        metalness: 0.8,
      }),
      metalLouver: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.5,
        metalness: 0.7,
      }),
      gangwaySteel: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.55,
        metalness: 0.8,
      }),
    };

    this.buildMainEnvelope();
    this.buildAerodynamicNose();
    this.buildRoofTerraceFeatures();
    this.buildExteriorGangway();
  }

  /**
   * Main elongated 2-tier modular research envelope
   * Dimensions: ~13.6m long (X), 4.0m high (Y: 2.3 to 6.3), 7.6m wide (Z: -3.8 to 3.8)
   */
  private buildMainEnvelope() {
    // 1. Lower Level 1 Cladding (Operations, Power, Laboratories)
    const level1Wall = new THREE.Mesh(
      new THREE.BoxGeometry(13.4, 2.0, 7.4),
      this.materials.wallPanel
    );
    level1Wall.position.set(-0.3, 3.3, 0);
    level1Wall.castShadow = true;
    level1Wall.receiveShadow = true;
    this.group.add(level1Wall);
    this.shellMeshes.push(level1Wall);

    const l1Edge = new THREE.LineSegments(new THREE.EdgesGeometry(level1Wall.geometry), this.edgeLineMat);
    l1Edge.position.copy(level1Wall.position);
    this.edgeLinesGroup.add(l1Edge);

    // Architectural Deep Teal belt trim between Level 1 and Level 2
    const midTrim = new THREE.Mesh(
      new THREE.BoxGeometry(13.6, 0.15, 7.6),
      this.materials.accentTrim
    );
    midTrim.position.set(-0.3, 4.3, 0);
    midTrim.castShadow = true;
    this.group.add(midTrim);
    this.shellMeshes.push(midTrim);

    // 2. Upper Level 2 Cladding (Science Labs, Command, Crew Living)
    const level2Wall = new THREE.Mesh(
      new THREE.BoxGeometry(13.4, 1.9, 7.4),
      this.materials.wallPanel
    );
    level2Wall.position.set(-0.3, 5.3, 0);
    level2Wall.castShadow = true;
    level2Wall.receiveShadow = true;
    this.group.add(level2Wall);
    this.shellMeshes.push(level2Wall);

    const l2Edge = new THREE.LineSegments(new THREE.EdgesGeometry(level2Wall.geometry), this.edgeLineMat);
    l2Edge.position.copy(level2Wall.position);
    this.edgeLinesGroup.add(l2Edge);

    // Roof Parapet / Fascia
    const roofFascia = new THREE.Mesh(
      new THREE.BoxGeometry(13.7, 0.25, 7.7),
      this.materials.accentTrim
    );
    roofFascia.position.set(-0.3, 6.32, 0);
    roofFascia.castShadow = true;
    this.group.add(roofFascia);
    this.roofMeshes.push(roofFascia);

    // Main Roof Surface
    const roofSurface = new THREE.Mesh(
      new THREE.BoxGeometry(13.4, 0.1, 7.4),
      this.materials.roofDeck
    );
    roofSurface.position.set(-0.3, 6.38, 0);
    roofSurface.receiveShadow = true;
    this.group.add(roofSurface);
    this.roofMeshes.push(roofSurface);

    // 3. Panoramic Observation Window Ribbons (Level 2 North & South Facades)
    const windowGeo = new THREE.BoxGeometry(8.5, 0.75, 0.08);
    // South facade window ribbon
    const winSouth = new THREE.Mesh(windowGeo, this.materials.windowGlass);
    winSouth.position.set(0.8, 5.35, 3.74);
    this.group.add(winSouth);
    this.windowMeshes.push(winSouth);

    // North facade window ribbon
    const winNorth = new THREE.Mesh(windowGeo, this.materials.windowGlass);
    winNorth.position.set(0.8, 5.35, -3.74);
    this.group.add(winNorth);
    this.windowMeshes.push(winNorth);

    // Front Command observation bay windows (facing +X)
    const winFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.75, 4.8),
      this.materials.windowGlass
    );
    winFront.position.set(6.42, 5.35, 0);
    this.group.add(winFront);
    this.windowMeshes.push(winFront);

    // Window Mullions (vertical dividers for realistic architectural grid)
    for (let x = -2.5; x <= 4.5; x += 1.4) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.78, 0.12),
        this.materials.accentTrim
      );
      mullion.position.set(x, 5.35, 3.74);
      this.group.add(mullion);
      this.detailMeshes.push(mullion);

      const mullionN = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.78, 0.12),
        this.materials.accentTrim
      );
      mullionN.position.set(x, 5.35, -3.74);
      this.group.add(mullionN);
      this.detailMeshes.push(mullionN);
    }

    // Level 1 Technical Louvers & Generator ventilation ports
    const louverGeo = new THREE.BoxGeometry(2.4, 0.9, 0.06);
    const louver1 = new THREE.Mesh(louverGeo, this.materials.metalLouver);
    louver1.position.set(-4.5, 3.3, 3.73);
    this.group.add(louver1);
    this.detailMeshes.push(louver1);

    const louver2 = new THREE.Mesh(louverGeo, this.materials.metalLouver);
    louver2.position.set(-4.5, 3.3, -3.73);
    this.group.add(louver2);
    this.detailMeshes.push(louver2);

    // Subtle container modular panel seams on exterior
    for (let x = -6.0; x <= 5.5; x += 1.8) {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 3.9, 0.02),
        this.materials.accentTrim
      );
      seam.position.set(x, 4.3, 3.73);
      this.group.add(seam);
      this.detailMeshes.push(seam);

      const seamN = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 3.9, 0.02),
        this.materials.accentTrim
      );
      seamN.position.set(x, 4.3, -3.73);
      this.group.add(seamN);
      this.detailMeshes.push(seamN);
    }
  }

  /**
   * Aerodynamic Wind-Deflector Nose
   * Bharati's distinctive prow-shaped aerodynamic nose at +X cuts Antarctic blizzards
   */
  private buildAerodynamicNose() {
    // Use procedural buffer geometry for the faceted prow
    const geom = new THREE.BufferGeometry();

    // Vertices of the faceted prow:
    // Base at x=6.4, tip at x=8.8
    // y goes from 2.3 to 6.3
    // z goes from -3.7 to +3.7
    // Tip is narrower: z from -2.0 to +2.0
    const p0 = [6.4, 2.3, -3.7]; // Lower left base
    const p1 = [6.4, 2.3, 3.7];  // Lower right base
    const p2 = [6.4, 6.3, 3.7];  // Upper right base
    const p3 = [6.4, 6.3, -3.7]; // Upper left base

    const p4 = [8.8, 3.0, -1.8]; // Lower left prow tip
    const p5 = [8.8, 3.0, 1.8];  // Lower right prow tip
    const p6 = [8.8, 5.6, 1.8];  // Upper right prow tip
    const p7 = [8.8, 5.6, -1.8]; // Upper left prow tip

    // Triangles for the 5 exposed faceted surfaces
    const vertices = new Float32Array([
      // Front flat face (p4, p5, p6, p7)
      ...p4, ...p5, ...p6,
      ...p4, ...p6, ...p7,

      // Right sloping cheek (p1, p5, p6, p2)
      ...p1, ...p5, ...p6,
      ...p1, ...p6, ...p2,

      // Left sloping cheek (p0, p3, p7, p4)
      ...p0, ...p3, ...p7,
      ...p0, ...p7, ...p4,

      // Top aerodynamic hood (p3, p2, p6, p7)
      ...p3, ...p2, ...p6,
      ...p3, ...p6, ...p7,

      // Underside wind-deflection slope (p0, p4, p5, p1)
      ...p0, ...p4, ...p5,
      ...p0, ...p5, ...p1,
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();

    const noseMesh = new THREE.Mesh(geom, this.materials.wallPanel);
    noseMesh.castShadow = true;
    noseMesh.receiveShadow = true;
    this.group.add(noseMesh);
    this.shellMeshes.push(noseMesh);

    const noseEdge = new THREE.LineSegments(new THREE.EdgesGeometry(geom), this.edgeLineMat);
    noseEdge.position.copy(noseMesh.position);
    this.edgeLinesGroup.add(noseEdge);

    // Front nose edge highlight trim
    const noseAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.6, 3.65),
      this.materials.accentTrim
    );
    noseAccent.position.set(8.8, 4.3, 0);
    this.group.add(noseAccent);
    this.shellMeshes.push(noseAccent);
  }

  /**
   * Roof Terrace Infrastructure:
   * - Helideck with landing circle and 'H' marking
   * - NRSC/ISRO Satellite Communication Radome
   * - Telecom dish antenna
   * - Rooftop solar array
   * - Meteorological instrument mast
   * - HVAC chillers & exhaust cowls
   */
  private buildRoofTerraceFeatures() {
    // 1. Helideck Observation Platform (Positioned at rear roof: x = -4.0, z = 0)
    const helideckBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.22, 24),
      this.materials.helideck
    );
    helideckBase.position.set(-4.0, 6.55, 0);
    helideckBase.castShadow = true;
    helideckBase.receiveShadow = true;
    this.group.add(helideckBase);
    this.roofMeshes.push(helideckBase);

    // Helideck perimeter safety ring
    const heliRing = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.22, 32),
      new THREE.MeshBasicMaterial({ color: '#FACC15', side: THREE.DoubleSide })
    );
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(-4.0, 6.67, 0);
    this.group.add(heliRing);
    this.roofMeshes.push(heliRing);

    // Helideck "H" marking (composed of 3 narrow boxes)
    const hBar1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.02, 1.6),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    );
    hBar1.position.set(-4.5, 6.68, 0);
    this.group.add(hBar1);

    const hBar2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.02, 1.6),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    );
    hBar2.position.set(-3.5, 6.68, 0);
    this.group.add(hBar2);

    const hCross = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.02, 0.25),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    );
    hCross.position.set(-4.0, 6.68, 0);
    this.group.add(hCross);

    // 2. ISRO / NRSC Satellite Tracking Radome (Positioned at x = 2.0, z = -1.8)
    // Raised mounting plinth
    const radomePlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.2, 0.4, 16),
      this.materials.accentTrim
    );
    radomePlinth.position.set(2.0, 6.62, -1.8);
    radomePlinth.castShadow = true;
    this.group.add(radomePlinth);
    this.roofMeshes.push(radomePlinth);

    // Geodesic-style white spherical radome
    const radomeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 24, 20),
      this.materials.radome
    );
    radomeSphere.position.set(2.0, 7.8, -1.8);
    radomeSphere.castShadow = true;
    this.group.add(radomeSphere);
    this.roofMeshes.push(radomeSphere);

    // Auxiliary smaller radome / GPS dome (x = 3.8, z = -2.2)
    const auxDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 12),
      this.materials.radome
    );
    auxDome.position.set(3.8, 6.9, -2.2);
    auxDome.castShadow = true;
    this.group.add(auxDome);
    this.roofMeshes.push(auxDome);

    // 3. Meteorological Mast & Anemometers (Positioned at x = 4.8, z = 1.8)
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.12, 6.5, 8),
      this.materials.gangwaySteel
    );
    mast.position.set(4.8, 9.6, 1.8);
    mast.castShadow = true;
    this.group.add(mast);
    this.detailMeshes.push(mast);

    // Mast cross-arm with anemometer cups
    const crossArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8),
      this.materials.gangwaySteel
    );
    crossArm.rotation.z = Math.PI / 2;
    crossArm.position.set(4.8, 12.0, 1.8);
    this.group.add(crossArm);
    this.detailMeshes.push(crossArm);

    // Warning beacon light on mast tip
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#DC2626' })
    );
    beacon.position.set(4.8, 12.85, 1.8);
    this.group.add(beacon);

    // 4. Rooftop Solar Photovoltaic Arrays (Tilted toward polar sun)
    // 2 parallel rows of 4 panels each
    const panelGeo = new THREE.BoxGeometry(1.2, 0.05, 0.75);
    for (let i = 0; i < 4; i++) {
      const px = -1.2 + i * 1.5;
      // Row 1
      const panel1 = new THREE.Mesh(panelGeo, this.materials.solarCell);
      panel1.rotation.x = Math.PI / 8; // Tilted angle
      panel1.position.set(px, 6.72, 1.8);
      panel1.castShadow = true;
      this.group.add(panel1);
      this.roofMeshes.push(panel1);

      // Row 2
      const panel2 = new THREE.Mesh(panelGeo, this.materials.solarCell);
      panel2.rotation.x = Math.PI / 8;
      panel2.position.set(px, 6.72, 2.8);
      panel2.castShadow = true;
      this.group.add(panel2);
      this.roofMeshes.push(panel2);
    }

    // 5. Rooftop HVAC Chiller Blocks and Heat Recovery Cowls (x = -0.5, z = -2.0)
    for (let c = 0; c < 2; c++) {
      const chiller = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.7, 0.9),
        this.materials.metalLouver
      );
      chiller.position.set(-1.0 + c * 1.4, 6.8, -1.8);
      chiller.castShadow = true;
      this.group.add(chiller);
      this.roofMeshes.push(chiller);

      // Fan cylinder on top of chiller
      const fanCowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16),
        this.materials.accentTrim
      );
      fanCowl.position.set(-1.0 + c * 1.4, 7.2, -1.8);
      this.group.add(fanCowl);
      this.roofMeshes.push(fanCowl);
    }
  }

  /**
   * Exterior Gangway, Walkway, and Staircase descending from Level 1 to ground
   */
  private buildExteriorGangway() {
    // Portal / airlock door frame at Level 1 (x = 2.5, z = 3.75)
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.7, 0.2),
      this.materials.accentTrim
    );
    doorFrame.position.set(2.5, 3.2, 3.78);
    this.group.add(doorFrame);
    this.detailMeshes.push(doorFrame);

    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.5, 0.08),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.4 }) // High-vis orange door
    );
    doorLeaf.position.set(2.5, 3.2, 3.82);
    this.group.add(doorLeaf);
    this.detailMeshes.push(doorLeaf);

    // Gangway landing platform outside airlock
    const landing = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.15, 1.8),
      this.materials.gangwaySteel
    );
    landing.position.set(2.5, 2.3, 4.6);
    landing.castShadow = true;
    landing.receiveShadow = true;
    this.group.add(landing);
    this.detailMeshes.push(landing);

    // Gangway safety handrails
    const railMat = this.materials.accentTrim;
    const railGeo = new THREE.BoxGeometry(2.0, 0.05, 0.05);
    const handrail = new THREE.Mesh(railGeo, railMat);
    handrail.position.set(2.5, 3.2, 5.45);
    this.group.add(handrail);
    this.detailMeshes.push(handrail);

    // Stairway stringers leading to ground (from y=2.3 down to y=0)
    const stairGeo = new THREE.BoxGeometry(1.2, 0.1, 3.4);
    const stairs = new THREE.Mesh(stairGeo, this.materials.gangwaySteel);
    stairs.rotation.x = Math.PI / 6;
    stairs.position.set(2.5, 1.15, 6.1);
    stairs.castShadow = true;
    this.group.add(stairs);
    this.detailMeshes.push(stairs);
  }

  /**
   * Toggles X-Ray vision mode for the station envelope:
   * Exterior walls become transparent architectural glass (~22% opacity)
   * with crisp edge highlighting, revealing interior rooms, columns, machinery, and pipes.
   */
  public setXRayMode(enabled: boolean) {
    this.isXRayMode = enabled;

    if (this.isThermalMode && !enabled) {
      this.applyThermalMaterials();
      return;
    }

    if (enabled) {
      // Exterior wall panels become translucent architectural glass (~15-35% opacity)
      this.materials.wallPanel.transparent = true;
      this.materials.wallPanel.opacity = 0.22;
      this.materials.wallPanel.depthWrite = false;
      this.materials.wallPanel.color.set('#B8DEEE'); // cool architectural glass tint
      this.materials.wallPanel.roughness = 0.15;
      this.materials.wallPanel.metalness = 0.25;

      // Roof surfaces become transparent so interior decks and rooms are directly inspectable
      this.materials.roofDeck.transparent = true;
      this.materials.roofDeck.opacity = 0.16;
      this.materials.roofDeck.depthWrite = false;

      // Structural trim (prompts: ~50-80% opacity)
      this.materials.accentTrim.transparent = true;
      this.materials.accentTrim.opacity = 0.65;
      this.materials.accentTrim.depthWrite = false;

      this.materials.windowGlass.opacity = 0.18;
      this.materials.helideck.opacity = 0.25;
      this.materials.helideck.transparent = true;

      // Crisp icy-blue edge lines outline the faceted aerodynamic volume
      this.edgeLineMat.color.set('#38BDF8');
      this.edgeLineMat.opacity = 0.70;
    } else {
      this.restoreNormalMaterials();
    }
  }

  /**
   * Toggles Thermal Radiation Mode for the building envelope:
   * Exterior walls take on a cool, semi-translucent dark slate shell
   * so that the intensely glowing hot machine cores, volumetric heat auras,
   * expanding radiant waves, and convective plumes visually dominate.
   */
  public setThermalMode(enabled: boolean) {
    this.isThermalMode = enabled;

    if (enabled) {
      this.applyThermalMaterials();
    } else {
      if (this.isXRayMode) {
        this.setXRayMode(true);
      } else {
        this.restoreNormalMaterials();
      }
    }
  }

  private applyThermalMaterials() {
    this.materials.wallPanel.transparent = true;
    this.materials.wallPanel.opacity = 0.26;
    this.materials.wallPanel.depthWrite = false;
    this.materials.wallPanel.color.set('#1E293B');
    this.materials.wallPanel.metalness = 0.15;
    this.materials.wallPanel.roughness = 0.45;

    this.materials.roofDeck.transparent = true;
    this.materials.roofDeck.opacity = 0.18;
    this.materials.roofDeck.depthWrite = false;
    this.materials.roofDeck.color.set('#0F172A');

    this.materials.accentTrim.transparent = true;
    this.materials.accentTrim.opacity = 0.50;
    this.materials.accentTrim.depthWrite = false;
    this.materials.accentTrim.color.set('#0F172A');

    this.materials.windowGlass.opacity = 0.22;
    this.materials.helideck.opacity = 0.25;
    this.materials.helideck.transparent = true;

    // Subtle ember/slate edge lines
    this.edgeLineMat.color.set('#475569');
    this.edgeLineMat.opacity = 0.40;
  }

  private restoreNormalMaterials() {
    this.materials.wallPanel.transparent = false;
    this.materials.wallPanel.opacity = 1.0;
    this.materials.wallPanel.depthWrite = true;
    this.materials.wallPanel.color.set('#E8EFF4');
    this.materials.wallPanel.metalness = 0.25;
    this.materials.wallPanel.roughness = 0.35;

    this.materials.roofDeck.transparent = false;
    this.materials.roofDeck.opacity = 1.0;
    this.materials.roofDeck.depthWrite = true;
    this.materials.roofDeck.color.set('#D2DCE4');

    this.materials.accentTrim.transparent = false;
    this.materials.accentTrim.opacity = 1.0;
    this.materials.accentTrim.depthWrite = true;
    this.materials.accentTrim.color.set('#004E64');

    this.materials.windowGlass.opacity = 0.85;
    this.materials.helideck.opacity = 1.0;
    this.materials.helideck.transparent = false;

    this.edgeLineMat.opacity = 0.0;
  }

  /**
   * Applies heat map color tone to building envelope
   */
  public setHeatMapColor(hexColor: string | null) {
    if (!hexColor) {
      this.materials.wallPanel.color.set(this.isXRayMode ? '#60A5FA' : '#E8EFF4');
      return;
    }
    this.materials.wallPanel.color.set(hexColor);
  }

  public dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.edgeLineMat.dispose();
  }
}
