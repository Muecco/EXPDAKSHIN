/**
 * DAKSHIN — STATION TWIN KIT (REUSABLE 3D BUILDING BLOCKS)
 *
 * Station-agnostic helpers shared by every station model so that geometry,
 * colour and flow behaviour stay consistent between MAITRI and BHARATI:
 * - Semantic status colours (single source of truth for 3D status tinting)
 * - Group status painting (standard + basic materials)
 * - Utility route plumbing: CatmullRom tube meshes + animated flow particles
 * - Selection highlight ring
 *
 * Performance notes:
 * - Flow particles are updated through direct TypedArray writes
 *   (`BufferAttribute.needsUpdate`) with zero React re-renders per particle.
 * - Materials are created once per route and reused for highlighting.
 */

import * as THREE from 'three';
import type { OperationalStatus } from '../../../types';
import type { UtilityRoute } from './types';

// ---------------------------------------------------------------------------
// Status Colours
// ---------------------------------------------------------------------------

/** Canonical 3D status colour. Must match the CSS semantic status palette. */
export function statusHex(status: OperationalStatus | string): string {
  if (status === 'CRITICAL' || status === 'FAILED') return '#DC2626';
  if (status === 'WARNING' || status === 'DEGRADING') return '#D97706';
  if (status === 'OFFLINE') return '#64748B';
  if (status === 'UNKNOWN') return '#94A3B8';
  return '#004E64'; // NORMAL — Deep Teal
}

export function statusEmissiveIntensity(status: OperationalStatus | string): number {
  if (status === 'CRITICAL' || status === 'FAILED') return 0.45;
  if (status === 'WARNING' || status === 'DEGRADING') return 0.22;
  return 0.06;
}

/** Paints every material inside a group with a status colour. */
export function paintGroupStatus(group: THREE.Object3D, status: OperationalStatus | string): void {
  const hex = statusHex(status);
  const intensity = statusEmissiveIntensity(status);

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = child.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.color.set(hex);
      material.emissive.set(hex);
      material.emissiveIntensity = intensity;
    } else if (material instanceof THREE.MeshBasicMaterial) {
      material.color.set(hex);
    }
  });
}

// ---------------------------------------------------------------------------
// Utility Route Network
// ---------------------------------------------------------------------------

interface FlowRouteHandle {
  route: UtilityRoute;
  pipe: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  particles: THREE.Points;
  particleMaterial: THREE.PointsMaterial;
  curve: THREE.CatmullRomCurve3;
  progress: number[];
}

const PARTICLES_PER_ROUTE = 18;
const FLOW_SPEED = 0.42;

/**
 * Builds a set of utility pipelines (tubes) with animated flow pulses and
 * selection-driven highlighting. Used by every station's pipeline vision mode.
 */
export class UtilityRouteNetwork {
  public group: THREE.Group;
  private routes: UtilityRoute[];
  private handles: FlowRouteHandle[] = [];
  private selectedAssetId: string | null = null;

  constructor(name: string, routes: UtilityRoute[]) {
    this.group = new THREE.Group();
    this.group.name = name;
    this.routes = routes;
    this.build();
  }

  private build(): void {
    this.routes.forEach((route) => {
      const vectors = route.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      if (vectors.length < 2) return;

      const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.25);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, route.diameter, 10, false);

      const material = new THREE.MeshStandardMaterial({
        color: route.color,
        emissive: route.color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.85,
      });

      const pipe = new THREE.Mesh(tubeGeo, material);
      pipe.userData = { routeId: route.id, route };
      pipe.renderOrder = 2;
      this.group.add(pipe);

      // Animated flow pulses travelling along the route
      const positions = new Float32Array(PARTICLES_PER_ROUTE * 3);
      const progress: number[] = [];
      for (let i = 0; i < PARTICLES_PER_ROUTE; i++) {
        const t = i / PARTICLES_PER_ROUTE;
        const pt = curve.getPoint(t);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
        progress.push(t);
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: '#FFFFFF',
        size: 0.16,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

      const particles = new THREE.Points(particleGeo, particleMaterial);
      particles.userData = { flow: true };
      this.group.add(particles);

      this.handles.push({ route, pipe, material, particles, particleMaterial, curve, progress });
    });
  }

  /** Advances flow pulses along every route (called per frame). */
  public update(dt: number): void {
    const delta = Math.min(dt, 0.08);
    this.handles.forEach((handle) => {
      const attr = handle.particles.geometry.attributes.position as THREE.BufferAttribute;
      const direction = handle.route.flowDirection === -1 ? -1 : 1;

      for (let i = 0; i < handle.progress.length; i++) {
        handle.progress[i] = (handle.progress[i] + delta * FLOW_SPEED * direction + 1) % 1;
        const pt = handle.curve.getPoint(handle.progress[i]);
        attr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      attr.needsUpdate = true;
    });
  }

  /**
   * Highlights routes connected to the selected asset and dims the rest.
   * `null` restores an even presentation for all routes.
   */
  public highlightAssetConnections(assetId: string | null): void {
    this.selectedAssetId = assetId;

    this.handles.forEach((handle) => {
      if (!assetId) {
        handle.material.opacity = 0.85;
        handle.material.emissiveIntensity = 0.35;
        handle.particleMaterial.opacity = 0.95;
        return;
      }

      const isConnected =
        handle.route.sourceAssetId === assetId || handle.route.targetAssetId === assetId;

      if (isConnected) {
        handle.material.opacity = 1.0;
        handle.material.emissiveIntensity = 0.95;
        handle.particleMaterial.opacity = 1.0;
      } else {
        handle.material.opacity = 0.14;
        handle.material.emissiveIntensity = 0.05;
        handle.particleMaterial.opacity = 0.15;
      }
    });
  }

  public getSelectedAssetId(): string | null {
    return this.selectedAssetId;
  }

  public setVisibility(visible: boolean): void {
    this.group.visible = visible;
  }

  public getRouteCount(): number {
    return this.handles.length;
  }

  public dispose(): void {
    this.handles.forEach((handle) => {
      handle.pipe.geometry.dispose();
      handle.material.dispose();
      handle.particles.geometry.dispose();
      handle.particleMaterial.dispose();
    });
    this.handles = [];
  }
}

// ---------------------------------------------------------------------------
// Selection Highlight Ring
// ---------------------------------------------------------------------------

/**
 * Creates the animated selection ring placed under the selected equipment.
 * The caller owns addition/removal from the scene.
 */
export function createSelectionRing(assetName: string, x: number, z: number, radius = 1.4): THREE.Mesh {
  const ringGeo = new THREE.RingGeometry(radius, radius * 1.16, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#FFFFFF',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.05, z);
  ring.name = assetName;
  return ring;
}
