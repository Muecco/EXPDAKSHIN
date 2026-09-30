/**
 * DAKSHIN — CENTRAL DETERMINISTIC SIMULATION ENGINE
 *
 * Provides:
 * 1. Stateful continuity (small natural variations around baselines)
 * 2. Environment -> Machinery physical coupling:
 *    Outside Temp ↓ => Heating Demand ↑ => Station Load ↑ => Gen Load ↑ => Fuel ↑ => Stress ↑ => Risk ↑
 * 3. Predefined deterministic scenarios (atmospheric, machinery, combined)
 * 4. Dynamic threshold alert generation
 * 5. Chronological simulation event timeline
 * 6. Guided 20-step demonstration runner
 * 7. Clean simulation reset
 */

import type { StationId, OperationalStatus, ConnectionStatus } from '../../types';
import type { MachineAssetId } from '../../types/digitalTwin';
import type { WeatherState } from '../../types/weather';
import type {
  AtmosphericTelemetry,
  CouplingChainState,
  MachineryTelemetryWithBaseline,
  ScenarioId,
  SimulationAlert,
  SimulationScenarioDefinition,
  TimelineEvent,
} from './telemetryContracts';
import { PROTOTYPE_MACHINERY_BASELINES } from './machineryBaselines';
import { calculateAssetRisk } from './riskModel';
import { DATA_PROVENANCE_STRING, getAtmosphericHistory } from './atmosphericHistoryData';

// ---------------------------------------------------------------------------
// Scenario Definitions
// ---------------------------------------------------------------------------

export const SIMULATION_SCENARIOS: Record<ScenarioId, SimulationScenarioDefinition> = {
  NORMAL_WEATHER: {
    id: 'NORMAL_WEATHER',
    name: 'Normal Weather',
    category: 'atmospheric',
    description: 'Typical calm winter conditions with light snow drift and nominal katabatic breeze.',
    badge_label: 'ATMOSPHERE: NOMINAL',
  },
  EXTREME_COLD: {
    id: 'EXTREME_COLD',
    name: 'Extreme Cold Snap',
    category: 'atmospheric',
    description: 'Deep polar vortex anomaly plunges surface temperatures down to -52.4°C.',
    badge_label: 'ATMOSPHERE: -52.4°C',
  },
  HIGH_WIND: {
    id: 'HIGH_WIND',
    name: 'High Katabatic Gale',
    category: 'atmospheric',
    description: 'Sustained katabatic wind surge at 28.5 m/s with heavy drift and low visibility.',
    badge_label: 'WIND: 28.5 m/s',
  },
  HEAVY_SNOW: {
    id: 'HEAVY_SNOW',
    name: 'Heavy Snow Fall',
    category: 'atmospheric',
    description: 'Dense snowfall with 0.85 opacity, building drifts around station stilts.',
    badge_label: 'SNOW: HEAVY',
  },
  BLIZZARD: {
    id: 'BLIZZARD',
    name: 'Catastrophic Blizzard',
    category: 'atmospheric',
    description: 'Severe Antarctic blizzard, wind 38.0 m/s, zero visibility, deep pressure trough.',
    badge_label: 'BLIZZARD: GALE',
  },

  NORMAL_MACHINERY: {
    id: 'NORMAL_MACHINERY',
    name: 'Nominal Machinery',
    category: 'machinery',
    description: 'All 7 station machinery assets operating within nominal baseline envelopes.',
    badge_label: 'MACHINERY: NOMINAL',
  },
  GENERATOR_VIBRATION: {
    id: 'GENERATOR_VIBRATION',
    name: 'Generator Vibration Spike',
    category: 'machinery',
    description: 'GEN-01 main bearing eccentricity elevates vibration to 6.2 mm/s RMS.',
    badge_label: 'GEN-01: 6.2 mm/s',
  },
  GENERATOR_OVERHEAT: {
    id: 'GENERATOR_OVERHEAT',
    name: 'Generator Overheat Surge',
    category: 'machinery',
    description: 'GEN-01 jacket coolant degradation elevates core temp to 98.6°C (CRITICAL).',
    badge_label: 'GEN-01: 98.6°C',
  },
  GENERATOR_OVERLOAD: {
    id: 'GENERATOR_OVERLOAD',
    name: 'Generator Current Overload',
    category: 'machinery',
    description: 'Auxiliary scientific heating drives GEN-01 current past 96.0 A limit.',
    badge_label: 'GEN-01: OVERLOAD',
  },
  PUMP_DEGRADATION: {
    id: 'PUMP_DEGRADATION',
    name: 'Hydronic Pump Degradation',
    category: 'machinery',
    description: 'PUMP-01 impeller cavitation drops efficiency to 68% and raises head vibration.',
    badge_label: 'PUMP-01: CAVITATION',
  },
  HEATER_FAILURE: {
    id: 'HEATER_FAILURE',
    name: 'Primary Heater Failure',
    category: 'machinery',
    description: 'HEATER-01 life-support exchanger trips; habitat supply temp falls to 8.5°C.',
    badge_label: 'HEATER-01: TRIPPED',
  },
  BATTERY_LOW: {
    id: 'BATTERY_LOW',
    name: 'BESS Battery Depletion',
    category: 'machinery',
    description: 'BAT-01 state of charge drops to 14.5% with float voltage sag.',
    badge_label: 'BAT-01: 14.5% SOC',
  },

  ANTARCTIC_EXTREME_EVENT: {
    id: 'ANTARCTIC_EXTREME_EVENT',
    name: 'Antarctic Super-Blizzard Event',
    category: 'combined',
    description: 'Coincident -48°C freeze and 36 m/s blizzard forcing emergency load dispatch.',
    badge_label: 'COMBINED: SUPER-BLIZZARD',
  },
  CASCADING_LOAD_EVENT: {
    id: 'CASCADING_LOAD_EVENT',
    name: 'Cascading Thermal-Power Overload',
    category: 'combined',
    description: 'Sub-zero freeze triggers maximum heating, pushing GEN-01 & PUMP-01 to limits.',
    badge_label: 'COMBINED: CASCADE OVERLOAD',
  },
  MULTI_ASSET_DEGRADATION: {
    id: 'MULTI_ASSET_DEGRADATION',
    name: 'Multi-Asset Compound Stress',
    category: 'combined',
    description: 'Compound vibration on GEN-01, thermal loss on HEATER-01, and low BESS float.',
    badge_label: 'COMBINED: MULTI-ASSET',
  },
};

