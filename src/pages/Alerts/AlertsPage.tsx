import React, { useState, useMemo } from 'react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import {
  TriangleAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';
import type { AlertSeverity } from '../../services/telemetry/telemetryContracts';
import type { MachineAssetId } from '../../types/digitalTwin';

export const AlertsPage: React.FC = () => {
  const { selectedStation } = useStation();
  const {
    alerts,
    activeAlertCount,
    timeline,
    acknowledgeAlert,
    triggerScenario,
    resetSimulation,
    isRemoteLinkOffline,
    stationHealthPct,
  } = useSimulation();

  // Filters
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED'>('ALL');
  const [assetFilter, setAssetFilter] = useState<'ALL' | MachineAssetId>('ALL');

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
      if (assetFilter !== 'ALL' && alert.asset_id !== assetFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter, assetFilter]);

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length,
    [alerts]
  );
  const warningCount = useMemo(
    () => alerts.filter((a) => a.severity === 'WARNING' && a.status === 'ACTIVE').length,
    [alerts]
  );
  const infoCount = useMemo(
    () => alerts.filter((a) => a.severity === 'INFO' && a.status === 'ACTIVE').length,
    [alerts]
  );

  // Recommended SOP lookup for realistic Antarctic operations guidance
  const getSopRecommendation = (alertTitle: string, _assetId?: string): string => {
    if (alertTitle.includes('Vibration')) {
      return 'SOP-VIB-01: Dispatch engineer to inspect main crankshaft coupling and bearing alignment. Check oil lubrication viscosity.';
    }
    if (alertTitle.includes('Overheat') || alertTitle.includes('High Temp')) {
      return 'SOP-COOL-03: Switch to secondary radiator loop. Verify glycol circuit pressure and clean air intake frost buildup.';
    }
    if (alertTitle.includes('Overload') || alertTitle.includes('Current')) {
      return 'SOP-ELEC-02: Shed secondary scientific lab loads. Verify bus synchronization and start auxiliary unit if needed.';
    }
    if (alertTitle.includes('Blizzard') || alertTitle.includes('Katabatic')) {
      return 'SOP-ENV-01: Station-wide Lockout. Seal ventilation louvers, engage heating priority, and restrict all outdoor movement.';
    }
    if (alertTitle.includes('Cold')) {
      return 'SOP-ENV-04: Activate trace heating on fuel lines. Verify fuel tank anti-gel additive concentration.';
    }
    if (alertTitle.includes('Pump') || alertTitle.includes('Efficiency')) {
      return 'SOP-PUMP-02: Check for glycol cavitation or pipeline vapor lock. Purge entrained air and inspect impeller seals.';
    }
    if (alertTitle.includes('Battery') || alertTitle.includes('SOC')) {
      return 'SOP-BESS-01: Disconnect non-critical DC buses. Initiate trickle-charge cycle from primary diesel generator.';
    }
    return 'SOP-GEN-01: Monitor parameter trend on high-frequency telemetry. Log entry in Station Shift Log.';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Top Banner & KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Active Incidents Card */}
        <div
          style={{
            background: 'rgba(10, 25, 40, 0.75)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${criticalCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 229, 255, 0.2)'}`,
            borderRadius: '10px',
            padding: '1.25rem',
            boxShadow: criticalCount > 0 ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active Incidents
            </span>
            <TriangleAlert size={16} color={criticalCount > 0 ? '#ef4444' : '#00e5ff'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
              {activeAlertCount}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>total unaddressed</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              {criticalCount} Critical
            </span>
            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              {warningCount} Warning
            </span>
            <span style={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff' }} />
              {infoCount} Info
            </span>
          </div>
        </div>

        {/* Station Health Index */}
        <div
          style={{
            background: 'rgba(10, 25, 40, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '10px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Station Operational Index
            </span>
            <ShieldCheck size={16} color={stationHealthPct > 80 ? '#10b981' : '#f59e0b'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
              {stationHealthPct}%
            </span>
            <span style={{ fontSize: '0.8rem', color: stationHealthPct > 80 ? '#10b981' : '#f59e0b' }}>
              {stationHealthPct > 80 ? 'NOMINAL' : 'DEGRADED'}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '3px',
              marginTop: '0.85rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${stationHealthPct}%`,
                height: '100%',
                background: stationHealthPct > 80 ? '#10b981' : stationHealthPct > 50 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Telemetry Ingestion Mode */}
        <div
          style={{
            background: 'rgba(10, 25, 40, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '10px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Telemetry Link Status
            </span>
            <Activity size={16} color="#00e5ff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isRemoteLinkOffline ? '#ef4444' : '#10b981',
                boxShadow: isRemoteLinkOffline ? '0 0 8px #ef4444' : '0 0 8px #10b981',
              }}
            />
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              LOCAL SIMULATION ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {isRemoteLinkOffline ? 'REMOTE LINK OFFLINE (PC1 Unreachable)' : 'READY FOR REMOTE HANDOFF'}
          </div>
        </div>

        {/* Active Station Scope */}
        <div
          style={{
            background: 'rgba(10, 25, 40, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '10px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Station Monitored
            </span>
            <Layers size={16} color="#00e5ff" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00e5ff', textTransform: 'uppercase' }}>
            {selectedStation?.name || 'Maitri'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            {selectedStation?.coordinates ? `${selectedStation.coordinates.lat}, ${selectedStation.coordinates.long}` : '70°45′57″S 11°44′09″E'}
          </div>
        </div>
      </div>

      {/* Main Alert List & Timeline Split Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              background: 'rgba(10, 25, 40, 0.6)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(0, 229, 255, 0.15)',
            }}
          >
            {/* Severity Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background:
                      severityFilter === sev
                        ? sev === 'CRITICAL'
                          ? '#ef4444'
                          : sev === 'WARNING'
                          ? '#f59e0b'
                          : '#004E64'
                        : 'rgba(255, 255, 255, 0.05)',
                    color: severityFilter === sev ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['ALL', 'ACTIVE', 'ACKNOWLEDGED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    background: statusFilter === st ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                    color: statusFilter === st ? '#00e5ff' : '#94a3b8',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Asset Filter Dropdown */}
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value as any)}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 30, 48, 0.9)',
                color: '#00e5ff',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Assets</option>
              <option value="GEN-01">GEN-01 (Diesel 1)</option>
              <option value="GEN-02">GEN-02 (Diesel 2)</option>
              <option value="FUEL-01">FUEL-01 (Day Tank)</option>
              <option value="PUMP-01">PUMP-01 (Glycol Loop)</option>
              <option value="HEATER-01">HEATER-01 (Life Exchanger)</option>
              <option value="BAT-01">BAT-01 (BESS Bank)</option>
              <option value="ENV-01">ENV-01 (Weather Array)</option>
            </select>

            {/* Quick Scenario Injector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => triggerScenario('GENERATOR_VIBRATION')}
                title="Inject synthetic generator vibration anomaly"
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} />
                + Vib Anomaly
              </button>
              <button
                onClick={() => resetSimulation()}
                title="Clear all anomalies and reset baselines"
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
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
                <RefreshCw size={12} />
                Reset
              </button>
            </div>
          </div>

          {/* Alert Cards */}
          {filteredAlerts.length === 0 ? (
            <div
              style={{
                background: 'rgba(10, 25, 40, 0.5)',
                border: '1px dashed rgba(0, 229, 255, 0.2)',
                borderRadius: '8px',
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <CheckCircle2 size={42} color="#10b981" />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                  All Monitored Parameters Nominal
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem', maxWidth: '400px' }}>
                  No active incidents match the current filters. Machinery baselines and atmospheric telemetry are within design envelope.
                </div>
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              const borderColor = isCrit
                ? 'rgba(239, 68, 68, 0.4)'
                : isWarn
                ? 'rgba(245, 158, 11, 0.4)'
                : 'rgba(0, 229, 255, 0.3)';
              const headerBg = isCrit
                ? 'rgba(239, 68, 68, 0.12)'
                : isWarn
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(0, 229, 255, 0.08)';

              return (
                <div
                  key={alert.alert_id}
                  style={{
                    background: 'rgba(10, 25, 40, 0.75)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Alert Header */}
                  <div
                    style={{
                      background: headerBg,
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          background: isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#004E64',
                          color: '#ffffff',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {alert.title}
                      </span>
                      {alert.asset_id && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#38bdf8',
                          }}
                        >
                          {alert.asset_id}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      {alert.status === 'ACTIVE' ? (
                        <button
                          onClick={() => acknowledgeAlert(alert.alert_id)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            border: '1px solid rgba(0, 229, 255, 0.3)',
                            background: 'rgba(0, 229, 255, 0.15)',
                            color: '#00e5ff',
                            cursor: 'pointer',
                          }}
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alert Body */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {alert.description}
                    </div>

                    {/* Standard Operating Procedure recommendation */}
                    <div
                      style={{
                        background: 'rgba(15, 30, 48, 0.8)',
                        borderLeft: `3px solid ${isCrit ? '#ef4444' : '#00e5ff'}`,
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0 4px 4px 0',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                      }}
                    >
                      <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.25rem' }}>
                        Antarctic Emergency SOP Protocol:
                      </strong>
                      {getSopRecommendation(alert.title, alert.asset_id)}
                    </div>

                    {/* Meta info footer */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                        color: '#64748b',
                        paddingTop: '0.35rem',
                      }}
                    >
                      <span>Alert Source: <strong style={{ color: '#94a3b8' }}>{alert.source}</strong></span>
                      <span>ID: <code style={{ color: '#94a3b8' }}>{alert.alert_id}</code></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Real-Time Event Timeline */}
        <div
          style={{
            background: 'rgba(10, 25, 40, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: 'fit-content',
            maxHeight: '850px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="#00e5ff" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                Event Timeline Feed
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                color: '#64748b',
                fontFamily: 'monospace',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              {timeline.length} events logged
            </span>
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              lineHeight: '1.4',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '0.5rem',
            }}
          >
            Chronological audit log recording simulation ticks, scenario activations, threshold excursions, and operator acknowledgments.
          </div>

          {/* Timeline Stream */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              overflowY: 'auto',
              maxHeight: '650px',
              paddingRight: '0.5rem',
            }}
          >
            {timeline.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
                No events recorded yet. Trigger a scenario or await telemetry ticks.
              </div>
            ) : (
              timeline.slice(0, 40).map((event) => {
                const isCrit = event.severity === 'CRITICAL';
                const isWarn = event.severity === 'WARNING';
                const bulletColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#00e5ff';

                return (
                  <div
                    key={event.event_id}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      background: 'rgba(15, 30, 48, 0.5)',
                      borderLeft: `2px solid ${bulletColor}`,
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: '55px', color: '#64748b', fontFamily: 'monospace' }}>
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{event.title}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: '#94a3b8',
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                          }}
                        >
                          {event.category}
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: '1.3' }}>
                        {event.description}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
