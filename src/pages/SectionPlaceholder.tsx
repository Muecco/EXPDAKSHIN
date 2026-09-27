import React from 'react';
import { useStation } from '../context/StationContext';
import { CardNav } from '../components/navigation/CardNav';
interface SectionPlaceholderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  sectionId: string;
  isStationSelector?: boolean;
  onNavigate?: (route: string) => void;
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({
  title,
  subtitle,
  icon: Icon,
  sectionId,
  isStationSelector = false,
  onNavigate,
}) => {
  const { selectedStation } = useStation();

  if (isStationSelector) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 78, 100, 0.08)',
              color: 'var(--deep-teal)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            <Icon size={14} />
            <span>Target Station Selection</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
            Antarctic Research Stations
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Switch target telemetry and digital twin between Maitri and Bharati.
          </p>
        </div>

        <CardNav
          initiallyOpen={true}
          onSelectStation={() => {
            if (onNavigate) onNavigate('/overview');
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="frost-card"
      style={{
        padding: '3rem',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(0, 78, 100, 0.12)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 78, 100, 0.08)',
          color: 'var(--deep-teal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <Icon size={32} />
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--deep-teal)',
          marginBottom: '0.5rem',
          opacity: 0.7,
        }}
      >
        {selectedStation?.name} // {sectionId.toUpperCase()}
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2.25rem',
          fontWeight: 900,
          color: 'var(--deep-teal)',
          margin: '0 0 1rem 0',
        }}
      >
        {title}
      </h2>

      <p style={{ maxWidth: '580px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem', margin: 0 }}>
        {subtitle}
      </p>

      <div
        style={{
          marginTop: '2rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--mist-gray-light)',
          border: '1px solid rgba(0, 78, 100, 0.1)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--deep-teal)',
          fontWeight: 600,
        }}
      >
        Active Station: {selectedStation?.fullName} ({selectedStation?.coordinates.lat})
      </div>
    </div>
  );
};
