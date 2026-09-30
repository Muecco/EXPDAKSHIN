import React, { useState } from 'react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import {
  SlidersHorizontal,
  Radio,
  Cpu,
  ShieldCheck,
  Zap,
  Server,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
  Terminal,
  Activity,
  HardDrive,
  Wifi,
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate?: (route: string) => void;
}

type SettingsTab = 'LINK' | 'EDGE' | 'SECURITY' | 'SIMULATOR';

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { selectedStation } = useStation();
  const { connectionStatus } = useSimulation();
  const isConnected = connectionStatus === 'ONLINE' || connectionStatus === 'DEGRADED';

  const [activeTab, setActiveTab] = useState<SettingsTab>('LINK');
  const [streamRate, setStreamRate] = useState<number>(1000); // ms
  const [fecMode, setFecMode] = useState<'STANDARD' | 'AGGRESSIVE'>('AGGRESSIVE');
  const [primaryLink, setPrimaryLink] = useState<'GSAT_KU' | 'IRIDIUM_L'>('GSAT_KU');
  const [cacheRetentionDays, setCacheRetentionDays] = useState<number>(45);
  const [compressionEnabled, setCompressionEnabled] = useState<boolean>(true);
  const [noiseAmplitude, setNoiseAmplitude] = useState<number>(0.04);
  const [windChillMultiplier, setWindChillMultiplier] = useState<number>(1.35);
  const [auroraScintillation, setAuroraScintillation] = useState<boolean>(true);
  const [dualKeyAuthorized, setDualKeyAuthorized] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const stationName = selectedStation?.name || 'Bharati Antarctic Research Station';
  const stationId = selectedStation?.id || 'bharati';

  // Station Coordinates & Satellite Azimuth/Elevation calibration
  const isBharati = stationId === 'bharati';
  const stationCoords = isBharati ? '69°24\'28"S, 76°11\'14"E (Larsemann Hills)' : '70°45\'58"S, 11°44\'09"E (Schirmacher Oasis)';
  const satElevation = isBharati ? '4.8° Horizon' : '6.2° Horizon';
  const satAzimuth = isBharati ? '022.4° True North' : '014.8° True North';
  const brokerHost = `mqtts://edge.${stationId}.dakshin.ncaor.gov.in:8883`;

  const handleTestPing = () => {
    setIsPinging(true);
    setPingStatus('Initiating GSAT Ku-Band round-trip transponder ping...');
    setTimeout(() => {
      setIsPinging(false);
      const latency = primaryLink === 'GSAT_KU' ? 564 + Math.floor(Math.random() * 28) : 712 + Math.floor(Math.random() * 45);
      setPingStatus(`Ping ACK received from ${stationId.toUpperCase()} EDGE-GATEWAY. RTT: ${latency} ms | Jitter: 4.2 ms | Packet Loss: 0.0%`);
    }, 900);
  };

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="frost-card"
        style={{
          padding: '1.5rem 2rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 78, 100, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <SlidersHorizontal size={22} style={{ color: 'var(--deep-teal)' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
              Station &amp; Edge Link Configuration
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Real-time telemetry transport, satellite transponder parameters, and edge simulator settings for {stationName}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 119, 6, 0.12)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
              fontSize: '0.75rem',
              fontWeight: 800,
              color: isConnected ? '#059669' : '#D97706',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10B981' : '#F59E0B',
              }}
            />
            LINK: {connectionStatus === 'ONLINE' ? 'CARRIER LOCKED (GSAT-7/30)' : connectionStatus}
          </div>

          <button
            onClick={handleSaveSettings}
            style={{
              padding: '0.55rem 1.15rem',
              backgroundColor: 'var(--deep-teal)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} />
            {saveSuccess ? 'CONFIG APPLIED' : 'APPLY CONFIGURATION'}
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.65rem', borderBottom: '1px solid rgba(0, 78, 100, 0.12)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'LINK' as SettingsTab, label: 'Telemetry & Satellite Uplink', icon: Radio },
          { id: 'EDGE' as SettingsTab, label: 'Polar Edge Gateway & Broker', icon: Server },
          { id: 'SECURITY' as SettingsTab, label: 'Access Control & Safety Interlocks', icon: ShieldCheck },
          { id: 'SIMULATOR' as SettingsTab, label: 'Physics Calibration & Perturbations', icon: Sliders },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--deep-teal)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : 'var(--deep-teal)',
                border: isActive ? '1px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TELEMETRY & SATELLITE UPLINK */}
      {activeTab === 'LINK' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
          {/* Uplink Carrier Card */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Primary Polar Satellite Carrier
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                ISRO / GSAT SPACE SEGMENT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--mist-gray-light)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATION POSITION</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                    {stationCoords}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--mist-gray-light)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>DISH ELEVATION / AZIMUTH</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                    {satElevation} // {satAzimuth}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.45rem' }}>
                  ACTIVE TRANSPONDER UPLINK ROUTE
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[
                    { id: 'GSAT_KU', label: 'GSAT-7/30 Polar Ku-Band (Primary Dedicated 14.25 GHz)', desc: 'Direct NCAOR Ground Station, Goa' },
                    { id: 'IRIDIUM_L', label: 'Iridium Certus 700 L-Band (Polar LEO Hot-Standby)', desc: 'Global Cross-Linked Constellation' },
                  ].map((link) => (
                    <div
                      key={link.id}
                      onClick={() => setPrimaryLink(link.id as any)}
                      style={{
                        flex: 1,
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: primaryLink === link.id ? '2px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                        backgroundColor: primaryLink === link.id ? 'rgba(0, 78, 100, 0.04)' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: 'var(--deep-teal)', fontSize: '0.78rem' }}>{link.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{link.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrier Frequency & Signal Quality Table */}
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)', background: '#FAFAFA' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>UPLINK FREQ</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>14.250 GHz</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>DOWNLINK FREQ</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>11.450 GHz</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>CARRIER/NOISE (C/N0)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#059669' }}>14.4 dB</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>EIRP / POLARIZATION</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>48.5 dBW / Linear V</div>
                  </div>
                </div>
              </div>

              {/* Ping Test Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleTestPing}
                  disabled={isPinging}
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--deep-teal)',
                    border: '1px solid var(--deep-teal)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Wifi size={15} />
                  {isPinging ? 'PINGING STATION...' : 'TEST TRANSPONDER ROUND-TRIP PING'}
                </button>
                {pingStatus && (
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--deep-teal)' }}>
                    {pingStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry Transport Tuning */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Telemetry Stream Parameters
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                QOS &amp; BANDWIDTH BUDGET
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--deep-teal)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  TELEMETRY PACKET SAMPLING FREQUENCY
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { ms: 250, label: 'Fast Burst (250 ms)', note: 'Scientific research / Transient study' },
                    { ms: 1000, label: 'Nominal Stream (1,000 ms)', note: 'Standard operational mission watch' },
                    { ms: 5000, label: 'Blizzard Conservation (5,000 ms)', note: 'Severe weather / Degraded link' },
                  ].map((opt) => (
                    <button
                      key={opt.ms}
                      onClick={() => setStreamRate(opt.ms)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: streamRate === opt.ms ? '2px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                        backgroundColor: streamRate === opt.ms ? 'var(--deep-teal)' : '#FFFFFF',
                        color: streamRate === opt.ms ? '#FFFFFF' : 'var(--deep-teal)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.85, marginTop: '0.2rem' }}>{opt.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--deep-teal)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  FORWARD ERROR CORRECTION (FEC) ALGORITHM
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setFecMode('STANDARD')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: fecMode === 'STANDARD' ? '2px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                      backgroundColor: fecMode === 'STANDARD' ? 'rgba(0, 78, 100, 0.08)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--deep-teal)' }}>LDPC Rate 7/8 (Standard)</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Higher net throughput, standard polar clear-sky</div>
                  </button>

                  <button
                    onClick={() => setFecMode('AGGRESSIVE')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: fecMode === 'AGGRESSIVE' ? '2px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                      backgroundColor: fecMode === 'AGGRESSIVE' ? 'rgba(0, 78, 100, 0.08)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--deep-teal)' }}>Reed-Solomon + LDPC Rate 3/4 (Aggressive)</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Immune to atmospheric blizzard scattering &amp; rain fade</div>
                  </button>
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--mist-gray-light)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <strong>Link Health Provenance:</strong> The GSAT Ku-Band terminal at {stationName} communicates over an encrypted virtual private transponder link to the Antarctic Operations Mission Directorate at NCPOR, Vasco da Gama, Goa.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POLAR EDGE GATEWAY & BROKER */}
      {activeTab === 'EDGE' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
          {/* Edge Controller Specifications */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Station Edge Compute Node
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>
                ONLINE // RUGGEDIZED
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>HARDWARE PLATFORM</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>Advantech Polar IPC-610 Rugged Linux</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>CONTAINER ENGINE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>Docker Swarm Polar Edge Runtime v24.0.7</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>INDUSTRIAL PROTOCOL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>OPC-UA (IEC 62541) + Modbus TCP/IP</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>BROKER ENDPOINT URL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>{brokerHost}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>mTLS X.509 CERTIFICATE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#059669' }}>VALID (Expires 14-MAR-2028 // RSA-4096)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>CORE OPERATING TEMP</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>+38.5°C (Internal Station Server Bay)</span>
              </div>
            </div>
          </div>

          {/* Local Buffer & Storage Retention */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HardDrive size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Offline Telemetry Store &amp; Forward
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                FIFO CIRCULAR STORAGE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700 }}>NVMe Flash Ring Buffer (128 GB Partition)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>38.4 GB Used / 89.6 GB Available</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: '30%', height: '100%', background: 'var(--deep-teal)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, color: 'var(--deep-teal)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                  OFFLINE BUFFER RETENTION HORIZON
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[30, 45, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setCacheRetentionDays(days)}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: cacheRetentionDays === days ? '2px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                        backgroundColor: cacheRetentionDays === days ? 'var(--deep-teal)' : '#FFFFFF',
                        color: cacheRetentionDays === days ? '#FFFFFF' : 'var(--deep-teal)',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {days} Days Autonomous
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--deep-teal)', fontSize: '0.78rem' }}>Zstandard (zstd) Payload Compression</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>4.2:1 compression ratio before satellite transmit</div>
                </div>
                <input
                  type="checkbox"
                  checked={compressionEnabled}
                  onChange={(e) => setCompressionEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCESS CONTROL & SAFETY INTERLOCKS */}
      {activeTab === 'SECURITY' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
          {/* Active Operator Credentials */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Mission Role-Based Access Control
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>
                LEVEL-4 MISSION DIRECTORATE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.78rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--mist-gray-light)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>AUTHENTICATED OPERATOR</div>
                <div style={{ fontWeight: 900, color: 'var(--deep-teal)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
                  Dr. K. Swaminathan (Polar Ops &amp; Instrumentation Lead)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>SECURITY CLEARANCE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>TOP SECRET // POLAR EXPEDITION</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>2FA HARDWARE TOKEN</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#059669' }}>YUBIKEY FIPS-140-3 VERIFIED</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '0.5rem', padding: '0.4rem 0' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>SESSION IP &amp; TUNNEL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>10.240.18.42 (IPsec WireGuard Mesh)</span>
              </div>
            </div>
          </div>

          {/* Dual-Key SCADA Safety Interlocks */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  SCADA Command Safety Interlocks
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#DC2626' }}>
                CRITICAL LIFE-SAFETY
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.78rem' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                In Antarctic sub-zero environments (-40°C), remote actuation of life-support and station power requires dual-person authorization between Goa Mission Control and Station Commander in Antarctica.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.04)' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#DC2626' }}>Remote Generator Black-Start Trip</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Station Commander Physical Interlock Required</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.72rem', color: '#DC2626' }}>LOCKED</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(217, 119, 6, 0.2)', background: 'rgba(217, 119, 6, 0.04)' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#D97706' }}>HVAC Glycol Loop Re-routing</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Requires Lead Engineer Dual-Signoff</div>
                </div>
                <button
                  onClick={() => setDualKeyAuthorized(!dualKeyAuthorized)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: dualKeyAuthorized ? '#059669' : '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {dualKeyAuthorized ? 'AUTHORIZED' : 'AUTHORIZE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICS CALIBRATION & SIMULATION PERTURBATIONS */}
      {activeTab === 'SIMULATOR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
          {/* Calibrated Model Coefficients */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} style={{ color: 'var(--deep-teal)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Calibrated Physics Engine Coefficients
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                PROTOTYPE MATH MODEL
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700 }}>Blizzard Wind-Chill Thermal Penalty Multiplier:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>{windChillMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={windChillMultiplier}
                  onChange={(e) => setWindChillMultiplier(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>1.0x (Calm Wind)</span>
                  <span>1.75x (Katabatic Storm)</span>
                  <span>2.5x (Polar Hurricane)</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700 }}>Sensor Gaussian White Noise (σ Jitter):</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>{(noiseAmplitude * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.12"
                  step="0.005"
                  value={noiseAmplitude}
                  onChange={(e) => setNoiseAmplitude(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>1.0% (Laboratory Grade)</span>
                  <span>4.0% (Nominal Field RTD)</span>
                  <span>12.0% (Degraded Cabling)</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--deep-teal)', fontSize: '0.78rem' }}>Auroral Ionospheric Scintillation Injection</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Simulates geomagnetic solar flux perturbations on RF transponders</div>
                </div>
                <input
                  type="checkbox"
                  checked={auroraScintillation}
                  onChange={(e) => setAuroraScintillation(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Provenance Notice */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Terminal size={18} style={{ color: 'var(--deep-teal)' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Simulation Validation Standard
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                All thermodynamic, electrical, and telemetry transport calculations are performed client-side using deterministic physics equations calibrated against Indian Antarctic Expedition operational baselines.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>IEEE 802.3 / ITU-R S.580 Polar Satellite Earth Station compliance</li>
                <li>ISO 10816-3 Mechanical Vibration evaluation criteria</li>
                <li>ASHRAE Cold Climate Life-Support Habitat guidelines</li>
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 78, 100, 0.05)', fontSize: '0.72rem', color: 'var(--deep-teal)' }}>
              <strong>Notice:</strong> Modifying synthetic noise or thermal penalties directly updates the active telemetry feed across Overview, Machinery, and Digital Twin panels.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
