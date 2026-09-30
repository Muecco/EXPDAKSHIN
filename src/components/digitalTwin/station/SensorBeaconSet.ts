/**
 * DAKSHIN — SENSOR BEACON SET (STATION-AGNOSTIC)
 *
 * Renders the interactive sensor beacon markers for a station from its layout
 * manifest. Each beacon provides:
 * - A stem + glowing diamond head
 * - An animated broadcast pulse ring
 * - Raycast clickability (the head carries `userData.assetId`, consumed by
 *   DigitalTwinPanel to open the asset detail panel)
 * - Status colour synchronisation with live telemetry
 *
 * Beacon positions are never hardcoded here — they come from the station
 * layout so that MAITRI and BHARATI sensor markers can never be interchanged.
 */

import * as THREE from 'three';
import type { OperationalStatus } from '../../../types';
import type { SensorBeaconSpec } from './types';
import { statusHex } from './StationTwinKit';

export class SensorBeaconSet {
  public group: THREE.Group;
  private markers: Map<string, THREE.Group> = new Map();
  private pulseRings: Map<string, THREE.Mesh> = new Map();

  constructor(name: string, beacons: SensorBeaconSpec[]) {
    this.group = new THREE.Group();
    this.group.name = name;
    this.build(beacons);
  }

  private build(beacons: SensorBeaconSpec[]): void {
    beacons.forEach((beacon) => {
      const color = statusHex(beacon.status);
      const markerGroup = new THREE.Group();
      markerGroup.name = `SENSOR_${beacon.id}`;
      markerGroup.position.set(beacon.position[0], beacon.position[1], beacon.position[2]);

      // 1. Vertical indicator stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8),
        new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.6 })
      );
      stem.position.y = 0.375;
      markerGroup.add(stem);

      // 2. Glowing diamond beacon head (raycast target)
      const headMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), headMat);
      head.position.y = 0.8;
      // Asset beacons expose their telemetry asset id; non-asset beacons expose
      // their beacon id so the UI can still identify them.
      head.userData = { assetId: beacon.assetId ?? beacon.id, isSensorBeacon: true };
      markerGroup.add(head);

      // 3. Live broadcast pulse ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.28, 24),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.8;
      markerGroup.add(ring);
      this.pulseRings.set(beacon.id, ring);

      this.group.add(markerGroup);
      this.markers.set(beacon.id, markerGroup);
      // Also index by asset id where present so telemetry updates resolve fast.
      if (beacon.assetId) this.markers.set(`${beacon.id}::${beacon.assetId}`, markerGroup);
    });
  }

  /** Resolves a marker by beacon id first, then by telemetry asset id. */
  private resolve(assetOrBeaconId: string): THREE.Group | undefined {
    const direct = this.markers.get(assetOrBeaconId);
    if (direct) return direct;
    for (const [key, group] of this.markers.entries()) {
      if (key.endsWith(`::${assetOrBeaconId}`)) return group;
    }
    return undefined;
  }

  /** Advances pulse animation and beacon spin (called per frame). */
  public update(time: number): void {
    this.pulseRings.forEach((ring) => {
      const scale = 1.0 + ((time * 2.5) % 2.0) * 0.8;
      ring.scale.set(scale, scale, scale);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.8 - ((time * 2.5) % 2.0) * 0.4);
    });

    this.markers.forEach((marker) => {
      marker.children.forEach((child) => {
        if (child.userData.isSensorBeacon) child.rotation.y = time * 1.5;
      });
    });
  }

  /** Syncs a beacon colour with a telemetry status change. */
  public updateStatus(assetId: string, status: OperationalStatus | string): void {
    const marker = this.resolve(assetId);
    if (!marker) return;
    const color = statusHex(status);

    marker.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material;
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.color.set(color);
        mat.emissive.set(color);
      } else if (mat instanceof THREE.MeshBasicMaterial) {
        mat.color.set(color);
      }
    });
  }

  public setVisibility(visible: boolean): void {
    this.group.visible = visible;
  }

  public dispose(): void {
    this.markers.forEach((group) => {
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      });
    });
    this.markers.clear();
    this.pulseRings.clear();
  }
}
