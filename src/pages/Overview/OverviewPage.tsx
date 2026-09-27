import React from 'react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import {
  Compass,
  Snowflake,
  Thermometer,
  Wind,
  Cog,
  Gauge,
  Droplets,
  Play,
  RotateCcw,
} from 'lucide-react';
import { DigitalTwinPanel } from '../../components/digitalTwin/DigitalTwinPanel';

interface OverviewPageProps {
  onNavigate?: (route: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  void onNavigate;
  const { selectedStation, connectionStatus, setConnectionStatus } = useStation();
  const {
    currentAtmospheric,
    machineryAssets,
    couplingState,
    triggerScenario,
    resetSimulation,
    activeScenario,
  } = useSimulation();

  if (!selectedStation) return null;

  const stationImg = selectedStation.id === 'bharati' ? '/images/bharati_station.jpg' : '/images/maitri_station.jpg';

  const g1 = machineryAssets['GEN-01'];
  const h1 = machineryAssets['HEATER-01'];
  const p1 = machineryAssets['PUMP-01'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Station Hero Photographic Card (Mist Gray / White Glass with Station Photo) */}
      <div
        className="frost-card"
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(280px, 0.8fr)',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 78, 100, 0.12)',
        }}
      >
        {/* Left Information Column */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="status-badge status-badge-normal">
                <span className="status-dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-normal)' }} />
                OPERATIONAL PC2 LINK
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                EST. {selectedStation.establishedYear} // ELEVATION: {selectedStation.elevationMeters}M
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.75rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: 'var(--deep-teal)',
                margin: '0 0 0.5rem 0',
              }}
            >
              {selectedStation.fullName}
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Compass size={16} style={{ color: 'var(--deep-teal)' }} />
                Configured: {selectedStation.coordinates.lat}, {selectedStation.coordinates.long}
              </span>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
              {selectedStation.configuredLocation}. High-precision digital twin monitoring synthetic machinery loads, power generation buses, and environmental life support.
            </p>
          </div>

          {/* Quick Simulation Link State Controls */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Satellite Link Simulator:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setConnectionStatus('ONLINE')}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: connectionStatus === 'ONLINE' ? 'var(--deep-teal)' : 'rgba(0, 78, 100, 0.08)',
                  color: connectionStatus === 'ONLINE' ? '#FFFFFF' : 'var(--deep-teal)',
                  cursor: 'pointer',
                  border: '1px solid rgba(0, 78, 100, 0.15)',
                }}
              >
                ONLINE
              </button>
              <button
                onClick={() => setConnectionStatus('DEGRADED')}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: connectionStatus === 'DEGRADED' ? 'var(--status-warning)' : 'rgba(0, 78, 100, 0.08)',
                  color: connectionStatus === 'DEGRADED' ? '#FFFFFF' : 'var(--deep-teal)',
                  cursor: 'pointer',
                  border: '1px solid rgba(0, 78, 100, 0.15)',
                }}
              >
                DEGRADED
              </button>
              <button
                onClick={() => setConnectionStatus('OFFLINE')}
                style={{
                  padding: '0.3rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: connectionStatus === 'OFFLINE' ? 'var(--status-critical)' : 'rgba(0, 78, 100, 0.08)',
                  color: connectionStatus === 'OFFLINE' ? '#FFFFFF' : 'var(--deep-teal)',
                  cursor: 'pointer',
                  border: '1px solid rgba(0, 78, 100, 0.15)',
                }}
              >
                BLACKOUT
              </button>
            </div>
          </div>
        </div>

        {/* Right Station Photographic Image Preview with subtle overlay */}
        <div
          style={{
            position: 'relative',
            minHeight: '260px',
            backgroundImage: `url(${stationImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, #FFFFFF 0%, rgba(255, 255, 255, 0.2) 20%, transparent 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--deep-teal)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            PHOTOGRAPHIC OBSERVATION // {selectedStation.name}
          </div>
        </div>
      </div>

      {/* 3D Digital Twin Major Station Section */}
      <DigitalTwinPanel />

      {/* Environment -> Machinery Physical Coupling Quick Strip */}
      <div
        className="frost-card"
        style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 78, 100, 0.12)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} style={{ color: 'var(--deep-teal)' }} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--deep-teal)' }}>
              ENVIRONMENT → MACHINERY PHYSICAL COUPLING
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>TEST SCENARIOS:</span>
            <button
              onClick={() => triggerScenario('EXTREME_COLD')}
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                background: activeScenario === 'EXTREME_COLD' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(0, 78, 100, 0.05)',
                color: '#DC2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Play size={10} /> EXTREME COLD
            </button>
            <button
              onClick={() => triggerScenario('GENERATOR_VIBRATION')}
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                background: activeScenario === 'GENERATOR_VIBRATION' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(0, 78, 100, 0.05)',
                color: '#D97706',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Play size={10} /> GEN VIBRATION
            </button>
            <button
              onClick={() => triggerScenario('BLIZZARD')}
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(0, 78, 100, 0.2)',
                background: activeScenario === 'BLIZZARD' ? 'rgba(0, 78, 100, 0.2)' : 'rgba(0, 78, 100, 0.05)',
                color: 'var(--deep-teal)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Play size={10} /> BLIZZARD
            </button>
            <button
              onClick={resetSimulation}
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(0, 78, 100, 0.15)',
                background: '#FFFFFF',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title="Reset simulation to nominal baseline"
            >
              <RotateCcw size={10} /> RESET
            </button>
          </div>
        </div>

        {/* 5-Step Coupled Pipeline Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', fontSize: '0.72rem' }}>
          <div style={{ background: 'var(--mist-gray-light)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 700 }}>1. AMBIENT TEMP</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-teal)' }}>
              {currentAtmospheric.temperature}°C
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 700 }}>2. HEATING DEMAND</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: couplingState.heating_demand_pct > 80 ? '#DC2626' : 'var(--deep-teal)' }}>
              {couplingState.heating_demand_pct}%
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 700 }}>3. STATION LOAD</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-teal)' }}>
              {couplingState.station_electrical_load_kw} kW
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 700 }}>4. GEN-01 LOAD / FUEL</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: couplingState.generator_load_pct > 85 ? '#DC2626' : 'var(--deep-teal)' }}>
              {couplingState.generator_load_pct}% · {couplingState.total_fuel_consumption_rate} L/h
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem', fontWeight: 700 }}>5. STRESS / RISK</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: couplingState.machinery_stress_index > 60 ? '#DC2626' : couplingState.machinery_stress_index > 35 ? '#D97706' : '#059669' }}>
              {couplingState.machinery_stress_index} / 100
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
          {couplingState.active_coupling_text}
        </div>
      </div>

      {/* Grid: 2 Operational Cards (Atmosphere, Synthetic Machinery) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
        
        {/* Card 1: Atmospheric Intelligence (Mist Gray surface) */}
        <div className="frost-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Snowflake size={20} style={{ color: 'var(--deep-teal)' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--deep-teal)' }}>
                Atmospheric Intelligence
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 78, 100, 0.08)',
                color: 'var(--deep-teal)',
                border: '1px solid rgba(0, 78, 100, 0.2)',
                fontWeight: 700,
              }}
            >
              HISTORICAL SIMULATION
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Driven by historical Antarctic meteorological datasets for {selectedStation.name}. Transparent provenance without fabricated live readings.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div
              style={{
                background: 'var(--mist-gray-light)',
                border: '1px solid rgba(0, 78, 100, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--deep-teal)', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <Thermometer size={16} /> Outside Temp
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--deep-teal)' }}>
                {currentAtmospheric.temperature}°C
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Surface ambient temperature
              </div>
            </div>

            <div
              style={{
                background: 'var(--mist-gray-light)',
                border: '1px solid rgba(0, 78, 100, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--deep-teal)', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                <Wind size={16} /> Wind Velocity
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--deep-teal)' }}>
                {currentAtmospheric.wind_speed} <span style={{ fontSize: '0.95rem' }}>m/s</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {currentAtmospheric.wind_direction_cardinal} ({currentAtmospheric.wind_direction}°) katabatic vector
              </div>
            </div>

            <div
              style={{
                background: 'var(--mist-gray-light)',
                border: '1px solid rgba(0, 78, 100, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--deep-teal)', fontSize: '0.72rem', fontWeight: 600 }}>
                <Gauge size={14} /> Pressure
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                {currentAtmospheric.pressure} hPa
              </div>
            </div>

            <div
              style={{
                background: 'var(--mist-gray-light)',
                border: '1px solid rgba(0, 78, 100, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--deep-teal)', fontSize: '0.72rem', fontWeight: 600 }}>
                <Droplets size={14} /> Humidity / State
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                {currentAtmospheric.humidity}% · {currentAtmospheric.weather_state}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Synthetic Machinery & Telemetry Health */}
        <div className="frost-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cog size={20} style={{ color: 'var(--deep-teal)' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--deep-teal)' }}>
                Machinery Telemetry
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 78, 100, 0.08)',
                color: 'var(--deep-teal)',
                border: '1px solid rgba(0, 78, 100, 0.2)',
                fontWeight: 700,
              }}
            >
              SYNTHETIC ASSETS
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Live telemetry streaming from synthetic generators and life-support actuators.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {g1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--deep-teal)' }}>GEN-01 Primary Diesel Generator</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: g1.status === 'CRITICAL' ? 'var(--status-critical)' : g1.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-normal)',
                      fontWeight: 700,
                    }}
                  >
                    {g1.status} // {g1.current_temperature}°C (Risk {g1.risk.score})
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, 100 - g1.risk.score))}%`,
                      height: '100%',
                      background: g1.status === 'CRITICAL' ? 'var(--status-critical)' : g1.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-normal)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {h1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--deep-teal)' }}>HEATER-01 Habitat Life Support</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: h1.status === 'FAILED' ? '#991B1B' : h1.status === 'CRITICAL' ? 'var(--status-critical)' : h1.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-normal)',
                      fontWeight: 700,
                    }}
                  >
                    {h1.status} // {h1.current_temperature}°C
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, 100 - h1.risk.score))}%`,
                      height: '100%',
                      background: h1.status === 'FAILED' ? '#991B1B' : h1.status === 'CRITICAL' ? 'var(--status-critical)' : h1.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-normal)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {p1 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--deep-teal)' }}>PUMP-01 Hydraulic Transfer Feed</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: p1.status === 'CRITICAL' ? 'var(--status-critical)' : p1.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-normal)',
                      fontWeight: 700,
                    }}
                  >
                    {p1.status} // {p1.current_vibration} mm/s Vib
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, 100 - p1.risk.score))}%`,
                      height: '100%',
                      background: p1.status === 'CRITICAL' ? 'var(--status-critical)' : p1.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-normal)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
