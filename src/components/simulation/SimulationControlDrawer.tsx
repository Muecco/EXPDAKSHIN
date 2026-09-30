import React, { useState, useEffect, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import {
  Sliders,
  X,
  Play,
  RotateCcw,
  CloudSnow,
  Cog,
  Zap,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { ScenarioId } from '../../services/telemetry/telemetryContracts';

// 20-Step Guided Demo sequence definition
interface DemoStep {
  step: number;
  title: string;
  category: 'OVERVIEW' | 'ATMOSPHERE' | 'MACHINERY' | 'COUPLING' | 'ANOMALY' | 'ANALYTICS' | 'COMPLETION';
  description: string;
  suggestedScenario?: ScenarioId;
  suggestedRoute?: string;
  actionText?: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'Control Center Overview & Nominal Baselines',
    category: 'OVERVIEW',
    description: 'Welcome to DAKSHIN. The station begins in nominal baseline mode with calibrated physics for Antarctic environmental conditions.',
    suggestedScenario: 'NORMAL_WEATHER',
    suggestedRoute: '/overview',
  },
  {
    step: 2,
    title: 'Station Architecture: Maitri vs. Bharati',
    category: 'OVERVIEW',
    description: 'Explore the two primary Indian research stations: Maitri (Schirmacher Oasis, inland rock stilt) and Bharati (Larsemann Hills, coastal modular stilt).',
    suggestedRoute: '/stations',
  },
  {
    step: 3,
    title: 'Baseline vs. Synthetic Deviation Architecture',
    category: 'MACHINERY',
    description: 'Inspect machinery baselines calibrated for sub-zero operation. Notice parameters report current vs baseline (Δ deviation) with zero guesswork.',
    suggestedRoute: '/machinery',
  },
  {
    step: 4,
    title: 'Atmospheric Telemetry Ingestion',
    category: 'ATMOSPHERE',
    description: 'Current ambient conditions are driven by authentic IMD Antarctic meteorological records, including ambient temperature, wind vectors, and surface pressure.',
    suggestedRoute: '/overview',
  },
  {
    step: 5,
    title: 'Station Physical Coupling Chain',
    category: 'COUPLING',
    description: 'Antarctic thermodynamics dictate that as ambient temperature drops, heating demand spikes, driving electrical load on diesel generators and accelerating fuel burn.',
    suggestedRoute: '/overview',
  },
  {
    step: 6,
    title: 'Injecting Extreme Cold Snap (-52.4°C)',
    category: 'ANOMALY',
    description: 'Triggering an extreme polar vortex plunge down to -52.4°C to observe the thermodynamic chain reaction across heating loops.',
    suggestedScenario: 'EXTREME_COLD',
    suggestedRoute: '/overview',
    actionText: 'Trigger Extreme Cold',
  },
  {
    step: 7,
    title: 'Observing Dynamic Heating Demand Surge',
    category: 'COUPLING',
    description: 'Watch the station electrical load climb from 145 kW to >210 kW as thermal life-support exchangers compensate for the -52°C polar freeze.',
    suggestedRoute: '/overview',
  },
  {
    step: 8,
    title: '3D Digital Twin Visual Thermal Response',
    category: 'MACHINERY',
    description: 'Navigate to the 3D Digital Twin. Observe how 3D machinery meshes react dynamically without reloading the WebGL scene.',
    suggestedRoute: '/digital-twin',
  },
  {
    step: 9,
    title: 'Machinery Anomaly: Generator Vibration Spike',
    category: 'ANOMALY',
    description: 'Simulate mechanical eccentricity on GEN-01 main bearing. Vibration climbs from 1.8 mm/s baseline to 6.2 mm/s RMS (CRITICAL threshold).',
    suggestedScenario: 'GENERATOR_VIBRATION',
    suggestedRoute: '/machinery',
    actionText: 'Inject Vibration Anomaly',
  },
  {
    step: 10,
    title: 'Explainable Failure Risk Engine',
    category: 'MACHINERY',
    description: 'Inspect the 4-factor explainable risk model: 30% thermal excess, 30% vibration delta, 20% electrical current surge, and 20% efficiency deficit.',
    suggestedRoute: '/machinery',
  },
  {
    step: 11,
    title: 'Station Incident Center & Alert Triage',
    category: 'ANOMALY',
    description: 'Open the Alerts Center. Review the automatically generated threshold alerts, source attribution, and emergency SOP protocols.',
    suggestedRoute: '/alerts',
  },
  {
    step: 12,
    title: 'Actionable Antarctic Emergency SOPs',
    category: 'ANOMALY',
    description: 'Review SOP-VIB-01 for crankshaft coupling inspection, oil lubrication checks, and auxiliary generator standby procedures.',
    suggestedRoute: '/alerts',
  },
  {
    step: 13,
    title: 'Operator Acknowledgment Flow',
    category: 'ANOMALY',
    description: 'Acknowledge the active alert to verify operator response workflow. Notice the event logs immediately into the chronological timeline.',
    suggestedRoute: '/alerts',
  },
  {
    step: 14,
    title: 'Historical 90-Day Atmospheric Analytics',
    category: 'ANALYTICS',
    description: 'Switch to Analytics. Explore authentic 90-day time series data across Temperature, Wind Speed, Pressure, and Humidity.',
    suggestedRoute: '/analytics',
  },
  {
    step: 15,
    title: 'Multi-Resolution Downsampling (24H to 3M)',
    category: 'ANALYTICS',
    description: 'Toggle between 24 Hours, 7 Days, 1 Month, and 3 Months. Notice instant SVG chart rendering with zero browser latency.',
    suggestedRoute: '/analytics',
  },
  {
    step: 16,
    title: 'Scenario: Catastrophic Antarctic Blizzard',
    category: 'ANOMALY',
    description: 'Trigger a sustained 38.0 m/s blizzard. Notice the 3D weather snowfall density increase and atmospheric risk level peak.',
    suggestedScenario: 'BLIZZARD',
    suggestedRoute: '/digital-twin',
    actionText: 'Trigger Blizzard',
  },
  {
    step: 17,
    title: 'Combined Multi-Asset Degradation',
    category: 'ANOMALY',
    description: 'Simulate a cascading blackout hazard: vibration on GEN-01, thermal loss on HEATER-01, and low BESS battery reserve.',
    suggestedScenario: 'MULTI_ASSET_DEGRADATION',
    suggestedRoute: '/overview',
    actionText: 'Trigger Compound Stress',
  },
  {
    step: 18,
    title: 'Remote Link Status Toggle (PC1 Handoff)',
    category: 'OVERVIEW',
    description: 'Toggle between LOCAL SIMULATION ACTIVE and REMOTE LINK OFFLINE to demonstrate fail-safe resilience pending physical PC1 MQTT activation.',
    suggestedRoute: '/overview',
  },
  {
    step: 19,
    title: 'Event Timeline Audit Stream',
    category: 'OVERVIEW',
    description: 'Audit the chronologically ordered event stream to trace every scenario injected, threshold crossed, and operator interaction.',
    suggestedRoute: '/alerts',
  },
  {
    step: 20,
    title: 'Return to Calibrated Nominal Baseline',
    category: 'COMPLETION',
    description: 'Reset the simulation to restore all 7 machinery assets and atmospheric variables back to clean nominal operating baselines.',
    suggestedScenario: 'NORMAL_WEATHER',
    suggestedRoute: '/overview',
    actionText: 'Reset Simulation',
  },
];

export const SimulationControlDrawer: React.FC = () => {
  const {
    isRemoteLinkOffline,
    activeScenario,
    activeScenarioDef,
    availableScenarios,
    triggerScenario,
    resetSimulation,
    toggleRemoteLink,
    timeline,
    activeAlertCount,
  } = useSimulation();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'DEMO' | 'LINK' | 'LOGS'>('SCENARIOS');
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Filter scenario groups
  const atmosphericScenarios = useMemo(
    () => availableScenarios.filter((s) => s.category === 'atmospheric'),
    [availableScenarios]
  );
  const machineryScenarios = useMemo(
    () => availableScenarios.filter((s) => s.category === 'machinery'),
    [availableScenarios]
  );
  const combinedScenarios = useMemo(
    () => availableScenarios.filter((s) => s.category === 'combined'),
    [availableScenarios]
  );

  const currentDemoStep = DEMO_STEPS[demoStepIndex];

  // Auto-play timer for guided demo
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setDemoStepIndex((prev) => {
        if (prev >= DEMO_STEPS.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Execute demo action if requested
  const handleExecuteDemoStep = (step: DemoStep) => {
    if (step.suggestedScenario) {
      if (step.suggestedScenario === 'NORMAL_WEATHER' && step.step === 20) {
        resetSimulation();
      } else {
        triggerScenario(step.suggestedScenario);
      }
    }
  };

  return (
    <>
      {/* Floating Simulation Trigger Button (Bottom Right) */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.65rem 1.1rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgba(0, 78, 100, 0.95), rgba(10, 25, 40, 0.95))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            boxShadow: '0 4px 24px rgba(0, 229, 255, 0.25), 0 0 12px rgba(0, 78, 100, 0.5)',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 229, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 229, 255, 0.25)';
          }}
        >
          <Sliders size={16} color="#00e5ff" />
          <span>SIMULATION LAB</span>

          {/* Active Scenario Badge */}
          {activeScenario ? (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: 'rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.5)',
              }}
            >
              {activeScenarioDef?.badge_label || activeScenario}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              NOMINAL
            </span>
          )}

          {activeAlertCount > 0 && (
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeAlertCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-out Simulation Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(2, 6, 23, 0.65)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Drawer Body */}
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(8, 22, 36, 0.98), rgba(4, 14, 24, 0.98))',
              borderLeft: '1px solid rgba(0, 229, 255, 0.3)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(10, 25, 40, 0.8)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sliders size={18} color="#00e5ff" />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
                    DAKSHIN SIMULATION LAB
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Local Synthetic Telemetry & Deterministic Scenario Orchestration
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => resetSimulation()}
                  title="Reset all scenarios to nominal baselines"
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    background: 'rgba(0, 229, 255, 0.1)',
                    color: '#00e5ff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub-header Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(10, 25, 40, 0.5)',
              }}
            >
              {[
                { id: 'SCENARIOS', label: 'Scenarios' },
                { id: 'DEMO', label: '20-Step Demo' },
                { id: 'LINK', label: 'Remote Link' },
                { id: 'LOGS', label: `Event Log (${timeline.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #00e5ff' : '2px solid transparent',
                    background: activeTab === tab.id ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                    color: activeTab === tab.id ? '#00e5ff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* TAB 1: SCENARIOS */}
              {activeTab === 'SCENARIOS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Atmospheric Scenarios */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <CloudSnow size={16} color="#00e5ff" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Atmospheric Scenarios
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {atmosphericScenarios.map((sc) => {
                        const isActive = activeScenario === sc.id;
                        return (
                          <div
                            key={sc.id}
                            style={{
                              background: isActive ? 'rgba(0, 78, 100, 0.5)' : 'rgba(15, 30, 48, 0.6)',
                              border: `1px solid ${isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                                  {sc.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '3px',
                                    background: 'rgba(0, 229, 255, 0.1)',
                                    color: '#00e5ff',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {sc.badge_label}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                {sc.description}
                              </div>
                            </div>
                            <button
                              onClick={() => (isActive ? resetSimulation() : triggerScenario(sc.id))}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)',
                                color: isActive ? '#0a192f' : '#e2e8f0',
                                minWidth: '70px',
                              }}
                            >
                              {isActive ? 'Active' : 'Trigger'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Machinery Scenarios */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Cog size={16} color="#38bdf8" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Machinery Scenarios
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {machineryScenarios.map((sc) => {
                        const isActive = activeScenario === sc.id;
                        return (
                          <div
                            key={sc.id}
                            style={{
                              background: isActive ? 'rgba(0, 78, 100, 0.5)' : 'rgba(15, 30, 48, 0.6)',
                              border: `1px solid ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                                  {sc.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '3px',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    color: '#38bdf8',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {sc.badge_label}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                {sc.description}
                              </div>
                            </div>
                            <button
                              onClick={() => (isActive ? resetSimulation() : triggerScenario(sc.id))}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                                color: isActive ? '#0a192f' : '#e2e8f0',
                                minWidth: '70px',
                              }}
                            >
                              {isActive ? 'Active' : 'Trigger'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Combined Scenarios */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Zap size={16} color="#f59e0b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Combined & Cascading Domino Scenarios
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {combinedScenarios.map((sc) => {
                        const isActive = activeScenario === sc.id;
                        return (
                          <div
                            key={sc.id}
                            style={{
                              background: isActive ? 'rgba(120, 53, 15, 0.4)' : 'rgba(15, 30, 48, 0.6)',
                              border: `1px solid ${isActive ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: '8px',
                              padding: '0.75rem 1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                                  {sc.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '3px',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#f59e0b',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {sc.badge_label}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                {sc.description}
                              </div>
                            </div>
                            <button
                              onClick={() => (isActive ? resetSimulation() : triggerScenario(sc.id))}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                background: isActive ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                                color: isActive ? '#0a192f' : '#e2e8f0',
                                minWidth: '70px',
                              }}
                            >
                              {isActive ? 'Active' : 'Trigger'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 20-STEP GUIDED DEMO */}
              {activeTab === 'DEMO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Progress Header */}
                  <div
                    style={{
                      background: 'rgba(10, 25, 40, 0.75)',
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#00e5ff', fontWeight: 700, textTransform: 'uppercase' }}>
                        Step {currentDemoStep.step} of {DEMO_STEPS.length}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#94a3b8',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                        }}
                      >
                        {currentDemoStep.category}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          width: `${((demoStepIndex + 1) / DEMO_STEPS.length) * 100}%`,
                          height: '100%',
                          background: '#00e5ff',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      {currentDemoStep.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {currentDemoStep.description}
                    </div>

                    {/* Step Action Button */}
                    {currentDemoStep.suggestedScenario && (
                      <div style={{ marginTop: '1rem' }}>
                        <button
                          onClick={() => handleExecuteDemoStep(currentDemoStep)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#00e5ff',
                            color: '#0a192f',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Play size={12} fill="#0a192f" />
                          {currentDemoStep.actionText || `Activate Scenario: ${currentDemoStep.suggestedScenario}`}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigation Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <button
                      disabled={demoStepIndex === 0}
                      onClick={() => setDemoStepIndex((p) => Math.max(0, p - 1))}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: demoStepIndex === 0 ? '#475569' : '#cbd5e1',
                        cursor: demoStepIndex === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <ChevronLeft size={14} />
                      Previous Step
                    </button>

                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(0, 229, 255, 0.3)',
                        background: isAutoPlaying ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 229, 255, 0.08)',
                        color: '#00e5ff',
                        cursor: 'pointer',
                      }}
                    >
                      {isAutoPlaying ? 'Pause Auto' : 'Auto Play (7s)'}
                    </button>

                    <button
                      disabled={demoStepIndex === DEMO_STEPS.length - 1}
                      onClick={() => setDemoStepIndex((p) => Math.min(DEMO_STEPS.length - 1, p + 1))}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: demoStepIndex === DEMO_STEPS.length - 1 ? '#475569' : '#cbd5e1',
                        cursor: demoStepIndex === DEMO_STEPS.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      Next Step
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Step Index Quick Jump List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      All Demo Steps:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {DEMO_STEPS.map((s, idx) => (
                        <button
                          key={s.step}
                          onClick={() => setDemoStepIndex(idx)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: idx === demoStepIndex ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)',
                            background: idx === demoStepIndex ? '#00e5ff' : 'rgba(255, 255, 255, 0.04)',
                            color: idx === demoStepIndex ? '#0a192f' : '#94a3b8',
                            cursor: 'pointer',
                          }}
                        >
                          {s.step}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REMOTE LINK SIMULATOR */}
              {activeTab === 'LINK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      background: 'rgba(10, 25, 40, 0.75)',
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        Physical Link Simulation State
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: isRemoteLinkOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isRemoteLinkOffline ? '#fca5a5' : '#6ee7b7',
                          border: `1px solid ${isRemoteLinkOffline ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        }}
                      >
                        {isRemoteLinkOffline ? 'REMOTE LINK OFFLINE' : 'READY FOR PC1 HANDOFF'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      The current mode operates as a decoupled <strong>Local Synthetic Simulation</strong>. Because the physical PC1 ↔ PC2 MQTT network link is temporarily unavailable, DAKSHIN feeds synthetic telemetry matching the exact schema contract that the real backend will ingest.
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => toggleRemoteLink(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: !isRemoteLinkOffline ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                          color: !isRemoteLinkOffline ? '#fff' : '#94a3b8',
                        }}
                      >
                        Active Simulation
                      </button>
                      <button
                        onClick={() => toggleRemoteLink(true)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: isRemoteLinkOffline ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                          color: isRemoteLinkOffline ? '#fff' : '#94a3b8',
                        }}
                      >
                        Simulate Link Offline
                      </button>
                    </div>
                  </div>

                  {/* Architectural Provenance Notice */}
                  <div
                    style={{
                      background: 'rgba(15, 30, 48, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      lineHeight: '1.45',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}>
                      Data Provenance & Contract Guarantee:
                    </div>
                    • Atmospheric data points derive from calibrated IMD Antarctic meteorological records.
                    <br />
                    • Machinery baselines represent prototype engineering thresholds calibrated for polar diesels.
                    <br />
                    • When PC1 connection is restored, the <code>ITelemetryProvider</code> interface will switch from <code>SimulationEngine</code> to <code>MqttWebSocketProvider</code> with zero changes to any UI components.
                  </div>
                </div>
              )}

              {/* TAB 4: EVENT LOGS */}
              {activeTab === 'LOGS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Latest chronological engine events:
                    </span>
                    <button
                      onClick={() => resetSimulation()}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      Clear / Reset
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {timeline.slice(0, 30).map((ev) => (
                      <div
                        key={ev.event_id}
                        style={{
                          background: 'rgba(15, 30, 48, 0.6)',
                          borderLeft: `2px solid ${ev.severity === 'CRITICAL' ? '#ef4444' : ev.severity === 'WARNING' ? '#f59e0b' : '#00e5ff'}`,
                          borderRadius: '0 6px 6px 0',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.72rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{ev.title}</span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {new Date(ev.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>{ev.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
