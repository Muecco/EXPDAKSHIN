/**
 * DAKSHIN — MAITRI EQUIPMENT & ASSET GEOMETRY
 *
 * Builds the seven telemetry assets as MAITRI-specific procedural geometry,
 * using the exact same asset IDs and the same material-registry convention as
 * the Bharati model so that status colouring, heat-map tinting, raycast
 * selection and the asset detail panel all work identically per station.
 *
 * Asset → Maitri plant mapping (station-specific, never exchanged with Bharati):
 *   GEN-01  Primary Diesel Generator Set 01   — Arm A generator hall
 *   GEN-02  Secondary Diesel Generator Set 02 — Arm A generator hall
 *   BAT-01  Station DC Battery Bank           — Arm A battery room
 *   HEATER-01 Main Boiler Heat Exchanger      — Arm A plant room
 *   PUMP-01 Hydronic Circulation Pump         — Arm A plant room
 *   FUEL-01 Aviation Turbine Fuel Farm        — west container apron
 *   ENV-01  Automatic Weather Station Mast    — open ground east of the complex
 *
 * All positions come from the Maitri layout manifest — never hardcoded here.
 */

import * as THREE from 'three';
import type { MachineAssetId, MachineTelemetry } from '../../../types/digitalTwin';
import type { OperationalStatus } from '../../../types';
import type { StationLayout } from '../station/types';
import { statusHex, statusEmissiveIntensity } from '../station/StationTwinKit';

export class MaitriEquipment {
  public group: THREE.Group;
  public assetGroups: Map<string, THREE.Group> = new Map();
  public assetMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();

