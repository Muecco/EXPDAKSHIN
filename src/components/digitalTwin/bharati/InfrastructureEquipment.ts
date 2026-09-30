import * as THREE from 'three';
import type { MachineAssetId, MachineTelemetry } from '../../../types/digitalTwin';
import type { OperationalStatus } from '../../../types';

function getStatusHex(status: OperationalStatus): string {
  if (status === 'CRITICAL' || status === 'FAILED') return '#DC2626';
  if (status === 'WARNING' || status === 'DEGRADING') return '#D97706';
  if (status === 'OFFLINE') return '#64748B';
  return '#004E64'; // NORMAL - Deep Teal
}

/**
 * InfrastructureEquipment
 *
 * Implements high-fidelity procedural 3D equipment models for all 7 primary machinery
 * assets in the BHARATI Antarctic digital twin, plus auxiliary microgrid infrastructure.
 */
export class InfrastructureEquipment {
  public group: THREE.Group;
  public assetGroups: Map<string, THREE.Group> = new Map();
  public assetMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();
  public assetTelemetryData: Map<string, MachineTelemetry> = new Map();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_InfrastructureEquipment';
  }

  /**
   * Initializes all equipment models using the station telemetry asset dictionary
   */
  public initializeEquipment(assets: Record<MachineAssetId, MachineTelemetry>) {
    // Clear any previous meshes
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.assetGroups.clear();
    this.assetMaterials.clear();
    this.assetTelemetryData.clear();

    // Store telemetry
    Object.values(assets).forEach((a) => this.assetTelemetryData.set(a.asset_id, a));

    // 1. GEN-01 (Primary Combined Heat & Power Turbine A)
    this.createTurbineGenerator('GEN-01', assets['GEN-01']);

    // 2. GEN-02 (Secondary Combined Heat & Power Turbine B)
    this.createTurbineGenerator('GEN-02', assets['GEN-02']);

    // 3. BAT-01 (Lithium Iron Phosphate Energy Storage Bank)
    this.createBatteryBank('BAT-01', assets['BAT-01']);

    // 4. FUEL-01 (Double-Walled Cryogenic Fuel Storage System)
    this.createFuelStorage('FUEL-01', assets['FUEL-01']);

    // 5. PUMP-01 (Seawater Reverse Osmosis High-Pressure Pump)
    this.createReverseOsmosisPump('PUMP-01', assets['PUMP-01']);

    // 6. HEATER-01 (Modulated District Glycol Loop Heat Exchanger)
    this.createDistrictHeater('HEATER-01', assets['HEATER-01']);

    // 7. ENV-01 (Stilt Aerodynamic Air Quality Array)
    this.createAirQualityArray('ENV-01', assets['ENV-01']);

    // 8. Auxiliary Microgrid Inverter & HV Transformer
    this.createAuxiliaryPowerInfrastructure();

    // 9. Auxiliary Fresh Water Storage Tank
    this.createAuxiliaryWaterTank();
  }

  /**
   * GEN-01 & GEN-02: CHP Diesel Turbine / Engine Generator
   */
  private createTurbineGenerator(assetId: MachineAssetId, asset: MachineTelemetry | undefined) {
    const pos = asset ? asset.position : [-5.0, 3.2, assetId === 'GEN-01' ? -2.0 : 2.0];
    const status = asset?.status || 'NORMAL';
    const statusHex = getStatusHex(status);

    const group = new THREE.Group();
    group.name = assetId;
    // Elevate slightly to Level 1 floor (y = 2.4)
    group.position.set(pos[0], 2.45, pos[2]);

    const baseMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      roughness: 0.35,
      metalness: 0.65,
      emissive: statusHex,
      emissiveIntensity: status === 'CRITICAL' ? 0.35 : 0.08,
    });
    this.assetMaterials.set(assetId, baseMat);

    const metalTrim = new THREE.MeshStandardMaterial({
      color: '#1E293B',
      roughness: 0.5,
      metalness: 0.8,
    });

    // Vibration-damping skid foundation
    const skid = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.4), metalTrim);
    skid.position.y = 0.075;
    skid.castShadow = true;
    group.add(skid);

    // Main Engine / Turbine Block
    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 1.0), baseMat);
    engineBlock.position.set(-0.3, 0.55, 0);
    engineBlock.castShadow = true;
    engineBlock.userData = { assetId };
    group.add(engineBlock);

    // Cylindrical Alternator unit
    const alternator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.75, 16),
      metalTrim
    );
    alternator.rotation.z = Math.PI / 2;
    alternator.position.set(0.65, 0.55, 0);
    alternator.castShadow = true;
    alternator.userData = { assetId };
    group.add(alternator);

    // Turbocharger and exhaust riser duct
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12),
      metalTrim
    );
    exhaust.position.set(-0.5, 1.25, 0.25);
    group.add(exhaust);

    // Base Status Indicator Ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: statusHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  /**
   * BAT-01: Lithium Iron Phosphate Energy Storage Bank
   */
  private createBatteryBank(assetId: MachineAssetId, asset: MachineTelemetry | undefined) {
    const pos = asset ? asset.position : [-2.5, 2.5, -3.0];
    const status = asset?.status || 'NORMAL';
    const statusHex = getStatusHex(status);

    const group = new THREE.Group();
    group.name = assetId;
    group.position.set(pos[0], 2.45, pos[2]);

    const baseMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      roughness: 0.3,
      metalness: 0.5,
      emissive: statusHex,
      emissiveIntensity: 0.08,
    });
    this.assetMaterials.set(assetId, baseMat);

    // 3 Modular 19-inch battery rack cabinets side-by-side
    for (let i = 0; i < 3; i++) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.7), baseMat);
      rack.position.set((i - 1) * 0.75, 0.7, 0);
      rack.castShadow = true;
      rack.userData = { assetId };
      group.add(rack);

      // Battery module slot stripes
      for (let s = 0; s < 4; s++) {
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.12, 0.05),
          new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.2 })
        );
        slot.position.set((i - 1) * 0.75, 0.35 + s * 0.28, 0.36);
        group.add(slot);
      }
    }

    // Status ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.35, 32),
      new THREE.MeshBasicMaterial({ color: statusHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  /**
   * FUEL-01: Double-Walled Cryogenic Fuel Storage System (Exterior Tank Farm)
   */
  private createFuelStorage(assetId: MachineAssetId, asset: MachineTelemetry | undefined) {
    const pos = asset ? asset.position : [-8.5, 0.5, 0];
    const status = asset?.status || 'NORMAL';
    const statusHex = getStatusHex(status);

    const group = new THREE.Group();
    group.name = assetId;
    group.position.set(pos[0], 0.15, pos[2]);

    const baseMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      roughness: 0.4,
      metalness: 0.7,
      emissive: statusHex,
      emissiveIntensity: 0.08,
    });
    this.assetMaterials.set(assetId, baseMat);

    // Concrete secondary containment bund / basin
    const bund = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.4, 4.4),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.8 })
    );
    bund.position.y = 0.2;
    bund.receiveShadow = true;
    bund.castShadow = true;
    group.add(bund);

    // Twin horizontal cylindrical cryogenic fuel tanks
    [-1.2, 1.2].forEach((zOffset) => {
      // Main tank cylinder
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 2.8, 20),
        baseMat
      );
      tank.rotation.z = Math.PI / 2;
      tank.position.set(0, 1.3, zOffset);
      tank.castShadow = true;
      tank.userData = { assetId };
      group.add(tank);

      // Dished tank end caps (spherical caps)
      const capWest = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3),
        baseMat
      );
      capWest.rotation.z = -Math.PI / 2;
      capWest.position.set(-1.4, 1.3, zOffset);
      group.add(capWest);

      const capEast = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3),
        baseMat
      );
      capEast.rotation.z = Math.PI / 2;
      capEast.position.set(1.4, 1.3, zOffset);
      group.add(capEast);

      // Cradle supports
      [-0.8, 0.8].forEach((xSupp) => {
        const saddle = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.5, 1.6),
          new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.6 })
        );
        saddle.position.set(xSupp, 0.55, zOffset);
        group.add(saddle);
      });
    });

    // Base indicator ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.4, 32),
      new THREE.MeshBasicMaterial({ color: statusHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  /**
   * PUMP-01: Seawater Reverse Osmosis Water Pump
   */
  private createReverseOsmosisPump(assetId: MachineAssetId, asset: MachineTelemetry | undefined) {
    const pos = asset ? asset.position : [2.5, 2.45, -2.8];
    const status = asset?.status || 'CRITICAL';
    const statusHex = getStatusHex(status);

    const group = new THREE.Group();
    group.name = assetId;
    group.position.set(pos[0], 2.45, pos[2]);

    const baseMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      roughness: 0.35,
      metalness: 0.6,
      emissive: statusHex,
      emissiveIntensity: status === 'CRITICAL' ? 0.45 : 0.08,
    });
    this.assetMaterials.set(assetId, baseMat);

    // Heavy cast-iron pump housing
    const pumpVolute = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.58, 0.7, 16),
      baseMat
    );
    pumpVolute.position.set(-0.35, 0.45, 0);
    pumpVolute.castShadow = true;
    pumpVolute.userData = { assetId };
    group.add(pumpVolute);

    // Electric induction motor (drive)
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.85, 16),
      new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.4, metalness: 0.8 })
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0.45, 0.45, 0);
    motor.castShadow = true;
    group.add(motor);

    // Intake/Discharge manifold pipes
    const pipeIntake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12),
      baseMat
    );
    pipeIntake.position.set(-0.35, 0.95, 0);
    group.add(pipeIntake);

    // Base indicator ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.05, 24),
      new THREE.MeshBasicMaterial({ color: statusHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  /**
   * HEATER-01: Modulated District Glycol Loop Heat Exchanger
   */
  private createDistrictHeater(assetId: MachineAssetId, asset: MachineTelemetry | undefined) {
    const pos = asset ? asset.position : [2.0, 2.45, 2.5];
    const status = asset?.status || 'NORMAL';
    const statusHex = getStatusHex(status);

    const group = new THREE.Group();
    group.name = assetId;
    group.position.set(pos[0], 2.45, pos[2]);

    const baseMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      roughness: 0.35,
      metalness: 0.5,
      emissive: statusHex,
      emissiveIntensity: 0.08,
    });
    this.assetMaterials.set(assetId, baseMat);

    // Plate Heat Exchanger frame
    const heatExchanger = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.3, 0.8),
      baseMat
    );
    heatExchanger.position.set(0, 0.65, 0);
    heatExchanger.castShadow = true;
    heatExchanger.userData = { assetId };
    group.add(heatExchanger);

    // Circulation pump pair mounted on side
    for (let i = 0; i < 2; i++) {
      const circPump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.35, 12),
        new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.4 })
      );
      circPump.rotation.x = Math.PI / 2;
      circPump.position.set(0.7, 0.4 + i * 0.5, 0);
      group.add(circPump);
    }

    // Base ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.25, 24),
      new THREE.MeshBasicMaterial({ color: statusHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  /**
   * ENV-01: Stilt Aerodynamic Air Quality Array
   */
  private createAirQualityArray(assetId: MachineAssetId, asset: MachineTelemetry | undefined) {
    const pos = asset ? asset.position : [5.0, 2.45, 0];
    const status = asset?.status || 'NORMAL';
    const statusHex = getStatusHex(status);

    const group = new THREE.Group();
    group.name = assetId;
    group.position.set(pos[0], 2.45, pos[2]);

    const baseMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      roughness: 0.35,
      metalness: 0.7,
      emissive: statusHex,
      emissiveIntensity: 0.08,
    });
    this.assetMaterials.set(assetId, baseMat);

    // Sensor housing enclosure
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), baseMat);
    housing.position.set(0, 0.55, 0);
    housing.castShadow = true;
    housing.userData = { assetId };
    group.add(housing);

    // Aerodynamic particle intake probe horn
    const probe = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.3, metalness: 0.9 })
    );
    probe.rotation.z = -Math.PI / 2;
    probe.position.set(0.65, 0.65, 0);
    group.add(probe);

    // Base ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.0, 24),
      new THREE.MeshBasicMaterial({ color: statusHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    this.group.add(group);
    this.assetGroups.set(assetId, group);
  }

  /**
   * Auxiliary Microgrid Inverter & HV Transformer
   */
  private createAuxiliaryPowerInfrastructure() {
    const auxGroup = new THREE.Group();
    auxGroup.name = 'INFRA-MICROGRID';
    auxGroup.position.set(-1.2, 2.45, -2.8);

    const mat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      roughness: 0.3,
      metalness: 0.7,
    });

    const inverter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.8), mat);
    inverter.position.set(0, 0.75, 0);
    inverter.castShadow = true;
    inverter.userData = { assetId: 'INFRA-MICROGRID', name: 'Microgrid Inverter & Supervisory Bus' };
    auxGroup.add(inverter);

    this.group.add(auxGroup);
    this.assetGroups.set('INFRA-MICROGRID', auxGroup);
  }

  /**
   * Auxiliary Water Desalination Tanks
   */
  private createAuxiliaryWaterTank() {
    const waterGroup = new THREE.Group();
    waterGroup.name = 'INFRA-WATER-TANK';
    waterGroup.position.set(3.4, 2.45, -3.0);

    const tankMat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      roughness: 0.25,
      metalness: 0.5,
    });

    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.4, 16), tankMat);
    tank.position.set(0, 0.7, 0);
    tank.castShadow = true;
    tank.userData = { assetId: 'INFRA-WATER-TANK', name: 'Potable Water Reserve Buffer' };
    waterGroup.add(tank);

    this.group.add(waterGroup);
    this.assetGroups.set('INFRA-WATER-TANK', waterGroup);
  }

  /**
   * Dynamically updates status color of equipment when simulation changes
   */
  public updateAssetStatus(assetId: string, status: OperationalStatus) {
    const mat = this.assetMaterials.get(assetId);
    if (!mat) return;
    const colorHex = getStatusHex(status);
    mat.color.set(colorHex);
    mat.emissive.set(colorHex);
    mat.emissiveIntensity = (status === 'CRITICAL' || status === 'FAILED') ? 0.45 : 0.08;

    const group = this.assetGroups.get(assetId);
    if (group) {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.set(colorHex);
        }
      });
    }
  }

  /**
   * Toggles Thermal Radiation Mode for the machinery:
   * Sets emissive glowing cores on heat-generating equipment (generators, heaters, pumps)
   * so they visually radiate active thermal energy from their positions.
   */
  public setThermalMode(enabled: boolean) {
    if (enabled) {
      const thermalConfig: Record<string, { color: string; emissive: string; intensity: number }> = {
        'GEN-01': { color: '#EF4444', emissive: '#F97316', intensity: 1.4 },
        'GEN-02': { color: '#EF4444', emissive: '#F97316', intensity: 1.4 },
        'HEATER-01': { color: '#F97316', emissive: '#FBBF24', intensity: 1.2 },
        'PUMP-01': { color: '#F59E0B', emissive: '#FCD34D', intensity: 0.85 },
        'BAT-01': { color: '#B45309', emissive: '#F59E0B', intensity: 0.6 },
        'FUEL-01': { color: '#475569', emissive: '#334155', intensity: 0.1 },
        'ENV-01': { color: '#0284C7', emissive: '#38BDF8', intensity: 0.2 },
      };

      this.assetMaterials.forEach((mat, assetId) => {
        const cfg = thermalConfig[assetId];
        if (cfg) {
          mat.color.set(cfg.color);
          mat.emissive.set(cfg.emissive);
          mat.emissiveIntensity = cfg.intensity;
        }
      });
    } else {
      this.assetMaterials.forEach((_mat, assetId) => {
        const telemetry = this.assetTelemetryData.get(assetId);
        this.updateAssetStatus(assetId, telemetry?.status || 'NORMAL');
      });
    }
  }

  public dispose() {
    this.assetMaterials.forEach((m) => m.dispose());
  }
}
