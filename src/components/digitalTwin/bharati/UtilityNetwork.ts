import * as THREE from 'three';
import type { UtilityRoute } from './types';

/**
 * UtilityNetwork
 *
 * Implements the interactive 3D utility and pipeline network for BHARATI Station:
 * - Electrical Power Distribution (Amber/Electric Yellow)
 * - District Glycol Heating Loop (Thermal Orange/Red)
 * - Seawater & Potable Water Distribution (Ocean Blue)
 * - Cryogenic Fuel Supply (Fuel Brass)
 * - Telemetry & Satellite Data Links (Cyber Magenta)
 *
 * Supports interactive connectivity inspection, animated flow pulses,
 * and upstream/downstream highlighting on equipment selection.
 */
export class UtilityNetwork {
  public group: THREE.Group;
  private pipeMeshes: Map<string, THREE.Mesh> = new Map();
  private flowParticles: THREE.Points[] = [];
  private routes: UtilityRoute[] = [];
  public selectedAssetId: string | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bharati_UtilityNetwork';

    this.defineRoutes();
    this.buildNetwork();
  }

  private defineRoutes() {
    this.routes = [
      // 1. FUEL SUPPLY SYSTEM (YELLOW #EAB308): Cryogenic Tank Farm -> Generators
      {
        id: 'route_fuel_main',
        name: 'Cryogenic Fuel Feed Header',
        type: 'fuel',
        color: '#EAB308',
        points: [
          [-8.5, 0.8, -1.5],
          [-7.0, 1.2, -0.8],
          [-6.2, 2.3, 0],
          [-5.5, 2.5, 0],
        ],
        diameter: 0.08,
        sourceAssetId: 'FUEL-01',
        targetAssetId: 'GEN-01',
      },
      {
        id: 'route_fuel_branch_gen1',
        name: 'GEN-01 Fuel Injection Line',
        type: 'fuel',
        color: '#EAB308',
        points: [
          [-5.5, 2.5, 0],
          [-5.2, 2.5, -1.8],
          [-5.0, 2.7, -1.8],
        ],
        diameter: 0.06,
        sourceAssetId: 'FUEL-01',
        targetAssetId: 'GEN-01',
      },
      {
        id: 'route_fuel_branch_gen2',
        name: 'GEN-02 Fuel Injection Line',
        type: 'fuel',
        color: '#EAB308',
        points: [
          [-5.5, 2.5, 0],
          [-5.2, 2.5, 1.8],
          [-5.0, 2.7, 1.8],
        ],
        diameter: 0.06,
        sourceAssetId: 'FUEL-01',
        targetAssetId: 'GEN-02',
      },

      // 2. ELECTRICAL POWER MICROGRID (ORANGE #F97316): Generators -> Battery Hub -> Distribution Spine
      {
        id: 'route_power_gen1_bus',
        name: 'GEN-01 415V Heavy Busbar',
        type: 'power',
        color: '#F97316',
        points: [
          [-4.3, 2.8, -1.8],
          [-3.0, 2.8, -1.8],
          [-2.0, 2.8, -2.0],
          [-1.5, 2.8, -2.2],
        ],
        diameter: 0.075,
        sourceAssetId: 'GEN-01',
        targetAssetId: 'BAT-01',
      },
      {
        id: 'route_power_gen2_bus',
        name: 'GEN-02 415V Heavy Busbar',
        type: 'power',
        color: '#F97316',
        points: [
          [-4.3, 2.8, 1.8],
          [-2.5, 2.8, 1.0],
          [-2.0, 2.8, -0.5],
          [-1.5, 2.8, -2.0],
        ],
        diameter: 0.075,
        sourceAssetId: 'GEN-02',
        targetAssetId: 'BAT-01',
      },
      {
        id: 'route_power_battery_bus',
        name: 'LFP Storage DC Tie-Line',
        type: 'power',
        color: '#F97316',
        points: [
          [-1.2, 2.8, -2.2],
          [-0.5, 2.8, -2.2],
          [0.0, 2.8, -1.5],
        ],
        diameter: 0.08,
        sourceAssetId: 'BAT-01',
        targetAssetId: 'GEN-01',
      },
      {
        id: 'route_power_main_feeder',
        name: 'Station 415V Central Feeder Spine',
        type: 'power',
        color: '#F97316',
        points: [
          [0.0, 2.8, -1.5],
          [1.5, 2.8, 0],
          [3.5, 2.8, 0],
          [5.2, 2.8, 0],
        ],
        diameter: 0.07,
        sourceAssetId: 'BAT-01',
        targetAssetId: 'HEATER-01',
      },

      // 3. HIGH-TEMPERATURE HEATING WATER LOOP (RED #EF4444): CHP Heat Recovery -> Heat Exchanger -> Radiators
      {
        id: 'route_glycol_chp_feed',
        name: 'High-Temperature CHP Heat Recovery Loop',
        type: 'glycol',
        color: '#EF4444',
        points: [
          [-4.5, 3.2, -1.5],
          [-2.5, 3.2, 0.0],
          [0.0, 3.2, 1.2],
          [1.6, 3.1, 1.8],
        ],
        diameter: 0.085,
        sourceAssetId: 'GEN-01',
        targetAssetId: 'HEATER-01',
      },
      {
        id: 'route_glycol_district_supply',
        name: 'Hydronic District Radiator Supply Loop',
        type: 'glycol',
        color: '#EF4444',
        points: [
          [1.8, 3.2, 2.2],
          [1.8, 4.5, 1.5],
          [-0.5, 4.5, 1.0],
          [-3.5, 4.5, 1.0],
          [-5.5, 4.5, 1.0],
        ],
        diameter: 0.075,
        sourceAssetId: 'HEATER-01',
        targetAssetId: 'GEN-01',
      },

      // 4. POTABLE & FRESH WATER DISTRIBUTION (BLUE #3B82F6): Seawater Intake -> Desalination RO -> Habitat
      {
        id: 'route_water_intake',
        name: 'Sub-Ice Seawater Intake Conduit',
        type: 'water',
        color: '#2563EB',
        points: [
          [2.5, 0.1, -4.8],
          [2.5, 1.4, -3.5],
          [2.0, 2.4, -2.4],
          [1.8, 2.5, -2.2],
        ],
        diameter: 0.09,
        sourceAssetId: 'PUMP-01',
        targetAssetId: 'HEATER-01',
      },
      {
        id: 'route_water_potable',
        name: 'Desalinated Potable Water Header',
        type: 'water',
        color: '#3B82F6',
        points: [
          [1.8, 2.8, -2.0],
          [2.8, 2.8, -2.4],
          [3.4, 2.8, -2.8],
          [3.4, 4.2, -1.5],
          [1.0, 4.2, -1.5],
          [-1.5, 4.2, -1.5],
        ],
        diameter: 0.07,
        sourceAssetId: 'PUMP-01',
        targetAssetId: 'GEN-01',
      },

      // 5. GREYWATER & WASTEWATER DRAINAGE (GREEN #10B981): Berths & Galley -> Water Treatment Module
      {
        id: 'route_wastewater_drain',
        name: 'Greywater & Wastewater Recovery Line',
        type: 'wastewater',
        color: '#10B981',
        points: [
          [-4.5, 4.3, 1.8],
          [-2.0, 4.3, 1.8],
          [-0.5, 3.2, 0.5],
          [0.8, 2.6, -1.2],
          [1.6, 2.5, -2.0],
        ],
        diameter: 0.075,
        sourceAssetId: 'HEATER-01',
        targetAssetId: 'PUMP-01',
      },

      // 6. AIR & HVAC DISTRIBUTION DUCTS (CYAN #06B6D4): AHU Plenum -> Laboratories & Command
      {
        id: 'route_air_hvac_main',
        name: 'Tempered Fresh Air HVAC Ductwork',
        type: 'air',
        color: '#06B6D4',
        points: [
          [1.8, 3.6, 2.0],
          [1.8, 5.7, 1.5],
          [3.2, 5.7, 0.5],
          [4.8, 5.7, 0.0],
          [5.8, 5.5, 0.0],
        ],
        diameter: 0.11,
        sourceAssetId: 'HEATER-01',
        targetAssetId: 'ENV-01',
      },
      {
        id: 'route_air_hvac_labs',
        name: 'Science Labs Ventilation Air Duct',
        type: 'air',
        color: '#06B6D4',
        points: [
          [1.8, 5.7, 1.5],
          [0.0, 5.7, 1.5],
          [-2.5, 5.7, 1.5],
          [-4.8, 5.7, 1.5],
        ],
        diameter: 0.09,
        sourceAssetId: 'HEATER-01',
        targetAssetId: 'GEN-01',
      },
    ];
  }

  private buildNetwork() {
    this.routes.forEach((route) => {
      const vectors = route.points.map((p) => new THREE.Vector3(...p));
      const curve = new THREE.CatmullRomCurve3(vectors);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, route.diameter, 12, false);

      const mat = new THREE.MeshStandardMaterial({
        color: route.color,
        emissive: route.color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.85,
      });

      const pipe = new THREE.Mesh(tubeGeo, mat);
      pipe.userData = { routeId: route.id, route };
      this.group.add(pipe);
      this.pipeMeshes.set(route.id, pipe);

      // Create animated particle pulse dots traveling along the pipeline
      const particleCount = 18;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const particleProgress: number[] = [];

      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const pt = curve.getPoint(t);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;
        particleProgress.push(t);
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: '#FFFFFF',
        size: 0.15,
        transparent: true,
        opacity: 0.95,
      });

      const particles = new THREE.Points(particleGeo, particleMat);
      particles.userData = { curve, progress: particleProgress };
      this.group.add(particles);
      this.flowParticles.push(particles);
    });
  }

  /**
   * Updates flow animation along all pipelines
   */
  public update(dt: number) {
    this.flowParticles.forEach((points) => {
      const curve = points.userData.curve as THREE.CatmullRomCurve3;
      const progress = points.userData.progress as number[];
      const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < progress.length; i++) {
        progress[i] = (progress[i] + dt * 0.45) % 1.0;
        const pt = curve.getPoint(progress[i]);
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;
    });
  }

  /**
   * Highlights pipelines connected to the selected equipment
   */
  public highlightAssetConnections(assetId: string | null) {
    this.selectedAssetId = assetId;

    this.pipeMeshes.forEach((mesh, routeId) => {
      const route = this.routes.find((r) => r.id === routeId);
      if (!route) return;

      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (!assetId) {
        // Normal visibility for all pipes
        mat.opacity = 0.85;
        mat.emissiveIntensity = 0.35;
      } else {
        const isConnected =
          route.sourceAssetId === assetId || route.targetAssetId === assetId;
        if (isConnected) {
          mat.opacity = 1.0;
          mat.emissiveIntensity = 0.9; // Bright glow for active connection
        } else {
          mat.opacity = 0.15; // Dim unconnected pipelines
          mat.emissiveIntensity = 0.05;
        }
      }
    });
  }

  public setVisibility(visible: boolean) {
    this.group.visible = visible;
  }

  public dispose() {
    this.pipeMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.flowParticles.forEach((pts) => {
      pts.geometry.dispose();
      (pts.material as THREE.Material).dispose();
    });
  }
}