// ---------------------------------------------------------------------------
// Internal State Model
// ---------------------------------------------------------------------------

interface StationSimState {
  currentAtmospheric: AtmosphericTelemetry;
  activeScenario: ScenarioId | null;
  coupling: CouplingChainState;
  assetStates: Record<
    MachineAssetId,
    {
      temp: number;
      vib: number;
      curr: number;
      power: number;
      eff: number;
      fuel: number;
      fuel_consumption: number;
      hours: number;
      status: OperationalStatus;
      issue?: string;
    }
  >;
  alerts: SimulationAlert[];
  timeline: TimelineEvent[];
}

export class SimulationEngine {
  private stationStates: Record<StationId, StationSimState>;
  private connectionStatus: ConnectionStatus = 'ONLINE';
  private isSimulationActiveFlag = true;
  private listeners: Set<() => void> = new Set();
  private timer: number | null = null;
  private tickCounter = 0;

  constructor() {
    this.stationStates = {
      maitri: this.createInitialStationState('maitri'),
      bharati: this.createInitialStationState('bharati'),
    };
    this.startEngineLoop();
  }

  private createInitialStationState(stationId: StationId): StationSimState {
    const history = getAtmosphericHistory(stationId, '24H');
    const latest = history[history.length - 1];

    const currentAtmospheric: AtmosphericTelemetry = {
      ...latest,
      station_id: stationId,
      provenance: DATA_PROVENANCE_STRING,
    };

    const assetStates: StationSimState['assetStates'] = {} as any;
    (Object.keys(PROTOTYPE_MACHINERY_BASELINES) as MachineAssetId[]).forEach((id) => {
      const b = PROTOTYPE_MACHINERY_BASELINES[id];
      assetStates[id] = {
        temp: b.baseline_temperature,
        vib: b.baseline_vibration,
        curr: b.baseline_current,
        power: b.baseline_power,
        eff: b.baseline_efficiency,
        fuel: id === 'BAT-01' ? 88.0 : id === 'FUEL-01' ? 76.5 : 84.0,
        fuel_consumption: b.baseline_fuel_consumption,
        hours: b.baseline_operating_hours,
        status: b.nominal_state,
        issue: undefined,
      };
    });

    const coupling: CouplingChainState = {
      outside_temp: currentAtmospheric.temperature,
      heating_demand_pct: 62.0,
      station_electrical_load_kw: 148.0,
      generator_load_pct: 68.0,
      total_fuel_consumption_rate: 28.5,
      machinery_stress_index: 18.0,
      overall_risk_score: 14,
      active_coupling_text: 'Nominal coupling: baseline heating demand supported by GEN-01 base load.',
    };

    const initialTimeline: TimelineEvent[] = [
      {
        event_id: `evt-init-${stationId}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        station_id: stationId,
        category: 'SYSTEM',
        title: 'Simulation Provider Initialized',
        description: `Local simulation active for ${stationId.toUpperCase()}. Calibrated to IMD historical meteorology and prototype machinery baselines.`,
      },
    ];

    return {
      currentAtmospheric,
      activeScenario: null,
      coupling,
      assetStates,
      alerts: [],
      timeline: initialTimeline,
    };
  }

  // Master simulation runner (1 tick per second)
  private startEngineLoop() {
    if (typeof window === 'undefined') return;
    this.timer = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  public destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.listeners.clear();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try { cb(); } catch (e) { console.error('Sim engine listener error', e); }
    });
  }

  // ---------------------------------------------------------------------------
  // Continuous Tick & Coupling Physics
  // ---------------------------------------------------------------------------

  private tick() {
    this.tickCounter++;
    const stations: StationId[] = ['maitri', 'bharati'];

    stations.forEach((sId) => {
      const state = this.stationStates[sId];
      const scenario = state.activeScenario;

      // Small natural continuous variation (sine oscillations + tiny random walk)
      const noise = (Math.sin(this.tickCounter * 0.2) + (Math.random() - 0.5) * 0.4) * 0.15;

      // 1. Natural or scenario temperature target
      let targetTemp = sId === 'bharati' ? -31.8 : -28.4;
      let targetWind = sId === 'bharati' ? 18.0 : 14.2;
      let targetWeather: WeatherState = 'MODERATE_SNOW';

      if (scenario === 'EXTREME_COLD' || scenario === 'CASCADING_LOAD_EVENT') {
        targetTemp = -52.4;
      } else if (scenario === 'HIGH_WIND') {
        targetWind = 28.5;
        targetWeather = 'HEAVY_SNOW';
      } else if (scenario === 'HEAVY_SNOW') {
        targetWeather = 'HEAVY_SNOW';
        targetWind = 19.5;
      } else if (scenario === 'BLIZZARD' || scenario === 'ANTARCTIC_EXTREME_EVENT') {
        targetTemp = -46.0;
        targetWind = 38.0;
        targetWeather = 'BLIZZARD';
      } else if (scenario === 'NORMAL_WEATHER') {
        targetWeather = 'CLEAR';
        targetWind = 5.2;
      }

      // Smoothly approach atmospheric targets
      state.currentAtmospheric.temperature += (targetTemp - state.currentAtmospheric.temperature) * 0.08 + noise * 0.2;
      state.currentAtmospheric.temperature = Number(state.currentAtmospheric.temperature.toFixed(1));

      state.currentAtmospheric.wind_speed += (targetWind - state.currentAtmospheric.wind_speed) * 0.08 + noise * 0.5;
      state.currentAtmospheric.wind_speed = Number(Math.max(1, state.currentAtmospheric.wind_speed).toFixed(1));
      state.currentAtmospheric.weather_state = targetWeather;

      // 2. Physical Coupling Equation:
      // Outside Temp drop => Heating demand rises linearly
      const tempDelta = Math.max(0, -20.0 - state.currentAtmospheric.temperature); // 0 at -20°C, 32.4 at -52.4°C
      const heatingDemand = Math.min(100, 50.0 + tempDelta * 1.5);
      const stationElectricalLoad = Math.min(220, 110.0 + (heatingDemand / 100) * 85.0);
      const gen1LoadPct = Math.min(100, (stationElectricalLoad / 180.0) * 100);
      const fuelRate = 22.0 + (gen1LoadPct / 100) * 16.0; // 22 - 38 L/h
      const stressIndex = Math.min(100, Math.max(10, (gen1LoadPct - 50) * 1.8 + (tempDelta > 20 ? 25 : 0)));

      state.coupling = {
        outside_temp: state.currentAtmospheric.temperature,
        heating_demand_pct: Number(heatingDemand.toFixed(1)),
        station_electrical_load_kw: Number(stationElectricalLoad.toFixed(1)),
        generator_load_pct: Number(gen1LoadPct.toFixed(1)),
        total_fuel_consumption_rate: Number(fuelRate.toFixed(1)),
        machinery_stress_index: Number(stressIndex.toFixed(1)),
        overall_risk_score: Math.round(stressIndex * 0.8),
        active_coupling_text:
          tempDelta > 25
            ? 'CRITICAL COUPLING: Severe polar cold is demanding 90%+ heating, driving GEN-01 near maximum continuous capacity.'
            : tempDelta > 12
            ? 'ELEVATED COUPLING: Low temperatures driving heating demand above nominal baseline.'
            : 'NOMINAL COUPLING: Balanced load-thermal equilibrium.',
      };

      // 3. Update machinery states with continuity & scenario perturbations
      const g1 = state.assetStates['GEN-01'];
      const g1Base = PROTOTYPE_MACHINERY_BASELINES['GEN-01'];

      // Normal thermal generation coupled to load
      let g1TargetTemp = g1Base.baseline_temperature + (gen1LoadPct - 60) * 0.25;
      let g1TargetVib = g1Base.baseline_vibration + (gen1LoadPct > 85 ? 1.2 : 0.0);
      let g1TargetCurr = (stationElectricalLoad / 1.732 / 0.4) * 0.5; // ~72A at nominal
      let g1TargetEff = g1Base.baseline_efficiency - (gen1LoadPct > 90 ? 8.0 : 0.0);

      // Scenario Overrides
      if (scenario === 'GENERATOR_VIBRATION' || scenario === 'MULTI_ASSET_DEGRADATION') {
        g1TargetVib = 6.4;
      }
      if (scenario === 'GENERATOR_OVERHEAT' || scenario === 'CASCADING_LOAD_EVENT') {
        g1TargetTemp = 98.4;
      }
      if (scenario === 'GENERATOR_OVERLOAD' || scenario === 'CASCADING_LOAD_EVENT') {
        g1TargetCurr = 97.5;
        g1TargetEff = 72.0;
      }

      // Smooth approach
      g1.temp += (g1TargetTemp - g1.temp) * 0.1 + noise * 0.3;
      g1.vib += (g1TargetVib - g1.vib) * 0.1 + noise * 0.05;
      g1.curr += (g1TargetCurr - g1.curr) * 0.1 + noise * 0.2;
      g1.eff += (g1TargetEff - g1.eff) * 0.1;
      g1.power = stationElectricalLoad * 0.85;
      g1.fuel_consumption = fuelRate;

      // Status determination for GEN-01
      const g1Risk = calculateAssetRisk(g1Base, g1.temp, g1.vib, g1.curr, g1.eff);
      if (g1Risk.state === 'CRITICAL') {
        g1.status = 'CRITICAL';
        g1.issue = g1Risk.contributors.slice(0, 2).join('; ');
      } else if (g1Risk.state === 'HIGH' || g1Risk.state === 'WARNING') {
        g1.status = 'WARNING';
        g1.issue = g1Risk.contributors[0];
      } else {
        g1.status = 'NORMAL';
        g1.issue = undefined;
      }

      // PUMP-01
      const p1 = state.assetStates['PUMP-01'];
      const p1Base = PROTOTYPE_MACHINERY_BASELINES['PUMP-01'];
      let p1TargetEff = p1Base.baseline_efficiency;
      let p1TargetVib = p1Base.baseline_vibration;
      if (scenario === 'PUMP_DEGRADATION' || scenario === 'MULTI_ASSET_DEGRADATION') {
        p1TargetEff = 67.0;
        p1TargetVib = 5.6;
      }
      p1.eff += (p1TargetEff - p1.eff) * 0.1;
      p1.vib += (p1TargetVib - p1.vib) * 0.1;
      const p1Risk = calculateAssetRisk(p1Base, p1.temp, p1.vib, p1.curr, p1.eff);
      p1.status = p1Risk.state === 'CRITICAL' ? 'CRITICAL' : p1Risk.state !== 'NORMAL' ? 'WARNING' : 'NORMAL';

      // HEATER-01
      const h1 = state.assetStates['HEATER-01'];
      const h1Base = PROTOTYPE_MACHINERY_BASELINES['HEATER-01'];
      let h1TargetTemp = h1Base.baseline_temperature;
      let h1TargetEff = h1Base.baseline_efficiency;
      if (scenario === 'HEATER_FAILURE') {
        h1TargetTemp = 7.8;
        h1TargetEff = 32.0;
      }
      h1.temp += (h1TargetTemp - h1.temp) * 0.1;
      h1.eff += (h1TargetEff - h1.eff) * 0.1;
      const h1Risk = calculateAssetRisk(h1Base, h1.temp, h1.vib, h1.curr, h1.eff);
      h1.status = scenario === 'HEATER_FAILURE' ? 'FAILED' : h1Risk.state === 'CRITICAL' ? 'CRITICAL' : h1Risk.state !== 'NORMAL' ? 'WARNING' : 'NORMAL';

      // BAT-01
      const b1 = state.assetStates['BAT-01'];
      const b1Base = PROTOTYPE_MACHINERY_BASELINES['BAT-01'];
      let b1TargetFuel = 88.0;
      if (scenario === 'BATTERY_LOW' || scenario === 'MULTI_ASSET_DEGRADATION') {
        b1TargetFuel = 14.5;
      }
      b1.fuel += (b1TargetFuel - b1.fuel) * 0.08;
      const b1Risk = calculateAssetRisk(b1Base, b1.temp, b1.vib, b1.curr, b1.fuel < 20 ? 68.0 : b1Base.baseline_efficiency);
      b1.status = b1.fuel < 20 ? 'WARNING' : b1Risk.state === 'CRITICAL' ? 'CRITICAL' : 'NORMAL';

      // 4. Threshold Alert Generation
      this.evaluateAlerts(sId);
    });

    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Alert Evaluator
  // ---------------------------------------------------------------------------

  private evaluateAlerts(stationId: StationId) {
    const state = this.stationStates[stationId];
    const alerts: SimulationAlert[] = [];
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Weather alert
    if (state.currentAtmospheric.weather_state === 'BLIZZARD' || state.currentAtmospheric.wind_speed >= 32.0) {
      alerts.push({
        alert_id: `alt-${stationId}-blizzard`,
        timestamp: timeStr,
        station_id: stationId,
        severity: 'CRITICAL',
        title: 'EXTREME ENVIRONMENTAL CONDITION',
        description: `Severe blizzard conditions detected. Sustained katabatic wind speed at ${state.currentAtmospheric.wind_speed.toFixed(1)} m/s with zero surface visibility.`,
        source: 'ATMOSPHERIC_SIMULATION',
        status: 'ACTIVE',
      });
    } else if (state.currentAtmospheric.temperature <= -45.0) {
      alerts.push({
        alert_id: `alt-${stationId}-cold`,
        timestamp: timeStr,
        station_id: stationId,
        severity: 'WARNING',
        title: 'POLAR COLD ADVISORY',
        description: `Ambient surface temperature dropped to ${state.currentAtmospheric.temperature.toFixed(1)}°C. Habitation heating demand critical.`,
        source: 'ATMOSPHERIC_SIMULATION',
        status: 'ACTIVE',
      });
    }

    // Machinery alerts
    const g1 = state.assetStates['GEN-01'];
    if (g1.temp >= 95.0) {
      alerts.push({
        alert_id: `alt-${stationId}-g1-temp`,
        timestamp: timeStr,
        station_id: stationId,
        asset_id: 'GEN-01',
        severity: 'CRITICAL',
        title: 'GENERATOR OVERHEAT EXCEEDED',
        description: `GEN-01 jacket core temperature breached critical limit: ${g1.temp.toFixed(1)}°C. Risk of emergency shutdown.`,
        source: 'MACHINERY_SIMULATION',
        status: 'ACTIVE',
      });
    } else if (g1.vib >= 4.8) {
      alerts.push({
        alert_id: `alt-${stationId}-g1-vib`,
        timestamp: timeStr,
        station_id: stationId,
        asset_id: 'GEN-01',
        severity: 'WARNING',
        title: 'HIGH VIBRATION AMPLITUDE',
        description: `GEN-01 bearing vibration trending upward at ${g1.vib.toFixed(1)} mm/s RMS. Harmonic check recommended.`,
        source: 'MACHINERY_SIMULATION',
        status: 'ACTIVE',
      });
    }

    const p1 = state.assetStates['PUMP-01'];
    if (p1.eff <= 70.0) {
      alerts.push({
        alert_id: `alt-${stationId}-p1-cavitation`,
        timestamp: timeStr,
        station_id: stationId,
        asset_id: 'PUMP-01',
        severity: 'WARNING',
        title: 'PUMP EFFICIENCY DEGRADATION',
        description: `PUMP-01 closed-loop glycol delivery efficiency dropped to ${p1.eff.toFixed(1)}%. Cavitation suspected.`,
        source: 'MACHINERY_SIMULATION',
        status: 'ACTIVE',
      });
    }

    const h1 = state.assetStates['HEATER-01'];
    if (h1.status === 'FAILED') {
      alerts.push({
        alert_id: `alt-${stationId}-h1-failed`,
        timestamp: timeStr,
        station_id: stationId,
        asset_id: 'HEATER-01',
        severity: 'CRITICAL',
        title: 'HEATER LIFE-SUPPORT TRIP',
        description: 'HEATER-01 thermal exchange circuit interrupted. Habitation interior temperature trending down.',
        source: 'MACHINERY_SIMULATION',
        status: 'ACTIVE',
      });
    }

    // Communication link alert
    if (this.connectionStatus === 'OFFLINE') {
      alerts.push({
        alert_id: `alt-${stationId}-comm-offline`,
        timestamp: timeStr,
        station_id: stationId,
        severity: 'WARNING',
        title: 'REMOTE LINK OFFLINE',
        description: 'Remote satellite MQTT carrier link unavailable. Station operating in autonomous local simulation mode.',
        source: 'COMMUNICATION',
        status: 'ACTIVE',
      });
    }

    state.alerts = alerts;
  }

  // ---------------------------------------------------------------------------
  // Public Telemetry Provider Methods
  // ---------------------------------------------------------------------------

  public getAtmosphericTelemetry(stationId: StationId): AtmosphericTelemetry {
    return this.stationStates[stationId].currentAtmospheric;
  }

  public getCouplingChainState(stationId: StationId): CouplingChainState {
    return this.stationStates[stationId].coupling;
  }

  public getMachineryTelemetry(stationId: StationId): Record<MachineAssetId, MachineryTelemetryWithBaseline> {
    const s = this.stationStates[stationId];
    const result: Record<MachineAssetId, MachineryTelemetryWithBaseline> = {} as any;

    (Object.keys(s.assetStates) as MachineAssetId[]).forEach((assetId) => {
      const live = s.assetStates[assetId];
      const baseline = PROTOTYPE_MACHINERY_BASELINES[assetId];
      const risk = calculateAssetRisk(baseline, live.temp, live.vib, live.curr, live.eff);

      result[assetId] = {
        asset_id: assetId,
        station_id: stationId,
        name: baseline.name,
        asset_type: baseline.asset_type,
        status: live.status,
        current_temperature: Number(live.temp.toFixed(1)),
        current_vibration: Number(live.vib.toFixed(1)),
        current_current: Number(live.curr.toFixed(1)),
        current_power: Number(live.power.toFixed(1)),
        current_efficiency: Number(live.eff.toFixed(1)),
        current_fuel: Number(live.fuel.toFixed(1)),
        current_fuel_consumption: Number(live.fuel_consumption.toFixed(1)),
        operating_hours: live.hours,
        position:
          assetId === 'GEN-01' ? [-4.2, 1.2, -2.5] :
          assetId === 'GEN-02' ? [-4.2, 1.2, 2.5] :
          assetId === 'BAT-01' ? [3.8, 1.1, -2.2] :
          assetId === 'FUEL-01' ? [-6.5, 0.9, 0.0] :
          assetId === 'PUMP-01' ? [-1.8, 1.0, -3.2] :
          assetId === 'HEATER-01' ? [1.5, 2.8, 1.6] :
          [4.8, 4.5, 3.2],
        baseline,
        deviation: {
          temperature_diff: Number((live.temp - baseline.baseline_temperature).toFixed(1)),
          vibration_diff: Number((live.vib - baseline.baseline_vibration).toFixed(1)),
          current_diff: Number((live.curr - baseline.baseline_current).toFixed(1)),
          power_diff: Number((live.power - baseline.baseline_power).toFixed(1)),
          efficiency_diff: Number((live.eff - baseline.baseline_efficiency).toFixed(1)),
          fuel_consumption_diff: Number((live.fuel_consumption - baseline.baseline_fuel_consumption).toFixed(1)),
        },
        risk,
        last_update: 'Synchronized via local simulation loop',
        data_source: 'Synthetic Machinery Simulation',
        possible_issue: live.issue,
      };
    });

    return result;
  }

  public getAlerts(stationId: StationId): SimulationAlert[] {
    return this.stationStates[stationId].alerts;
  }

  public getTimelineEvents(stationId: StationId): TimelineEvent[] {
    return this.stationStates[stationId].timeline;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public isSimulationActive(): boolean {
    return this.isSimulationActiveFlag;
  }

  // ---------------------------------------------------------------------------
  // Scenario Triggers & Controls
  // ---------------------------------------------------------------------------

  public triggerScenario(scenarioId: ScenarioId, stationId: StationId) {
    const s = this.stationStates[stationId];
    s.activeScenario = scenarioId;
    const def = SIMULATION_SCENARIOS[scenarioId];
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Immediately apply scenario-specific primary physical perturbation so changes are instantaneous
    if (scenarioId === 'EXTREME_COLD') {
      s.currentAtmospheric.temperature = -46.5;
      s.currentAtmospheric.weather_state = 'HEAVY_SNOW';
      s.currentAtmospheric.wind_speed = 19.5;
    } else if (scenarioId === 'BLIZZARD' || scenarioId === 'ANTARCTIC_EXTREME_EVENT') {
      s.currentAtmospheric.temperature = -45.0;
      s.currentAtmospheric.weather_state = 'BLIZZARD';
      s.currentAtmospheric.wind_speed = 38.0;
    } else if (scenarioId === 'HIGH_WIND') {
      s.currentAtmospheric.wind_speed = 28.5;
    } else if (scenarioId === 'GENERATOR_VIBRATION' || scenarioId === 'MULTI_ASSET_DEGRADATION') {
      s.assetStates['GEN-01'].vib = 6.4;
      s.assetStates['GEN-01'].temp = 86.5;
    } else if (scenarioId === 'GENERATOR_OVERHEAT') {
      s.assetStates['GEN-01'].temp = 98.4;
    } else if (scenarioId === 'GENERATOR_OVERLOAD' || scenarioId === 'CASCADING_LOAD_EVENT') {
      s.assetStates['GEN-01'].curr = 97.5;
      s.assetStates['GEN-01'].eff = 72.0;
    } else if (scenarioId === 'PUMP_DEGRADATION') {
      s.assetStates['PUMP-01'].eff = 67.0;
      s.assetStates['PUMP-01'].vib = 5.6;
    } else if (scenarioId === 'HEATER_FAILURE') {
      s.assetStates['HEATER-01'].temp = 7.8;
      s.assetStates['HEATER-01'].eff = 32.0;
      s.assetStates['HEATER-01'].status = 'FAILED';
    } else if (scenarioId === 'BATTERY_LOW') {
      s.assetStates['BAT-01'].fuel = 14.5;
    }

    // Immediately calculate coupling physics
    const tempDelta = Math.max(0, -20.0 - s.currentAtmospheric.temperature);
    const heatingDemand = Math.min(100, 50.0 + tempDelta * 1.5);
    const stationElectricalLoad = Math.min(220, 110.0 + (heatingDemand / 100) * 85.0);
    const gen1LoadPct = Math.min(100, (stationElectricalLoad / 180.0) * 100);
    const fuelRate = 22.0 + (gen1LoadPct / 100) * 16.0;
    const stressIndex = Math.min(100, Math.max(10, (gen1LoadPct - 50) * 1.8 + (tempDelta > 20 ? 25 : 0)));

    s.coupling = {
      outside_temp: s.currentAtmospheric.temperature,
      heating_demand_pct: Number(heatingDemand.toFixed(1)),
      station_electrical_load_kw: Number(stationElectricalLoad.toFixed(1)),
      generator_load_pct: Number(gen1LoadPct.toFixed(1)),
      total_fuel_consumption_rate: Number(fuelRate.toFixed(1)),
      machinery_stress_index: Number(stressIndex.toFixed(1)),
      overall_risk_score: Math.round(stressIndex * 0.8),
      active_coupling_text:
        tempDelta > 25
          ? 'CRITICAL COUPLING: Severe polar cold is demanding 90%+ heating, driving GEN-01 near maximum continuous capacity.'
          : tempDelta > 12
          ? 'ELEVATED COUPLING: Low temperatures driving heating demand above nominal baseline.'
          : 'NOMINAL COUPLING: Balanced load-thermal equilibrium.',
    };

    // Evaluate alerts immediately
    this.evaluateAlerts(stationId);

    // Add scenario trigger to timeline
    s.timeline.unshift({
      event_id: `evt-${Date.now()}`,
      timestamp: timeStr,
      station_id: stationId,
      category: 'SCENARIO',
      title: `Scenario Triggered: ${def.name}`,
      description: def.description,
      severity: def.category === 'combined' ? 'CRITICAL' : 'WARNING',
    });

    // Add explanatory secondary chain event
    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (scenarioId === 'EXTREME_COLD') {
        s.timeline.unshift({
          event_id: `evt-chain-${Date.now()}`,
          timestamp: nowStr,
          station_id: stationId,
          category: 'ATMOSPHERIC',
          title: 'Physical Coupling Cascade Active',
          description: 'Surface ambient temperature dropped past -45°C. Habitation heating demand rose to 92%. Generator 01 load increased to 162 kW.',
        });
      } else if (scenarioId === 'GENERATOR_VIBRATION') {
        s.timeline.unshift({
          event_id: `evt-chain-${Date.now()}`,
          timestamp: nowStr,
          station_id: stationId,
          asset_id: 'GEN-01',
          category: 'MACHINERY',
          title: 'GEN-01 Vibration Threshold Breached',
          description: 'Radial harmonic sensor recorded 6.4 mm/s RMS (critical threshold 6.5 mm/s). Risk score escalated to HIGH (68).',
        });
      }
      this.notify();
    }, 1200);

    // Keep max 40 timeline events
    if (s.timeline.length > 40) s.timeline = s.timeline.slice(0, 40);

    this.notify();
  }

  public resetSimulation(stationId?: StationId) {
    const targets: StationId[] = stationId ? [stationId] : ['maitri', 'bharati'];
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    targets.forEach((sId) => {
      this.stationStates[sId] = this.createInitialStationState(sId);
      this.stationStates[sId].timeline.unshift({
        event_id: `evt-reset-${Date.now()}`,
        timestamp: timeStr,
        station_id: sId,
        category: 'SYSTEM',
        title: 'Simulation Reset Executed',
        description: 'Atmospheric state, machinery baselines, risk models, and active scenarios restored to nominal operating state.',
      });
    });

    this.connectionStatus = 'ONLINE';
    this.notify();
  }

  public toggleRemoteLinkOffline(offline: boolean) {
    this.connectionStatus = offline ? 'OFFLINE' : 'ONLINE';
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    Object.values(this.stationStates).forEach((s) => {
      s.timeline.unshift({
        event_id: `evt-link-${Date.now()}`,
        timestamp: timeStr,
        station_id: s.currentAtmospheric.station_id,
        category: 'SYSTEM',
        title: offline ? 'Remote Link Switched to OFFLINE' : 'Remote Link Switched to ONLINE',
        description: offline
          ? 'Remote satellite carrier link marked OFFLINE. Local autonomous simulation provider servicing all dashboards.'
          : 'Remote link restored to active status.',
        severity: offline ? 'WARNING' : 'INFO',
      });
    });

    this.notify();
  }

  public acknowledgeAlert(alertId: string) {
    Object.values(this.stationStates).forEach((s) => {
      const a = s.alerts.find((alt) => alt.alert_id === alertId);
      if (a) {
        a.status = 'ACKNOWLEDGED';
        a.acknowledged_at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    });
    this.notify();
  }
}

// Global Singleton Provider Instance
export const simulationEngine = new SimulationEngine();
