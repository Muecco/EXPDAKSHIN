import React from 'react';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
  dockSlot?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children, dockSlot }) => {
  return (
    <div className="app-shell frost-texture-overlay">
      {/* Background Watermark (Preserving identity from card nav prototype) */}
      <div className="bg-watermark">
        <div className="bg-watermark-text">DAKSHIN</div>
        <div className="bg-watermark-text" style={{ marginTop: '-4vw' }}>DAKSHIN</div>
      </div>

      {/* Top Mission Control Header */}
      <Header />

      {/* Main Viewport */}
      <main className="main-viewport">
        {children}
      </main>

      {/* Operations Dock Rail (Fixed at bottom) */}
      {dockSlot && (
        <div className="dock-rail-container">
          {dockSlot}
        </div>
      )}
    </div>
  );
};
