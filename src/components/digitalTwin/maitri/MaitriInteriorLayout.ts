/**
 * DAKSHIN — MAITRI INTERIOR LAYOUT (X-RAY VISION)
 *
 * Reproduces the internal zoning shown in the MAITRI X-ray reference:
 * - A central service corridor running the length of each arm
 * - Functional rooms either side of the corridor, colour-zoned so the
 *   reference's multi-coloured room blocks read correctly
 * - Partition walls at module boundaries with door gaps onto the corridor
 * - The inter-deck stair core at the glazed knuckle
 * - Interior deck plating for both levels
 *
 * The interior is only visible when the envelope is ghosted (X-Ray mode), and
 * in that mode its partitions brighten to a cool cyan so the layout reads
 * clearly — while site context stays fully opaque.
 *
 * Room functions are a plausible polar-station arrangement consistent with the
 * visible reference blocks; the references do not name Maitri's rooms.
 */

import * as THREE from 'three';
import { MAITRI_GEOMETRY as G } from '../station/layouts/maitriLayout';

interface RoomSegment {
  /** Distance from the knuckle along the arm (metres). */
  start: number;
  end: number;
  colour: string;
}

/** Arm A segments (toward −X), west→east from the knuckle. */
const ARM_A_SEGMENTS: RoomSegment[] = [
  { start: 0, end: 4, colour: '#F59E0B' },
  { start: 4, end: 8, colour: '#60A5FA' },
  { start: 8, end: 12, colour: '#4ADE80' },
  { start: 12, end: 16, colour: '#F472B6' },
  { start: 16, end: 20, colour: '#34D399' },
  { start: 20, end: 24, colour: '#A3E635' },
  { start: 24, end: 28, colour: '#93C5FD' },
  { start: 28, end: 32, colour: '#F97316' },
];

/** Arm B segments (toward −Z), from the knuckle outward. */
const ARM_B_SEGMENTS: RoomSegment[] = [
  { start: 0, end: 4, colour: '#FBBF24' },
  { start: 4, end: 8, colour: '#FB923C' },
  { start: 8, end: 12, colour: '#38BDF8' },
  { start: 12, end: 16, colour: '#A855F7' },
  { start: 16, end: 20, colour: '#7DD3FC' },
  { start: 20, end: 24, colour: '#C4B5FD' },
];

export class MaitriInteriorLayout {
  public group: THREE.Group;
  public partitionMeshes: THREE.Mesh[] = [];

  public materials: {
    deck: THREE.MeshStandardMaterial;
    corridor: THREE.MeshStandardMaterial;
    partition: THREE.MeshStandardMaterial;
    stair: THREE.MeshStandardMaterial;
    rail: THREE.MeshStandardMaterial;
  };

  /** Room colour swatches, keyed for later reference/inspection. */
  private roomMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();
  private deckMaterials: THREE.MeshStandardMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Maitri_InteriorLayout';

