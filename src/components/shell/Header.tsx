import React, { useState } from 'react';
import { useStation } from '../../context/StationContext';
import { Radio, ChevronDown, Check, Wifi, WifiOff, Thermometer, Wind, ShieldCheck } from 'lucide-react';
import type { StationId } from '../../types';

export const Header: React.FC = () => {
  const {
    selectedStation,
    allStations,
    selectStation,
    connectionStatus,
    localStationTime,
  } = useStation();

  const [isStationMenuOpen, setIsStationMenuOpen] = useState(false);

  if (!selectedStation) {
    return null;
  }

  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'ONLINE':
        return 'link-status-online';
      case 'OFFLINE':
        return 'link-status-offline';
      default:
        return 'link-status-reconnecting';
    }
  };

  const getStatusDot = () => {
    switch (connectionStatus) {
      case 'ONLINE':
        return (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-normal)',
            }}
            className="status-dot-pulse"
          />
        );
      case 'OFFLINE':
        return (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-critical)',
            }}
            className="status-dot-critical"
          />
        );
      default:
        return (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-warning)',
            }}
            className="status-dot-warning"
          />
        );
    }
  };

  return (
    <header className="top-header">
      {/* Brand Identity */}
      <div className="header-brand-group">
        <div className="header-badge-icon" title="Maitri & Bharati Research Operations">
          M&amp;B
        </div>
        <div>
          <h1 className="header-title">
            DAKSHIN
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(0, 78, 100, 0.4)',
                border: '1px solid var(--deep-teal-border)',
                color: 'var(--mist-gray)',
                fontWeight: 600,
                letterSpacing: '0.08em',
              }}
            >
              PC2 CONTROL
            </span>
          </h1>
          <div className="header-subtitle">
            Antarctic Operations Remote Center
          </div>
        </div>
      </div>

      {/* Station Selector Quick Menu */}
      <div style={{ position: 'relative' }}>
        <button
          className="station-pill-btn"
          onClick={() => setIsStationMenuOpen(!isStationMenuOpen)}
          aria-expanded={isStationMenuOpen}
          aria-haspopup="true"
          title="Select Antarctic Research Station"
        >
          <Radio size={15} style={{ color: 'var(--mist-gray)' }} />
          <span>STATION // {selectedStation.name}</span>
          <ChevronDown
            size={14}
            style={{
              transform: isStationMenuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {isStationMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              minWidth: '280px',
              background: 'var(--polar-surface)',
              border: '1px solid var(--polar-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(16px)',
              zIndex: 100,
              padding: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                color: 'rgba(224, 229, 233, 0.45)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '0.4rem 0.75rem',
              }}
            >
              Select Target Station
            </div>
            {Object.values(allStations).map((station) => {
              const isCurrent = station.id === selectedStation.id;
              return (
                <button
                  key={station.id}
                  onClick={() => {
                    selectStation(station.id as StationId);
                    setIsStationMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isCurrent ? 'rgba(0, 78, 100, 0.35)' : 'transparent',
                    border: isCurrent ? '1px solid var(--deep-teal-border)' : '1px solid transparent',
                    color: isCurrent ? '#FFFFFF' : 'var(--mist-gray)',
                    fontSize: '0.85rem',
                    fontWeight: isCurrent ? 700 : 500,
                    marginBottom: '0.25rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'rgba(224, 229, 233, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{station.name}</span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--status-normal)',
                          fontWeight: 600,
                        }}
                      >
                        ● ONLINE
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'rgba(224, 229, 233, 0.5)',
                        marginTop: '2px',
                      }}
                    >
                      Configured: {station.coordinates.lat}, {station.coordinates.long}
                    </div>
                  </div>
                  {isCurrent && <Check size={16} style={{ color: 'var(--status-normal)' }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Atmospheric & Station Telemetry Quick Strip */}
      <div className="header-meta-group">
        {/* Outside Temp & Wind */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              color: 'var(--mist-gray)',
            }}
            title="Atmospheric Temperature (Historical-data-driven simulation)"
          >
            <Thermometer size={14} style={{ color: '#38BDF8' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {selectedStation.outsideTempCelsius}°C
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              color: 'var(--mist-gray)',
            }}
            title="Surface Wind Speed (Historical-data-driven simulation)"
          >
            <Wind size={14} style={{ color: '#7DD3FC' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {selectedStation.windSpeedMps} m/s
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              color: 'var(--mist-gray)',
            }}
            title="Overall Station Systems Health Index"
          >
            <ShieldCheck size={14} style={{ color: 'var(--status-normal)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {selectedStation.stationHealthPct}% Health
            </span>
          </div>
        </div>

        {/* Local Station Clock */}
        <div className="header-telemetry-pill">
          <span className="header-telemetry-label">Station Time</span>
          <span className="header-telemetry-val">{localStationTime || 'Synchronizing...'}</span>
        </div>

        {/* Link / Satellite Status Badge */}
        <div className={`link-status-badge ${getStatusClass()}`}>
          {getStatusDot()}
          {connectionStatus === 'ONLINE' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Wifi size={13} />
              LINK ACTIVE
            </span>
          ) : connectionStatus === 'OFFLINE' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <WifiOff size={13} />
              REMOTE LINK OFFLINE
            </span>
          ) : (
            <span>{connectionStatus}</span>
          )}
        </div>
      </div>
    </header>
  );
};