  private layout: StationLayout;
  private trim = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5, metalness: 0.8 });
  private steel = new THREE.MeshStandardMaterial({ color: '#4B5563', roughness: 0.45, metalness: 0.75 });
  private amber = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.45, metalness: 0.5 });

  constructor(layout: StationLayout) {
    this.group = new THREE.Group();
    this.group.name = 'Maitri_Equipment';
    this.layout = layout;

    this.buildGenerator('GEN-01', 1.0);
    this.buildGenerator('GEN-02', 0.92);
    this.buildBatteryBank('BAT-01');
    this.buildFuelFarm('FUEL-01');
    this.buildCirculationPump('PUMP-01');
    this.buildBoilerExchanger('HEATER-01');
    this.buildWeatherMast('ENV-01');
  }

  private positionFor(assetId: MachineAssetId): [number, number, number] {
    const pos = this.layout.assetPositions[assetId];
    return [pos[0], pos[1], pos[2]];
  }

  private baseMaterial(assetId: MachineAssetId, status: OperationalStatus = 'NORMAL'): THREE.MeshStandardMaterial {
    const hex = statusHex(status);
    const material = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.4,
      metalness: 0.55,
      emissive: hex,
      emissiveIntensity: statusEmissiveIntensity(status),
    });
    this.assetMaterials.set(assetId, material);
    return material;
  }

  // ── GEN-01 / GEN-02: diesel generator sets ──────────────────────────────

  private buildGenerator(assetId: MachineAssetId, scale: number): void {
    const group = new THREE.Group();
    group.name = assetId;
    const pos = this.positionFor(assetId);
    group.position.set(pos[0], pos[1], pos[2]);

    const body = this.baseMaterial(assetId);

    // Vibration-damping skid
    const skid = new THREE.Mesh(new THREE.BoxGeometry(2.5 * scale, 0.14, 1.2), this.trim);
    skid.position.y = 0.07;
    skid.castShadow = true;
    skid.receiveShadow = true;
    group.add(skid);

    // Engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(1.45 * scale, 0.85, 0.95), body);
    engine.position.set(-0.3, 0.58, 0);
    engine.castShadow = true;
    engine.userData = { assetId };
    group.add(engine);

    // Alternator
    const alternator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.72, 16),
      this.steel
    );
    alternator.rotation.z = Math.PI / 2;
    alternator.position.set(0.62, 0.58, 0);
    alternator.castShadow = true;
    alternator.userData = { assetId };
    group.add(alternator);

    // Radiator / cooling pack
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.9), this.steel);
    radiator.position.set(-1.05, 0.6, 0);
    radiator.castShadow = true;
    radiator.userData = { assetId };
    group.add(radiator);

    // Exhaust riser
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12), this.trim);
    exhaust.position.set(-0.35, 1.4, 0.28);
    group.add(exhaust);

    // Day tank on the set
    const dayTank = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.6), this.amber);
    dayTank.position.set(-0.9, 1.2, -0.3);
    group.add(dayTank);

    // Status ring on the floor
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.3, 28),
      new THREE.MeshBasicMaterial({ color: statusHex('NORMAL'), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  // ── BAT-01: DC battery bank ─────────────────────────────────────────────

  private buildBatteryBank(assetId: MachineAssetId): void {
    const group = new THREE.Group();
    group.name = assetId;
    const pos = this.positionFor(assetId);
    group.position.set(pos[0], pos[1], pos[2]);

    const body = this.baseMaterial(assetId);

    for (let i = 0; i < 3; i++) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.45, 0.7), body);
      rack.position.set((i - 1) * 0.72, 0.73, 0);
      rack.castShadow = true;
      rack.userData = { assetId };
      group.add(rack);

      for (let slot = 0; slot < 4; slot++) {
        const cell = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.12, 0.06),
          new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.3 })
        );
        cell.position.set((i - 1) * 0.72, 0.35 + slot * 0.3, 0.38);
        group.add(cell);
      }
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.25, 28),
      new THREE.MeshBasicMaterial({ color: statusHex('NORMAL'), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  // ── FUEL-01: aviation turbine fuel farm ─────────────────────────────────

  private buildFuelFarm(assetId: MachineAssetId): void {
    const group = new THREE.Group();
    group.name = assetId;
    const pos = this.positionFor(assetId);
    group.position.set(pos[0], pos[1], pos[2]);

    const body = this.baseMaterial(assetId);

    // Bunded containment pad
    const bund = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.36, 4.2),
      new THREE.MeshStandardMaterial({ color: '#5A5F63', roughness: 0.85 })
    );
    bund.position.y = 0.18;
    bund.receiveShadow = true;
    bund.castShadow = true;
    group.add(bund);

    // Twin horizontal fuel tanks
    [-1.05, 1.05].forEach((z) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 2.6, 20), body);
      tank.rotation.z = Math.PI / 2;
      tank.position.set(0, 1.3, z);
      tank.castShadow = true;
      tank.userData = { assetId };
      group.add(tank);

      const capGeo = new THREE.SphereGeometry(0.78, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3);
      [-1.3, 1.3].forEach((x) => {
        const cap = new THREE.Mesh(capGeo, body);
        cap.rotation.z = x < 0 ? -Math.PI / 2 : Math.PI / 2;
        cap.position.set(x, 1.3, z);
        cap.userData = { assetId };
        group.add(cap);
      });

      [-0.8, 0.8].forEach((x) => {
        const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 1.5), this.trim);
        saddle.position.set(x, 0.55, z);
        group.add(saddle);
      });
    });

    // Transfer pump cabinet
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.7), this.steel);
    cabinet.position.set(1.9, 0.55, 0);
    cabinet.castShadow = true;
    cabinet.userData = { assetId };
    group.add(cabinet);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 2.28, 32),
      new THREE.MeshBasicMaterial({ color: statusHex('NORMAL'), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  // ── PUMP-01: hydronic circulation pump ──────────────────────────────────

  private buildCirculationPump(assetId: MachineAssetId): void {
    const group = new THREE.Group();
    group.name = assetId;
    const pos = this.positionFor(assetId);
    group.position.set(pos[0], pos[1], pos[2]);

    const body = this.baseMaterial(assetId);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.9), this.trim);
    plinth.position.y = 0.08;
    plinth.castShadow = true;
    group.add(plinth);

    const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.62, 18), body);
    volute.position.set(-0.35, 0.48, 0);
    volute.castShadow = true;
    volute.userData = { assetId };
    group.add(volute);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.8, 16), this.steel);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0.42, 0.48, 0);
    motor.castShadow = true;
    motor.userData = { assetId };
    group.add(motor);

    // Suction / discharge risers
    const suction = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 12), this.steel);
    suction.position.set(-0.35, 0.95, 0);
    group.add(suction);

    const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 12), this.amber);
    discharge.rotation.z = Math.PI / 2;
    discharge.position.set(-0.35, 0.62, 0.45);
    group.add(discharge);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.0, 24),
      new THREE.MeshBasicMaterial({ color: statusHex('NORMAL'), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  // ── HEATER-01: main boiler / plate heat exchanger ───────────────────────

  private buildBoilerExchanger(assetId: MachineAssetId): void {
    const group = new THREE.Group();
    group.name = assetId;
    const pos = this.positionFor(assetId);
    group.position.set(pos[0], pos[1], pos[2]);

    const body = this.baseMaterial(assetId);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.4, 0.85), body);
    frame.position.y = 0.72;
    frame.castShadow = true;
    frame.userData = { assetId };
    group.add(frame);

    // Plate pack detail
    for (let i = 0; i < 5; i++) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.8), this.steel);
      plate.position.set(-0.5 + i * 0.22, 0.72, 0.44);
      group.add(plate);
    }

    // Flue
    const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 12), this.trim);
    flue.position.set(0.45, 2.1, -0.25);
    group.add(flue);

    // Secondary circulation pump pair
    for (let i = 0; i < 2; i++) {
      const circ = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.34, 12), this.amber);
      circ.rotation.x = Math.PI / 2;
      circ.position.set(0.85, 0.4 + i * 0.5, 0);
      group.add(circ);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.2, 24),
      new THREE.MeshBasicMaterial({ color: statusHex('NORMAL'), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  // ── ENV-01: automatic weather station mast ──────────────────────────────

  private buildWeatherMast(assetId: MachineAssetId): void {
    const group = new THREE.Group();
    group.name = assetId;
    const pos = this.positionFor(assetId);
    group.position.set(pos[0], pos[1], pos[2]);

    const body = this.baseMaterial(assetId);

    // Guyed mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 6.0, 10), this.steel);
    mast.position.y = 3.0;
    mast.castShadow = true;
    group.add(mast);

    // Instrument enclosure
    const enclosure = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), body);
    enclosure.position.y = 0.5;
    enclosure.castShadow = true;
    enclosure.userData = { assetId };
    group.add(enclosure);

    // Anemometer cross-arm with cups
    const crossArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), this.steel);
    crossArm.rotation.z = Math.PI / 2;
    crossArm.position.y = 5.9;
    group.add(crossArm);

    [-0.6, 0.6].forEach((x) => {
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.amber);
      cup.position.set(x, 5.95, 0);
      group.add(cup);
    });

    // Radiation shield below the cross-arm
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 12), this.amber);
    shield.position.y = 5.0;
    group.add(shield);

    // Air quality intake probe
    const probe = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 12), this.trim);
    probe.rotation.z = -Math.PI / 2;
    probe.position.set(0.4, 1.6, 0);
    group.add(probe);

    // Guy wires
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 6.6, 6), this.trim);
      wire.position.set(Math.cos(angle) * 1.5, 3.0, Math.sin(angle) * 1.5);
      wire.rotation.set(Math.sin(angle) * 0.42, 0, -Math.cos(angle) * 0.42);
      group.add(wire);
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.05, 24),
      new THREE.MeshBasicMaterial({ color: statusHex('NORMAL'), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  // ── Telemetry integration ───────────────────────────────────────────────

  /** Applies the initial telemetry status of every asset. */
  public initializeEquipment(assets: Record<MachineAssetId, MachineTelemetry>): void {
    (Object.keys(assets) as MachineAssetId[]).forEach((assetId) => {
      this.updateAssetStatus(assetId, assets[assetId].status);
    });
  }

  /** Syncs one asset's status colour with live simulation telemetry. */
  public updateAssetStatus(assetId: string, status: OperationalStatus): void {
    const material = this.assetMaterials.get(assetId);
    if (!material) return;
    const hex = statusHex(status);
    material.color.set(hex);
    material.emissive.set(hex);
    material.emissiveIntensity = statusEmissiveIntensity(status);

    // Keep the floor status ring in step
    const group = this.assetGroups.get(assetId);
    if (!group) return;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.color.set(hex);
      }
    });
  }

  public dispose(): void {
    this.assetMaterials.forEach((m) => m.dispose());
    this.trim.dispose();
    this.steel.dispose();
    this.amber.dispose();
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
  }
}
