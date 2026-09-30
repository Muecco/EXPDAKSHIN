import React, { useRef, useEffect } from 'react';
import { CardNav } from '../../components/navigation/CardNav';
import type { StationId } from '../../types';

interface WelcomePageProps {
  onSelectStation: (stationId: StationId) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onSelectStation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Responsive check: disable cursor-following reveal & HUD on touch/mobile devices
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth <= 768;
    if (isTouch) return;

    const container = containerRef.current;
    const reveal = revealRef.current;
    const hud = hudRef.current;
    if (!container || !reveal || !hud) return;

    let rafId: number | null = null;
    let targetX = -9999;
    let targetY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let targetClientX = -9999;
    let targetClientY = -9999;
    let currentClientX = -9999;
    let currentClientY = -9999;
    let isInside = false;

    const updateLoop = () => {
      if (!isInside) {
        rafId = null;
        return;
      }

      // Smooth lerp (linear interpolation) for organic, fluid motion
      const factor = 0.16;
      if (currentX === -9999) {
        currentX = targetX;
        currentY = targetY;
        currentClientX = targetClientX;
        currentClientY = targetClientY;
      } else {
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        const dcx = targetClientX - currentClientX;
        const dcy = targetClientY - currentClientY;

        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dcx) < 0.1 && Math.abs(dcy) < 0.1) {
          currentX = targetX;
          currentY = targetY;
          currentClientX = targetClientX;
          currentClientY = targetClientY;
          reveal.style.setProperty('--reveal-x', `${currentX.toFixed(1)}px`);
          reveal.style.setProperty('--reveal-y', `${currentY.toFixed(1)}px`);
          hud.style.transform = `translate3d(${currentClientX.toFixed(1)}px, ${currentClientY.toFixed(1)}px, 0)`;
          rafId = null;
          return;
        }

        currentX += dx * factor;
        currentY += dy * factor;
        currentClientX += dcx * factor;
        currentClientY += dcy * factor;
      }

      reveal.style.setProperty('--reveal-x', `${currentX.toFixed(1)}px`);
      reveal.style.setProperty('--reveal-y', `${currentY.toFixed(1)}px`);
      hud.style.transform = `translate3d(${currentClientX.toFixed(1)}px, ${currentClientY.toFixed(1)}px, 0)`;

      rafId = requestAnimationFrame(updateLoop);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      targetClientX = e.clientX;
      targetClientY = e.clientY;

      if (!isInside) {
        isInside = true;
        reveal.classList.add('is-active');
        hud.classList.add('is-active');
      }
      if (!rafId) {
        rafId = requestAnimationFrame(updateLoop);
      }
    };

    const handlePointerLeave = () => {
      isInside = false;
      reveal.classList.remove('is-active');
      hud.classList.remove('is-active');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('mouseleave', handlePointerLeave);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--mist-gray)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '3rem 1.5rem 6rem 1.5rem',
        overflowX: 'hidden',
      }}
      className="frost-texture-overlay"
    >
      {/* LAYER 1: New Authentic Daytime Bharati Research Station Photographic Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/bharati_station_new.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 0.85,
          filter: 'contrast(105%) brightness(1.02) saturate(1.05)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* LAYER 2: Moving "DAKSHIN" Typography Marquee (Continuous Left-to-Right Loop) */}
      <div className="landing-watermark-container">
        {/* Row 1: Left-to-Right continuous drift */}
        <div className="landing-watermark-row">
          <div className="landing-watermark-track track-right">
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
          </div>
          <div className="landing-watermark-track track-right" aria-hidden="true">
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
          </div>
        </div>

        {/* Row 2: Left-to-Right offset drift */}
        <div className="landing-watermark-row" style={{ marginTop: '-2vw' }}>
          <div className="landing-watermark-track track-right-slow">
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
          </div>
          <div className="landing-watermark-track track-right-slow" aria-hidden="true">
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
            <span>DAKSHIN</span>
          </div>
        </div>
      </div>

      {/* LAYER 3: Soft Mist & Atmospheric Contrast Blending */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 95% 75% at 50% 40%, rgba(224, 229, 233, 0.12) 0%, rgba(224, 229, 233, 0.45) 55%, rgba(224, 229, 233, 0.88) 100%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* LAYER 4: High-Definition Station Spotlight Reveal Layer */}
      <div
        ref={revealRef}
        className="landing-station-reveal"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/bharati_station_new.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* Ghost Cursor HUD (Top Layer - Pointer Events None) */}
      <div
        ref={hudRef}
        className="landing-cursor-hud"
        aria-hidden="true"
      >
        <div className="hud-reticle">
          <div className="hud-crosshair" />
        </div>
      </div>

      {/* LAYER 10: Existing Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Welcome Section Header */}
        <header
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            marginTop: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 78, 100, 0.08)',
              border: '1px solid rgba(0, 78, 100, 0.18)',
              color: 'var(--deep-teal)',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--deep-teal)',
              }}
            />
            MISSION CONTROL // PC2 DIGITAL TWIN
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'var(--deep-teal)',
              margin: '0 0 1rem 0',
            }}
          >
            DAKSHIN
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--deep-teal)',
              opacity: 0.85,
              marginBottom: '0.75rem',
            }}
          >
            ANTARCTIC OPERATIONS REMOTE CONTROL CENTER
          </div>

          <p
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Remote monitoring, scientific instrumentation, and digital twin management for Indian Antarctic Research Stations.
          </p>
        </header>

        {/* State 2: Station Selection using the authoritative Card Nav */}
        <div style={{ width: '100%' }}>
          <CardNav initiallyOpen={false} onSelectStation={onSelectStation} />
        </div>
      </div>
    </div>
  );
};
