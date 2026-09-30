/**
 * DAKSHIN — MAITRI MODULE COMPLEX
 *
 * Reproduces the MAITRI main complex from the station reference views:
 * - An elevated L-shaped chain of prefabricated modules (8-module Arm A,
 *   6-module Arm B) carried on a steel pile/truss undercarriage
 * - The glazed conservatory knuckle at the bend with its curved glazed cap
 * - Continuous band of small windows on both facades of both arms
 * - The tricolour module on Arm A's north facade (saffron / white with chakra
 *   / green, external door and access stair)
 * - Orange-red external stair towers at the far end of each arm plus the
 *   access stairs at the tricolour module and a small step flight at the knuckle
 * - White roof deck with ridge caps, the roof-mounted white water tank on Arm B,
 *   roof masts on Arm A and the antenna cluster above the knuckle
 * - Exterior service pipe runs beneath the deck
 *
 * Vision-mode support:
 * - X-Ray: envelope (walls / roof / parapet) becomes translucent while the
 *   undercarriage and interior stay opaque, matching the X-ray reference.
 * - Heat map: envelope and structural materials are tinted by the caller.
 *
 * Geometry is a proportional approximation traced from the reference imagery.
 */

import * as THREE from 'three';
import { MAITRI_GEOMETRY as G } from '../station/layouts/maitriLayout';

export class MaitriModuleComplex {
  public group: THREE.Group;

  public materials: {
    wall: THREE.MeshStandardMaterial;
    roof: THREE.MeshStandardMaterial;
    trim: THREE.MeshStandardMaterial;
    glass: THREE.MeshStandardMaterial;
    structuralSteel: THREE.MeshStandardMaterial;
    jointAccent: THREE.MeshStandardMaterial;
    stairAccent: THREE.MeshStandardMaterial;
    white: THREE.MeshStandardMaterial;
    darkService: THREE.MeshStandardMaterial;
    saffron: THREE.MeshStandardMaterial;
    green: THREE.MeshStandardMaterial;
    chakra: THREE.MeshStandardMaterial;
  };

  private envelopeMaterials: THREE.MeshStandardMaterial[] = [];
  private structureMaterials: THREE.MeshStandardMaterial[] = [];
  private envelopes: THREE.Object3D[] = [];
  private normalColors = new Map<THREE.Material, THREE.Color>();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Maitri_ModuleComplex';

