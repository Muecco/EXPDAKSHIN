import * as THREE from 'three';
import type { MachineAssetId, MachineTelemetry } from '../../../types/digitalTwin';
import type { OperationalStatus } from '../../../types';

function getStatusColor(status: OperationalStatus): string {
  if (status === 'CRITICAL' || status === 'FAILED') return '#DC2626';
  if (status === 'WARNING' || status === 'DEGRADING') return '#D97706';
  if (status === 'OFFLINE') return '#64748B';
  return '#004E64';
}

/**
 * SensorMarkers
 *
 * Renders interactive 3D sensor beacon pins above key equipment and monitoring zones.
 * Each marker features:
 * - A glowing status beacon head (diamond/sphere)
 * - Animated pulsing broadcast ring
 * - Direct raycast clickability to open the asset detail telemetry panel
 * - Dynamic color synchronization with live simulation alerts
 */
export class SensorMarkers {
  public group: THREE.Group;
  private markers: Map<string, THREE.Group> = new Map();
  private pulseRings: Map<string, THREE.Mesh> = new Map();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_SensorMarkers';
  }

  public initializeMarkers(assets: Record<MachineAssetId, MachineTelemetry>) {
    // Clear old markers
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.markers.clear();
    this.pulseRings.clear();

    const beaconPositions: Record<string, [number, number, number]> = {
      'GEN-01': [-5.0, 4.2, -2.0],
      'GEN-02': [-5.0, 4.2, 2.0],
      'BAT-01': [-2.5, 4.2, -3.0],
      'FUEL-01': [-8.5, 2.8, 0],
      'PUMP-01': [2.5, 4.2, -2.8],
      'HEATER-01': [2.0, 4.2, 2.5],
      'ENV-01': [5.0, 4.2, 0],
      'ROOF-MET': [4.8, 12.8, 1.8],
    };

    Object.entries(beaconPositions).forEach(([id, pos]) => {
      const asset = assets[id as MachineAssetId];
      const status = asset?.status || 'NORMAL';
      const color = getStatusColor(status);

      const markerGroup = new THREE.Group();
      markerGroup.name = `SENSOR_${id}`;
      markerGroup.position.set(...pos);

      // 1. Vertical indicator stem
      const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.6 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.375;
      markerGroup.add(stem);

      // 2. Glowing Diamond Beacon Head
      const headGeo = new THREE.OctahedronGeometry(0.18, 0);
      const headMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.8;
      head.userData = { assetId: id, isSensorBeacon: true };
      markerGroup.add(head);

      // 3. Live Broadcast Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.2, 0.28, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.8;
      markerGroup.add(ring);
      this.pulseRings.set(id, ring);

      this.group.add(markerGroup);
      this.markers.set(id, markerGroup);
    });
  }

  /**
   * Updates beacon pulse animation
   */
  public update(time: number) {
    this.pulseRings.forEach((ring) => {
      const scale = 1.0 + ((time * 2.5) % 2.0) * 0.8;
      ring.scale.set(scale, scale, scale);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.8 - ((time * 2.5) % 2.0) * 0.4);
    });

    // Slow bobbing of beacon diamond
    this.markers.forEach((marker) => {
      marker.children.forEach((child) => {
        if (child.userData.isSensorBeacon) {
          child.rotation.y = time * 1.5;
        }
      });
    });
  }

  /**
   * Updates beacon color when telemetry changes
   */
  public updateStatus(assetId: string, status: OperationalStatus) {
    const marker = this.markers.get(assetId);
    if (!marker) return;

    const color = getStatusColor(status);
    marker.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.set(color);
          child.material.emissive.set(color);
        } else if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.set(color);
        }
      }
    });
  }

  public setVisibility(visible: boolean) {
    this.group.visible = visible;
  }

  public dispose() {
    this.markers.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    });
  }
}
