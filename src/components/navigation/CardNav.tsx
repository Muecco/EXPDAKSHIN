import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, MountainSnow, Radio, Compass, ShieldCheck } from 'lucide-react';
import { useStation } from '../../context/StationContext';
import type { StationId } from '../../types';

interface CardNavProps {
  initiallyOpen?: boolean;
  onSelectStation?: (stationId: StationId) => void;
}

export const CardNav: React.FC<CardNavProps> = ({ initiallyOpen = true, onSelectStation }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const { selectStation, allStations } = useStation();

  const handleStationClick = (id: StationId) => {
    selectStation(id);
    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto', zIndex: 30, position: 'relative' }}>
      {/* Navigation Shell from prototype */}
      <nav
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-nav)',
          boxShadow: 'var(--shadow-nav)',
          border: '1px solid rgba(0, 78, 100, 0.12)',
          overflow: 'hidden',
          transition: 'all 0.5s ease',
        }}
      >
        {/* Top Bar (Height 80px matching prototype) */}
        <div
          style={{
            height: '80px',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--deep-teal)',
              background: isOpen ? 'rgba(0, 78, 100, 0.08)' : 'transparent',
              transition: 'all 0.3s ease',
            }}
            title={isOpen ? 'Collapse station menu' : 'Expand station menu'}
            aria-label="Toggle Station Menu"
          >
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </motion.div>
          </button>

          {/* Center Brand Identity */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--mist-gray)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0, 78, 100, 0.12)',
              }}
            >
              <span style={{ color: 'var(--deep-teal)', fontWeight: 900, fontSize: '0.9rem', fontStyle: 'italic' }}>
                M&amp;B
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: 'var(--deep-teal)',
                fontSize: '1.75rem',
              }}
            >
              DAKSHIN
            </span>
          </div>

          {/* Action CTA */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '0 1.75rem',
              height: '52px',
              backgroundColor: 'var(--deep-teal)',
              color: 'var(--mist-gray)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(0, 78, 100, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isOpen ? 'Close Stations' : 'Select Station'}
          </button>
        </div>

        {/* Expandable Staggered Card Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: '0.75rem 1.25rem 1.25rem 1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0.875rem',
                }}
              >
                {/* Card 1: MAITRI — compact selector */}
                <motion.div
                  initial={{ y: 30, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
                  className="teal-station-card"
                  onClick={() => handleStationClick('maitri')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleStationClick('maitri')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Top row: icon + name + status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MountainSnow size={18} style={{ color: 'var(--mist-gray)', opacity: 0.9 }} />
                      <h3
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.75rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          color: '#FFFFFF',
                          margin: 0,
                        }}
                      >
                        MAITRI
                      </h3>
                    </div>
                    <span className="status-badge status-badge-normal" style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.2)', fontSize: '0.65rem' }}>
                      ● ONLINE
                    </span>
                  </div>

                  {/* Location + health */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.73rem', opacity: 0.78 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Compass size={12} />
                      <span>Schirmacher Oasis · {allStations.maitri.coordinates.lat}, {allStations.maitri.coordinates.long}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={12} />
                      <span>Health {allStations.maitri.stationHealthPct}% · {allStations.maitri.activeAlertCount} alerts</span>
                    </div>
                  </div>

                  {/* Enter CTA */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(224, 229, 233, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginTop: '0.15rem',
                    }}
                  >
                    <span>ENTER MAITRI</span>
                    <ArrowRight size={16} />
                  </div>
                </motion.div>

                {/* Card 2: BHARATI — compact selector */}
                <motion.div
                  initial={{ y: 30, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.22, ease: 'easeOut' }}
                  className="teal-station-card"
                  onClick={() => handleStationClick('bharati')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleStationClick('bharati')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Top row: icon + name + status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Radio size={18} style={{ color: 'var(--mist-gray)', opacity: 0.9 }} />
                      <h3
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.75rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          color: '#FFFFFF',
                          margin: 0,
                        }}
                      >
                        BHARATI
                      </h3>
                    </div>
                    <span className="status-badge status-badge-normal" style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.2)', fontSize: '0.65rem' }}>
                      ● ONLINE
                    </span>
                  </div>

                  {/* Location + health */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.73rem', opacity: 0.78 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Compass size={12} />
                      <span>Larsemann Hills · {allStations.bharati.coordinates.lat}, {allStations.bharati.coordinates.long}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={12} />
                      <span>Health {allStations.bharati.stationHealthPct}% · {allStations.bharati.activeAlertCount} alerts</span>
                    </div>
                  </div>

                  {/* Enter CTA */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(224, 229, 233, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      marginTop: '0.15rem',
                    }}
                  >
                    <span>ENTER BHARATI</span>
                    <ArrowRight size={16} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Helper text matching prototype */}
      <div
        style={{
          marginTop: '1.75rem',
          textAlign: 'center',
          color: 'rgba(0, 78, 100, 0.4)',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        Click a station to enter the remote operations control center
      </div>
    </div>
  );
};
