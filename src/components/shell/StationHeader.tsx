import React from 'react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import { Radio, ArrowLeft, Thermometer, Wind, ShieldCheck, Wifi, WifiOff, Cpu, Play, Bot, Sparkles } from 'lucide-react';

interface StationHeaderProps {
  onBackToWelcome?: () => void;
  onOpenCopilot?: () => void;
}

export const StationHeader: React.FC<StationHeaderProps> = ({ onBackToWelcome, onOpenCopilot }) => {
  const {
    selectedStation,
    localStationTime,
    clearStationSelection,
  } = useStation();

  const {
    currentAtmospheric,
    stationHealthPct,
    connectionStatus,
    activeScenarioDef,
  } = useSimulation();

  if (!selectedStation) return null;

  const handleReturn = () => {
    if (onBackToWelcome) {
      onBackToWelcome();
    } else {
      clearStationSelection();
    }
  };

  return (
    <header className="top-header">
      {/* Brand Identity */}
      <div className="header-brand-group">
        <button
          onClick={handleReturn}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(0, 78, 100, 0.08)',
            border: '1px solid rgba(0, 78, 100, 0.15)',
            color: 'var(--deep-teal)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Return to Welcome & Station Selection"
        >
          <ArrowLeft size={16} />
          <span>STATIONS</span>
        </button>

        <div className="header-badge-icon" title="Maitri & Bharati Research Operations">
          M&amp;B
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="header-title" style={{ margin: 0 }}>
              DAKSHIN
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(0, 78, 100, 0.1)',
                  border: '1px solid rgba(0, 78, 100, 0.18)',
                  color: 'var(--deep-teal)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginLeft: '0.4rem',
                }}
              >
                PC2 CONTROL
              </span>
            </h1>

            {/* Simulation Mode Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.18rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(0, 78, 100, 0.12)',
                border: '1px solid rgba(0, 78, 100, 0.25)',
                color: 'var(--deep-teal)',
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
              }}
              title="SIMULATION MODE: Synthetic / historical-data-driven demonstration. Not connected to live physical telemetry."
            >
              <Cpu size={12} />
              <span>SIMULATION MODE</span>
            </div>
          </div>
          <div className="header-subtitle">
            Antarctic Operations Remote Center
          </div>
        </div>
      </div>

      {/* Selected Station Banner Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          backgroundColor: 'rgba(0, 78, 100, 0.08)',
          border: '1px solid rgba(0, 78, 100, 0.15)',
          padding: '0.45rem 1.25rem',
          borderRadius: 'var(--radius-full)',
        }}
      >
        <Radio size={16} style={{ color: 'var(--deep-teal)' }} />
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.92rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: 'var(--deep-teal)',
          }}
        >
          STATION // {selectedStation.name}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ({selectedStation.coordinates.lat})
        </span>

        {activeScenarioDef && (
          <span
            style={{
              fontSize: '0.64rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
            title={activeScenarioDef.description}
          >
            <Play size={10} />
            {activeScenarioDef.badge_label}
          </span>
        )}
      </div>

      {/* Meta Telemetry & Link Status */}
      <div className="header-meta-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: 'var(--deep-teal)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
            title="Outside Ambient Temperature (Historical-data-driven simulation)"
          >
            <Thermometer size={16} style={{ color: 'var(--deep-teal-light)' }} />
            <span>{currentAtmospheric.temperature}°C</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: 'var(--deep-teal)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
            title="Surface Wind Velocity (Historical-data-driven simulation)"
          >
            <Wind size={16} style={{ color: 'var(--deep-teal-light)' }} />
            <span>{currentAtmospheric.wind_speed} m/s</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: stationHealthPct > 75 ? 'var(--status-normal)' : stationHealthPct > 50 ? 'var(--status-warning)' : 'var(--status-critical)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
            title="Overall Station Health (Calculated from synthetic machinery risk)"
          >
            <ShieldCheck size={16} />
            <span>{stationHealthPct}% HEALTH</span>
          </div>
        </div>

        {/* RAG Copilot Button */}
        <button
          onClick={onOpenCopilot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, rgba(0, 78, 100, 0.15) 0%, rgba(0, 168, 150, 0.2) 100%)',
            border: '1px solid rgba(0, 168, 150, 0.35)',
            color: 'var(--deep-teal)',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 78, 100, 0.1)',
          }}
          title="Open DAKSHIN RAG Diagnostic Copilot"
        >
          <Bot size={15} style={{ color: '#00A896' }} />
          <span>ASK COPILOT</span>
          <Sparkles size={13} style={{ color: '#F59E0B' }} />
        </button>

        {/* Local Station Clock */}
        <div className="header-telemetry-pill">
          <span className="header-telemetry-label">Station Time</span>
          <span className="header-telemetry-val">{localStationTime}</span>
        </div>

        {/* Link Status */}
        <div
          className={`link-status-badge ${
            connectionStatus === 'ONLINE'
              ? 'link-status-online'
              : connectionStatus === 'OFFLINE'
              ? 'link-status-offline'
              : 'link-status-reconnecting'
          }`}
          title={connectionStatus === 'ONLINE' ? 'Autonomous local simulation active servicing PC2 interface' : 'Remote satellite link offline'}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'ONLINE' ? 'var(--status-normal)' : 'var(--status-critical)',
            }}
            className={connectionStatus === 'ONLINE' ? 'status-dot-pulse' : ''}
          />
          {connectionStatus === 'ONLINE' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Wifi size={13} />
              LOCAL SIMULATION ACTIVE
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <WifiOff size={13} />
              REMOTE LINK OFFLINE
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