    this.materials = {
      deck: new THREE.MeshStandardMaterial({ color: '#4B5563', roughness: 0.75, metalness: 0.15 }),
      corridor: new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.7, metalness: 0.1 }),
      partition: new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.75, metalness: 0.1 }),
      stair: new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.6, metalness: 0.5 }),
      rail: new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.5, metalness: 0.4 }),
    };

    this.deckMaterials = [this.materials.deck, this.materials.corridor];
    this.buildDeckPlating();
    this.buildArmAInterior();
    this.buildArmBInterior();
    this.buildStairCore();
  }

  private roomMaterial(colour: string): THREE.MeshStandardMaterial {
    const existing = this.roomMaterials.get(colour);
    if (existing) return existing;
    const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.62, metalness: 0.08 });
    this.roomMaterials.set(colour, material);
    return material;
  }

  /** Interior deck plating visible through the ghosted envelope. */
  private buildDeckPlating(): void {
    const deckA = new THREE.Mesh(
      new THREE.BoxGeometry(G.armAModules * G.moduleLength - 0.4, 0.06, G.moduleWidth - 0.3),
      this.materials.deck
    );
    deckA.position.set(-(G.armAModules * G.moduleLength) / 2, G.deckY + 0.03, 0);
    this.group.add(deckA);

    const deckB = new THREE.Mesh(
      new THREE.BoxGeometry(G.moduleWidth - 0.3, 0.06, G.armBModules * G.moduleLength - 0.4),
      this.materials.deck
    );
    deckB.position.set(0, G.deckY + 0.03, -(G.armBModules * G.moduleLength) / 2);
    this.group.add(deckB);

    const deckKnuckle = new THREE.Mesh(
      new THREE.BoxGeometry(G.knuckleHalf * 2 - 0.3, 0.06, G.knuckleHalf * 2 - 0.3),
      this.materials.deck
    );
    deckKnuckle.position.set(0, G.deckY + 0.03, 0);
    this.group.add(deckKnuckle);
  }

  private buildArmAInterior(): void {
    const corridorY = G.deckY + 0.08;
    const roomY = corridorY;

    ARM_A_SEGMENTS.forEach((segment) => {
      const centreX = -(segment.start + segment.end) / 2;
      const length = segment.end - segment.start - 0.12;
      const material = this.roomMaterial(segment.colour);

      // North and south rooms flanking the corridor
      [-1, 1].forEach((side) => {
        const room = new THREE.Mesh(new THREE.BoxGeometry(length, 0.05, 1.05), material);
        room.position.set(centreX, roomY, side * 1.05);
        this.group.add(room);
      });

      // Corridor slab
      const corridor = new THREE.Mesh(new THREE.BoxGeometry(length, 0.045, 1.25), this.materials.corridor);
      corridor.position.set(centreX, corridorY, 0);
      this.group.add(corridor);
    });

    // Partition walls with a corridor door gap
    for (let i = 1; i < G.armAModules; i++) {
      const x = -i * G.moduleLength;
      [-1, 1].forEach((side) => {
        const partition = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, G.moduleHeight - 0.35, 1.35),
          this.materials.partition
        );
        partition.position.set(x, G.deckY + (G.moduleHeight - 0.35) / 2 + 0.06, side * 1.05);
        this.group.add(partition);
        this.partitionMeshes.push(partition);
      });
    }
  }

  private buildArmBInterior(): void {
    const corridorY = G.deckY + 0.08;

    ARM_B_SEGMENTS.forEach((segment) => {
      const centreZ = -(segment.start + segment.end) / 2;
      const length = segment.end - segment.start - 0.12;
      const material = this.roomMaterial(segment.colour);

      [-1, 1].forEach((side) => {
        const room = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, length), material);
        room.position.set(side * 1.05, corridorY, centreZ);
        this.group.add(room);
      });

      const corridor = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.045, length), this.materials.corridor);
      corridor.position.set(0, corridorY, centreZ);
      this.group.add(corridor);
    });

    for (let i = 1; i < G.armBModules; i++) {
      const z = -i * G.moduleLength;
      [-1, 1].forEach((side) => {
        const partition = new THREE.Mesh(
          new THREE.BoxGeometry(1.35, G.moduleHeight - 0.35, 0.07),
          this.materials.partition
        );
        partition.position.set(side * 1.05, G.deckY + (G.moduleHeight - 0.35) / 2 + 0.06, z);
        this.group.add(partition);
        this.partitionMeshes.push(partition);
      });
    }
  }

  /** Inter-deck stair core in the glazed knuckle. */
  private buildStairCore(): void {
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, G.moduleHeight - 0.4, 1.5),
      this.materials.deck
    );
    shaft.position.set(0.4, G.deckY + (G.moduleHeight - 0.4) / 2, -0.6);
    this.group.add(shaft);

    // Stepped treads climbing the shaft
    for (let i = 0; i < 9; i++) {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 0.3), this.materials.stair);
      tread.position.set(0.4, G.deckY + 0.25 + i * 0.28, -1.15 + i * 0.14);
      this.group.add(tread);
    }

    // Handrails
    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.6), this.materials.rail);
      rail.position.set(0.4 + side * 0.6, G.deckY + 1.6, -0.6);
      this.group.add(rail);
    });
  }

  /** Interior emphasis toggle for X-Ray mode. */
  public setXRayMode(enabled: boolean): void {
    if (enabled) {
      this.materials.partition.color.set('#38BDF8');
      this.materials.partition.roughness = 0.3;
      this.materials.deck.color.set('#0F172A');
      this.materials.corridor.color.set('#E2E8F0');
    } else {
      this.materials.partition.color.set('#94A3B8');
      this.materials.partition.roughness = 0.75;
      this.materials.deck.color.set('#4B5563');
      this.materials.corridor.color.set('#CBD5E1');
    }
  }

  /** Number of colour-zoned room blocks (used by the UI provenance note). */
  public getRoomCount(): number {
    return ARM_A_SEGMENTS.length + ARM_B_SEGMENTS.length;
  }

  public dispose(): void {
    this.deckMaterials.forEach((m) => m.dispose());
    this.roomMaterials.forEach((m) => m.dispose());
    this.partitionMeshes.forEach((m) => m.geometry.dispose());
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
  }
}
