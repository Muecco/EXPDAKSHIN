/**
 * DAKSHIN — SIMULATION CONTEXT & REACT PROVIDER
 *
 * Exposes real-time reactive telemetry from the central simulation engine
 * to all frontend components:
 * - Current Atmospheric Telemetry (historical-data-driven)
 * - Synthetic Machinery Telemetry (prototype baseline comparisons)
 * - Environment -> Machinery Physical Coupling State
 * - Active Threshold-generated Alerts
 * - Event Timeline Feed
 * - Deterministic Scenario Triggers & Guided Demo Runner
 * - Mode & Provenance Labels
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ConnectionStatus, StationId } from '../types';
import type { MachineAssetId } from '../types/digitalTwin';
import { useStation } from './StationContext';
import { simulationEngine, SIMULATION_SCENARIOS } from '../services/telemetry/simulationEngine';
import { getAtmosphericHistory } from '../services/telemetry/atmosphericHistoryData';
import type {
  AtmosphericDataPoint,
  AtmosphericTelemetry,
  CouplingChainState,
  MachineryTelemetryWithBaseline,
  ScenarioId,
  SimulationAlert,
  SimulationScenarioDefinition,
  TimeRangeFilter,
  TimelineEvent,
} from '../services/telemetry/telemetryContracts';

interface SimulationContextType {
  isSimulationMode: boolean;
  simulationModeLabel: string;
  provenanceLabel: string;
  connectionStatus: ConnectionStatus;
  isRemoteLinkOffline: boolean;
  currentAtmospheric: AtmosphericTelemetry;
  couplingState: CouplingChainState;
  machineryAssets: Record<MachineAssetId, MachineryTelemetryWithBaseline>;
  stationHealthPct: number;
  alerts: SimulationAlert[];
  activeAlertCount: number;
  timeline: TimelineEvent[];
  activeScenario: ScenarioId | null;
  activeScenarioDef: SimulationScenarioDefinition | null;
  availableScenarios: SimulationScenarioDefinition[];
  triggerScenario: (scenarioId: ScenarioId) => void;
  resetSimulation: () => void;
  toggleRemoteLink: (offline: boolean) => void;
  acknowledgeAlert: (alertId: string) => void;
  fetchAtmosphericHistory: (range: TimeRangeFilter, start?: string, end?: string, stationId?: StationId) => AtmosphericDataPoint[];
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedStationId, selectedStation } = useStation();
  const activeStationId = selectedStation?.id || selectedStationId || 'bharati';

  // Tick state triggers reactive re-renders when engine updates
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const currentAtmospheric = simulationEngine.getAtmosphericTelemetry(activeStationId);
  const couplingState = simulationEngine.getCouplingChainState(activeStationId);
  const machineryAssets = simulationEngine.getMachineryTelemetry(activeStationId);
  const alerts = simulationEngine.getAlerts(activeStationId);
  const timeline = simulationEngine.getTimelineEvents(activeStationId);
  const connectionStatus = simulationEngine.getConnectionStatus();

  // Overall station health derived from asset risks
  const stationHealthPct = useMemo(() => {
    const assets = Object.values(machineryAssets);
    if (assets.length === 0) return 92;
    const avgRisk = assets.reduce((s, a) => s + a.risk.score, 0) / assets.length;
    return Math.max(20, Math.min(100, Math.round(100 - avgRisk * 0.75)));
  }, [machineryAssets]);

  const activeScenario = ((simulationEngine as any).stationStates?.[activeStationId]?.activeScenario as ScenarioId) || null;
  const activeScenarioDef = activeScenario ? SIMULATION_SCENARIOS[activeScenario] || null : null;
  const availableScenarios = useMemo(() => Object.values(SIMULATION_SCENARIOS), []);

  const triggerScenario = useCallback(
    (scenarioId: ScenarioId) => {
      simulationEngine.triggerScenario(scenarioId, activeStationId);
    },
    [activeStationId]
  );

  const resetSimulation = useCallback(() => {
    simulationEngine.resetSimulation(activeStationId);
  }, [activeStationId]);

  const toggleRemoteLink = useCallback((offline: boolean) => {
    simulationEngine.toggleRemoteLinkOffline(offline);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    simulationEngine.acknowledgeAlert(alertId);
  }, []);

  const fetchAtmosphericHistory = useCallback(
    (range: TimeRangeFilter, start?: string, end?: string, stationId?: StationId) => {
      const targetStation = stationId || activeStationId;
      return getAtmosphericHistory(targetStation, range, start, end);
    },
    [activeStationId]
  );

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <SimulationContext.Provider
      value={{
        isSimulationMode: true,
        simulationModeLabel: 'SIMULATION MODE // Synthetic & Historical-Data-Driven',
        provenanceLabel: 'Historical-data-driven simulation',
        connectionStatus,
        isRemoteLinkOffline: connectionStatus === 'OFFLINE',
        currentAtmospheric,
        couplingState,
        machineryAssets,
        stationHealthPct,
        alerts,
        activeAlertCount,
        timeline,
        activeScenario,
        activeScenarioDef,
        availableScenarios,
        triggerScenario,
        resetSimulation,
        toggleRemoteLink,
        acknowledgeAlert,
        fetchAtmosphericHistory,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = (): SimulationContextType => {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return ctx;
};