    this.materials = {
      wall: new THREE.MeshStandardMaterial({ color: '#E3EAEE', roughness: 0.42, metalness: 0.18 }),
      roof: new THREE.MeshStandardMaterial({ color: '#F2F5F7', roughness: 0.5, metalness: 0.12 }),
      trim: new THREE.MeshStandardMaterial({ color: '#004E64', roughness: 0.45, metalness: 0.35 }),
      glass: new THREE.MeshStandardMaterial({
        color: '#1B384A',
        roughness: 0.08,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85,
      }),
      structuralSteel: new THREE.MeshStandardMaterial({ color: '#3A4854', roughness: 0.5, metalness: 0.8 }),
      jointAccent: new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.45, metalness: 0.55 }),
      stairAccent: new THREE.MeshStandardMaterial({ color: '#C2410C', roughness: 0.55, metalness: 0.35 }),
      white: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.35, metalness: 0.1 }),
      darkService: new THREE.MeshStandardMaterial({ color: '#4B5563', roughness: 0.6, metalness: 0.5 }),
      saffron: new THREE.MeshStandardMaterial({ color: '#FF9933', roughness: 0.6, metalness: 0.05 }),
      green: new THREE.MeshStandardMaterial({ color: '#138808', roughness: 0.6, metalness: 0.05 }),
      chakra: new THREE.MeshStandardMaterial({ color: '#0A2A66', roughness: 0.5, metalness: 0.1 }),
    };

    this.envelopeMaterials = [this.materials.wall, this.materials.roof, this.materials.trim];
    this.structureMaterials = [this.materials.structuralSteel];
    [...this.envelopeMaterials, ...this.structureMaterials].forEach((m) =>
      this.normalColors.set(m, m.color.clone())
    );

    this.buildUndercarriage();
    this.buildArmA();
    this.buildArmB();
    this.buildKnuckle();
    this.buildTricolourModule();
    this.buildExternalStairs();
    this.buildRoofPlant();
    this.buildRadomeAndAHUs();
    this.buildUnderfloorServices();
  }

  // ── Steel pile / truss undercarriage ────────────────────────────────────

  private buildUndercarriage(): void {
    const pileGeo = new THREE.CylinderGeometry(0.12, 0.12, G.deckY, 14);
    const padGeo = new THREE.BoxGeometry(0.62, 0.18, 0.62);
    const pilePositions: THREE.Vector3[] = [];

    // Arm A — two rows of piles at z = ±1.5
    for (let i = 0; i <= G.armAModules; i++) {
      const x = -i * G.moduleLength;
      pilePositions.push(new THREE.Vector3(x, G.deckY / 2, -1.5), new THREE.Vector3(x, G.deckY / 2, 1.5));
    }
    // Arm B — two rows of piles at x = ±1.5
    for (let i = 1; i <= G.armBModules; i++) {
      const z = -i * G.moduleLength;
      pilePositions.push(new THREE.Vector3(-1.5, G.deckY / 2, z), new THREE.Vector3(1.5, G.deckY / 2, z));
    }

    // Piles and foundation pads as instanced meshes (two draw calls total)
    const piles = new THREE.InstancedMesh(pileGeo, this.materials.structuralSteel, pilePositions.length);
    const pads = new THREE.InstancedMesh(padGeo, this.materials.darkService, pilePositions.length);
    const dummy = new THREE.Object3D();

    pilePositions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      piles.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos.x, 0.09, pos.z);
      dummy.updateMatrix();
      pads.setMatrixAt(i, dummy.matrix);
    });
    piles.castShadow = true;
    piles.receiveShadow = true;
    pads.receiveShadow = true;
    this.group.add(piles, pads);

    // Longitudinal deck beams + transverse beams + diagonal bracing
    const beamY = G.deckY - 0.16;
    [-1.5, 1.5].forEach((z) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(G.armAModules * G.moduleLength + 0.6, 0.26, 0.24),
        this.materials.structuralSteel
      );
      beam.position.set(-(G.armAModules * G.moduleLength) / 2, beamY, z);
      beam.castShadow = true;
      this.group.add(beam);
    });
    [-1.5, 1.5].forEach((x) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.26, G.armBModules * G.moduleLength + 0.6),
        this.materials.structuralSteel
      );
      beam.position.set(x, beamY, -(G.armBModules * G.moduleLength) / 2);
      beam.castShadow = true;
      this.group.add(beam);
    });

    // Transverse beams and cross-braces per bay
    for (let i = 0; i < G.armAModules; i++) {
      const x = -(i + 0.5) * G.moduleLength;
      const transverse = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.22, 3.4),
        this.materials.structuralSteel
      );
      transverse.position.set(x, beamY - 0.05, 0);
      this.group.add(transverse);

      this.createBrace([x - 1.6, 0.25, -1.5], [x + 1.6, G.deckY - 0.35, -1.5]);
      this.createBrace([x + 1.6, 0.25, 1.5], [x - 1.6, G.deckY - 0.35, 1.5]);
    }
    for (let i = 0; i < G.armBModules; i++) {
      const z = -(i + 0.5) * G.moduleLength;
      const transverse = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.22, 0.2),
        this.materials.structuralSteel
      );
      transverse.position.set(0, beamY - 0.05, z);
      this.group.add(transverse);

      this.createBrace([-1.5, 0.25, z + 1.6], [-1.5, G.deckY - 0.35, z - 1.6]);
      this.createBrace([1.5, 0.25, z - 1.6], [1.5, G.deckY - 0.35, z + 1.6]);
    }

    // Deck slabs (top face at deckY)
    const deckA = new THREE.Mesh(
      new THREE.BoxGeometry(G.armAModules * G.moduleLength + 0.4, 0.2, G.moduleWidth + 0.2),
      this.materials.darkService
    );
    deckA.position.set(-(G.armAModules * G.moduleLength) / 2, G.deckY - 0.1, 0);
    deckA.receiveShadow = true;
    this.group.add(deckA);

    const deckB = new THREE.Mesh(
      new THREE.BoxGeometry(G.moduleWidth + 0.2, 0.2, G.armBModules * G.moduleLength + 0.4),
      this.materials.darkService
    );
    deckB.position.set(0, G.deckY - 0.1, -(G.armBModules * G.moduleLength) / 2);
    deckB.receiveShadow = true;
    this.group.add(deckB);
  }

  private createBrace(start: [number, number, number], end: [number, number, number]): void {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const distance = vStart.distanceTo(vEnd);
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);

    const brace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, distance, 8),
      this.materials.structuralSteel
    );
    brace.position.copy(mid);

    const up = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3().subVectors(vEnd, vStart).normalize();
    const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
    const angle = Math.acos(Math.min(1, Math.max(-1, up.dot(direction))));
    brace.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeRotationAxis(axis, angle));
    brace.castShadow = true;
    this.group.add(brace);
  }

  // ── Arm A (long module block, 8 modules toward −X) ──────────────────────

  private buildArmA(): void {
    const length = G.armAModules * G.moduleLength;
    const centreX = -length / 2;
    const bodyY = G.deckY + G.moduleHeight / 2;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(length, G.moduleHeight, G.moduleWidth),
      this.materials.wall
    );
    body.position.set(centreX, bodyY, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);
    this.envelopes.push(body);

    // Module joint seams on both facades
    for (let i = 1; i < G.armAModules; i++) {
      const x = -i * G.moduleLength;
      [-1, 1].forEach((side) => {
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, G.moduleHeight, 0.05),
          this.materials.trim
        );
        seam.position.set(x, bodyY, side * (G.moduleWidth / 2 + 0.01));
        this.group.add(seam);
        this.envelopes.push(seam);
      });
    }

    // Window band — 3 windows per module, both facades (one instanced draw call)
    this.buildWindowBandA(length, centreX, bodyY);

    // Arm A roof deck with parapet lip
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(length + 0.3, 0.14, G.moduleWidth + 0.3),
      this.materials.roof
    );
    roof.position.set(centreX, G.roofY + 0.07, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.group.add(roof);
    this.envelopes.push(roof);

    const parapet = new THREE.Mesh(
      new THREE.BoxGeometry(length + 0.36, 0.2, G.moduleWidth + 0.36),
      this.materials.trim
    );
    parapet.position.set(centreX, G.roofY + 0.02, 0);
    this.group.add(parapet);
    this.envelopes.push(parapet);

    // Roof ridge caps break the long roofline into modules (reference detail)
    for (let i = 0; i < G.armAModules; i++) {
      const x = -(i + 0.5) * G.moduleLength;
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(G.moduleLength - 0.3, 0.1, G.moduleWidth + 0.5),
        this.materials.white
      );
      cap.position.set(x, G.roofY + 0.16, 0);
      cap.castShadow = true;
      this.group.add(cap);
      this.envelopes.push(cap);
    }
  }

  private buildWindowBandA(length: number, centreX: number, bodyY: number): void {
    const perModule = 3;
    const count = G.armAModules * perModule * 2;
    const windowGeo = new THREE.BoxGeometry(0.62, 0.85, 0.1);
    const windows = new THREE.InstancedMesh(windowGeo, this.materials.glass, count);
    const dummy = new THREE.Object3D();
    let index = 0;

    for (let m = 0; m < G.armAModules; m++) {
      for (let w = 0; w < perModule; w++) {
        const x = centreX + length / 2 - m * G.moduleLength - 0.55 - w * 1.02;
        [-1, 1].forEach((side) => {
          dummy.position.set(x, bodyY + 0.55, side * (G.moduleWidth / 2 - 0.02));
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          windows.setMatrixAt(index++, dummy.matrix);
        });
      }
    }
    windows.castShadow = false;
    this.group.add(windows);
    this.envelopes.push(windows);
  }

  // ── Arm B (short wing, 6 modules toward −Z) ─────────────────────────────

  private buildArmB(): void {
    const length = G.armBModules * G.moduleLength;
    const centreZ = -length / 2;
    const bodyY = G.deckY + G.moduleHeight / 2;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(G.moduleWidth, G.moduleHeight, length),
      this.materials.wall
    );
    body.position.set(0, bodyY, centreZ);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);
    this.envelopes.push(body);

    for (let i = 1; i < G.armBModules; i++) {
      const z = -i * G.moduleLength;
      [-1, 1].forEach((side) => {
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, G.moduleHeight, 0.06),
          this.materials.trim
        );
        seam.position.set(side * (G.moduleWidth / 2 + 0.01), bodyY, z);
        this.group.add(seam);
        this.envelopes.push(seam);
      });
    }

    // Window band on both side walls of Arm B
    const perModule = 3;
    const count = G.armBModules * perModule * 2;
    const windows = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.1, 0.85, 0.62),
      this.materials.glass,
      count
    );
    const dummy = new THREE.Object3D();
    let index = 0;
    for (let m = 0; m < G.armBModules; m++) {
      for (let w = 0; w < perModule; w++) {
        const z = centreZ + length / 2 - m * G.moduleLength - 0.55 - w * 1.02;
        [-1, 1].forEach((side) => {
          dummy.position.set(side * (G.moduleWidth / 2 - 0.02), bodyY + 0.55, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          windows.setMatrixAt(index++, dummy.matrix);
        });
      }
    }
    this.group.add(windows);
    this.envelopes.push(windows);

    // Roof deck, parapet and ridge caps
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(G.moduleWidth + 0.3, 0.14, length + 0.3),
      this.materials.roof
    );
    roof.position.set(0, G.roofY + 0.07, centreZ);
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.group.add(roof);
    this.envelopes.push(roof);

    const parapet = new THREE.Mesh(
      new THREE.BoxGeometry(G.moduleWidth + 0.36, 0.2, length + 0.36),
      this.materials.trim
    );
    parapet.position.set(0, G.roofY + 0.02, centreZ);
    this.group.add(parapet);
    this.envelopes.push(parapet);

    for (let i = 0; i < G.armBModules; i++) {
      const z = -(i + 0.5) * G.moduleLength;
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(G.moduleWidth + 0.5, 0.1, G.moduleLength - 0.3),
        this.materials.white
      );
      cap.position.set(0, G.roofY + 0.16, z);
      cap.castShadow = true;
      this.group.add(cap);
      this.envelopes.push(cap);
    }
  }

  // ── Glazed conservatory knuckle at the bend ─────────────────────────────

  private buildKnuckle(): void {
    const half = G.knuckleHalf;
    const bodyY = G.deckY + G.moduleHeight / 2;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(half * 2, G.moduleHeight, half * 2),
      this.materials.wall
    );
    body.position.set(0, bodyY, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);
    this.envelopes.push(body);

    // Large glazed walls on the two outward faces (east + north)
    const glazedEast = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.9, half * 2 - 0.3),
      this.materials.glass
    );
    glazedEast.position.set(half - 0.02, bodyY + 0.35, 0);
    this.group.add(glazedEast);
    this.envelopes.push(glazedEast);

    const glazedNorth = new THREE.Mesh(
      new THREE.BoxGeometry(half * 2 - 0.3, 1.9, 0.1),
      this.materials.glass
    );
    glazedNorth.position.set(0, bodyY + 0.35, half - 0.02);
    this.group.add(glazedNorth);
    this.envelopes.push(glazedNorth);

    // Curved glazed cap over the knuckle (the reference conservatory roof)
    const capBase = new THREE.Mesh(
      new THREE.BoxGeometry(half * 2 + 0.2, 0.16, half * 2 + 0.2),
      this.materials.roof
    );
    capBase.position.set(0, G.roofY + 0.06, 0);
    this.group.add(capBase);
    this.envelopes.push(capBase);

    const glazedCap = new THREE.Mesh(
      new THREE.CylinderGeometry(half * 1.15, half * 1.25, 0.85, 16, 1, false),
      this.materials.glass
    );
    glazedCap.position.set(0, G.roofY + 0.55, 0);
    glazedCap.castShadow = true;
    this.group.add(glazedCap);
    this.envelopes.push(glazedCap);

    // Teal knuckle trim ring
    const trimRing = new THREE.Mesh(
      new THREE.BoxGeometry(half * 2 + 0.34, 0.18, half * 2 + 0.34),
      this.materials.trim
    );
    trimRing.position.set(0, G.deckY + G.moduleHeight + 0.02, 0);
    this.group.add(trimRing);
    this.envelopes.push(trimRing);
  }

  // ── Tricolour module on Arm A's north facade ────────────────────────────

  private buildTricolourModule(): void {
    const moduleIndex = 6; // second module in from the knuckle
    const x = -(moduleIndex - 0.5) * G.moduleLength;
    const zFace = G.moduleWidth / 2 + 0.015;

    // Flag panel: saffron / white / green bands
    const bandWidth = 2.9;
    const bandHeight = 0.28;
    const stripeColors: [THREE.MeshStandardMaterial, number][] = [
      [this.materials.saffron, G.deckY + 0.55 + G.moduleHeight - 0.55],
      [this.materials.white, G.deckY + 0.55 + G.moduleHeight - 0.55 - bandHeight],
      [this.materials.green, G.deckY + 0.55 + G.moduleHeight - 0.55 - bandHeight * 2],
    ];

    stripeColors.forEach(([material, y]) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(bandWidth, bandHeight, 0.06), material);
      stripe.position.set(x, y, zFace);
      this.group.add(stripe);
      this.envelopes.push(stripe);
    });

    // Ashoka chakra mark in the white band
    const chakraY = G.deckY + 0.55 + G.moduleHeight - 0.55 - bandHeight * 1.5;
    const chakra = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20),
      this.materials.chakra
    );
    chakra.rotation.x = Math.PI / 2;
    chakra.position.set(x, chakraY, zFace + 0.03);
    this.group.add(chakra);

    // White door below the flag
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.95, 0.06),
      this.materials.white
    );
    doorFrame.position.set(x, G.deckY + 0.98, zFace);
    this.group.add(doorFrame);
    this.envelopes.push(doorFrame);

    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 1.75, 0.05),
      this.materials.jointAccent
    );
    doorLeaf.position.set(x, G.deckY + 0.9, zFace + 0.05);
    this.group.add(doorLeaf);
  }

  // ── External stairs, ramps and handrails ────────────────────────────────

  private buildExternalStairs(): void {
    // 1. Orange-red stair tower at the far end of Arm B (the reference tower)
    this.buildStairFlight({
      topX: 0,
      topZ: -G.armBModules * G.moduleLength - 0.1,
      direction: 'z',
      sign: -1,
      width: 2.1,
      colour: this.materials.stairAccent,
    });

    // 2. Small stair / ramp at the far end of Arm A
    this.buildStairFlight({
      topX: -G.armAModules * G.moduleLength - 0.1,
      topZ: 0,
      direction: 'x',
      sign: -1,
      width: 1.7,
      colour: this.materials.stairAccent,
    });

    // 3. Access stairs at the tricolour module (north facade)
    const x = -(6 - 0.5) * G.moduleLength;
    this.buildStairFlight({
      topX: x,
      topZ: G.moduleWidth / 2 + 0.1,
      direction: 'z',
      sign: 1,
      width: 1.3,
      colour: this.materials.stairAccent,
    });

    // 4. Small step flight at the knuckle (east face)
    for (let step = 0; step < 8; step++) {
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.1, 0.34),
        this.materials.stairAccent
      );
      tread.position.set(
        G.knuckleHalf + 0.35 + step * 0.3,
        G.deckY - 0.08 - step * (G.deckY - 0.1) / 8,
        0
      );
      tread.castShadow = true;
      this.group.add(tread);
    }
  }

  private buildStairFlight(opts: {
    topX: number;
    topZ: number;
    direction: 'x' | 'z';
    sign: 1 | -1;
    width: number;
    colour: THREE.MeshStandardMaterial;
  }): void {
    const { topX, topZ, direction, sign, width, colour } = opts;
    const length = 3.6;
    const run = length * sign;

    // Landing platform at deck level
    const landing = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, 1.6), colour);
    const landingOffset = run > 0 ? 0.9 : -0.9;
    landing.position.set(
      direction === 'x' ? topX + landingOffset * 0 : topX,
      G.deckY - 0.07,
      direction === 'z' ? topZ + landingOffset * 0 : topZ
    );
    if (direction === 'z') landing.position.z = topZ + landingOffset;
    else landing.position.x = topX + landingOffset;
    landing.castShadow = true;
    landing.receiveShadow = true;
    this.group.add(landing);

    // Tilted stair slab reaching the ground
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(direction === 'x' ? length : width, 0.1, direction === 'x' ? width : length),
      colour
    );
    slab.rotation.set(0, 0, 0);
    if (direction === 'x') {
      slab.rotation.z = (run > 0 ? -1 : 1) * (Math.PI / 7.5);
      slab.position.set(topX + run / 2 + (run > 0 ? 0.9 : -0.9), G.deckY / 2 - 0.05, topZ);
    } else {
      slab.rotation.x = (run > 0 ? 1 : -1) * (Math.PI / 7.5);
      slab.position.set(topX, G.deckY / 2 - 0.05, topZ + run / 2 + (run > 0 ? 0.9 : -0.9));
    }
    slab.castShadow = true;
    this.group.add(slab);

    // Handrails either side of the flight
    [-1, 1].forEach((side) => {
      const railOffset = (width / 2 - 0.08) * side;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(direction === 'x' ? length : 0.06, 0.06, direction === 'x' ? 0.06 : length),
        this.materials.trim
      );
      if (direction === 'x') {
        rail.rotation.z = (run > 0 ? -1 : 1) * (Math.PI / 7.5);
        rail.position.set(topX + run / 2 + (run > 0 ? 0.9 : -0.9), G.deckY / 2 + 0.85, topZ + railOffset);
      } else {
        rail.rotation.x = (run > 0 ? 1 : -1) * (Math.PI / 7.5);
        rail.position.set(topX + railOffset, G.deckY / 2 + 0.85, topZ + run / 2 + (run > 0 ? 0.9 : -0.9));
      }
      this.group.add(rail);

      // Landing rail
      const landingRail = new THREE.Mesh(
        new THREE.BoxGeometry(direction === 'x' ? 0.06 : width, 0.06, direction === 'x' ? width : 0.06),
        this.materials.trim
      );
      landingRail.position.set(
        direction === 'x' ? topX : topX,
        G.deckY + 0.9,
        direction === 'z' ? topZ : topZ
      );
      if (direction === 'z') landingRail.position.z = topZ + landingOffset;
      else landingRail.position.x = topX + landingOffset;
      this.group.add(landingRail);
    });
  }

  // ── Roof plant: water tank, masts, antenna cluster ──────────────────────

  private buildRoofPlant(): void {
    // 1. White cylindrical water tank on Arm B (reference roof object)
    const tankStand = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 1.6),
      this.materials.darkService
    );
    tankStand.position.set(0, G.roofY + 0.4, -9);
    this.group.add(tankStand);

    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 18), this.materials.white);
    tank.position.set(0, G.roofY + 1.4, -9);
    tank.castShadow = true;
    this.group.add(tank);

    // 2. Roof masts on Arm A
    const mastXs = [-29.0, -25.5];
    mastXs.forEach((x, i) => {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 4.0 + i * 0.6, 8),
        this.materials.structuralSteel
      );
      mast.position.set(x, G.roofY + 2.0 + i * 0.3, 1.0);
      mast.castShadow = true;
      this.group.add(mast);
    });

    // 3. Antenna cluster above the knuckle (the ROOF-MET beacon location)
    const cluster = [
      { x: -4.0, z: 0.0, height: 5.4 },
      { x: -4.8, z: 0.9, height: 4.6 },
      { x: -3.2, z: -0.8, height: 4.0 },
    ];
    cluster.forEach(({ x, z, height }) => {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.045, height, 8),
        this.materials.structuralSteel
      );
      mast.position.set(x, G.roofY + height / 2, z);
      mast.castShadow = true;
      this.group.add(mast);
    });

    // Small satellite dish
    const dishMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8),
      this.materials.structuralSteel
    );
    dishMount.position.set(-2.4, G.roofY + 0.45, 1.2);
    this.group.add(dishMount);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.6),
      this.materials.white
    );
    dish.rotation.set(Math.PI / 2.6, 0, 0);
    dish.position.set(-2.4, G.roofY + 0.95, 1.2);
    dish.castShadow = true;
    this.group.add(dish);
  }

  /**
   * Roof radome + air handling units.
   *
   * The station reference shows a single prominent white spherical radome on
   * the roof (not a cluster) plus two air handling units fed by HVAC Supply
   * Duct A — both reproduced here at the positions recorded in the layout
   * manifest (`AHU-A`, `AHU-B`).
   */
  private buildRadomeAndAHUs(): void {
    // 1. Satellite radome — one only, matching the reference
    const radomeX = -9.0;
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.05, 0.4, 16),
      this.materials.trim
    );
    plinth.position.set(radomeX, G.roofY + 0.27, 0);
    plinth.castShadow = true;
    this.group.add(plinth);

    const radome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 18), this.materials.white);
    radome.position.set(radomeX, G.roofY + 1.42, 0);
    radome.castShadow = true;
    this.group.add(radome);

    // Feeder mast beside the radome
    const feeder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.9, 8),
      this.materials.structuralSteel
    );
    feeder.position.set(radomeX - 1.35, G.roofY + 1.4, 0.85);
    this.group.add(feeder);

    // 2. Two air handling units on the roof deck
    const ahuPositions: [number, number][] = [
      [-13.5, 0.9],  // AHU-A — laboratory wing
      [-19.0, -0.9], // AHU-B — accommodation / generator zone
    ];

    ahuPositions.forEach(([x, z]) => {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.95, 1.3),
        this.materials.darkService
      );
      body.position.set(x, G.roofY + 0.55, z);
      body.castShadow = true;
      body.receiveShadow = true;
      this.group.add(body);

      // Fan cowl
      const cowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.46, 0.14, 16),
        this.materials.white
      );
      cowl.position.set(x, G.roofY + 1.1, z);
      cowl.castShadow = true;
      this.group.add(cowl);

      // Duct stub rising from the deck below into the unit
      const stub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.9, 12),
        this.materials.white
      );
      stub.position.set(x, G.roofY + 0.05, z);
      this.group.add(stub);

      // Weather hood
      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.22, 0.4),
        this.materials.trim
      );
      hood.position.set(x - 0.85, G.roofY + 0.7, z);
      this.group.add(hood);
    });
  }

  // ── Under-floor service pipe runs (reference detail) ─────────────────────

  private buildUnderfloorServices(): void {
    const y = G.deckY - 0.55;

    const pipeAX = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, G.armAModules * G.moduleLength - 2, 10),
      this.materials.darkService
    );
    pipeAX.rotation.z = Math.PI / 2;
    pipeAX.position.set(-(G.armAModules * G.moduleLength) / 2, y, 1.05);
    this.group.add(pipeAX);

    const pipeBZ = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, G.armBModules * G.moduleLength - 2, 10),
      this.materials.darkService
    );
    pipeBZ.rotation.x = Math.PI / 2;
    pipeBZ.position.set(-1.05, y, -(G.armBModules * G.moduleLength) / 2);
    this.group.add(pipeBZ);
  }

  // ── Vision-mode support ─────────────────────────────────────────────────

  /**
   * Envelope transparency for X-Ray vision. Site context, undercarriage and
   * interior geometry are deliberately left opaque (matching the reference).
   */
  public setEnvelopeTransparent(enabled: boolean): void {
    this.envelopeMaterials.forEach((material) => {
      const normal = this.normalColors.get(material);
      if (enabled) {
        // Glass-like see-through walls: low opacity + cool tint, shape preserved
        material.transparent = true;
        material.opacity = material === this.materials.glass ? 0.2 : 0.14;
        material.depthWrite = false;
        if (material !== this.materials.glass) material.color.set('#A8D4EA');
        material.metalness = 0.1;
      } else {
        material.transparent = material === this.materials.glass;
        material.opacity = material === this.materials.glass ? 0.85 : 1.0;
        material.depthWrite = true;
        if (normal) material.color.copy(normal);
        material.metalness = 0.18;
      }
    });
  }

  /** Structural emphasis used while X-Ray is active. */
  public setStructureEmphasis(enabled: boolean): void {
    this.materials.structuralSteel.metalness = enabled ? 0.95 : 0.8;
  }

  /** Heat-map envelope tint. `null` restores the normal cladding colour. */
  public setEnvelopeColor(hexColor: string | null): void {
    const normal = this.normalColors.get(this.materials.wall);
    this.materials.wall.color.set(hexColor ?? (normal ? normal.getHexString() : '#E3EAEE'));
    if (!hexColor && normal) this.materials.wall.color.copy(normal);
  }

  /** Heat-map structural tint. `null` restores the normal steel colour. */
  public setStructureColor(hexColor: string | null): void {
    const normal = this.normalColors.get(this.materials.structuralSteel);
    this.materials.structuralSteel.color.copy(hexColor ? new THREE.Color(hexColor) : (normal ?? new THREE.Color('#3A4854')));
  }

  public dispose(): void {
    Object.values(this.materials).forEach((m) => m.dispose());
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
        child.geometry.dispose();
      }
    });
  }
}
