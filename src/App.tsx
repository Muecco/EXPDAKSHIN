import React, { useState, useEffect } from 'react';
import { StationProvider, useStation } from './context/StationContext';
import { SimulationProvider } from './context/SimulationContext';
import { WelcomePage } from './pages/Welcome/WelcomePage';
import { StationHeader } from './components/shell/StationHeader';
import { MotionDock } from './components/navigation/MotionDock';
import { OverviewPage } from './pages/Overview/OverviewPage';
import { DigitalTwinPanel } from './components/digitalTwin/DigitalTwinPanel';
import { MachineryPage } from './pages/Machinery/MachineryPage';
import { AlertsPage } from './pages/Alerts/AlertsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { SimulationControlDrawer } from './components/simulation/SimulationControlDrawer';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SectionPlaceholder } from './pages/SectionPlaceholder';
import {
  MountainSnow,
  Wrench,
} from 'lucide-react';
import type { StationId } from './types';

const MainApplication: React.FC = () => {
  const { selectedStationId, selectStation, clearStationSelection } = useStation();

  // Internal route state with URL path synchronization
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (['/overview', '/stations', '/digital-twin', '/machinery', '/alerts', '/analytics', '/maintenance', '/settings'].includes(path)) {
        return path;
      }
    }
    return '/overview';
  });

  // Sync route with browser history
  const handleRouteChange = (route: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = route;
      window.history.pushState({}, '', url.toString());
    }
  };

  // Listen to popstate for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (['/overview', '/stations', '/digital-twin', '/machinery', '/alerts', '/analytics', '/maintenance', '/settings'].includes(path)) {
        setCurrentRoute(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // STATE 1 & STATE 2: If no station selected, render Antarctic Welcome & Station Selection flow
  if (!selectedStationId) {
    return (
      <WelcomePage
        onSelectStation={(stationId: StationId) => {
          selectStation(stationId);
          handleRouteChange('/overview');
        }}
      />
    );
  }

  // STATE 3: SELECTED STATION CONTROL CENTER
  return (
    <div className="app-shell frost-texture-overlay">
      {/* Background Watermark Outlined Typography */}
      <div className="bg-watermark">
        <div className="bg-watermark-text">DAKSHIN</div>
        <div className="bg-watermark-text" style={{ marginTop: '-4vw' }}>DAKSHIN</div>
      </div>

      {/* Top Station Header */}
      <StationHeader onBackToWelcome={clearStationSelection} />

      {/* Main Viewport Container */}
      <main className="main-viewport">
        {currentRoute === '/overview' && (
          <OverviewPage onNavigate={handleRouteChange} />
        )}

        {currentRoute === '/stations' && (
          <SectionPlaceholder
            sectionId="stations"
            title="Station Selection"
            subtitle="Switch active telemetry and digital twin between Maitri and Bharati."
            icon={MountainSnow}
            isStationSelector={true}
            onNavigate={handleRouteChange}
          />
        )}

        {currentRoute === '/digital-twin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <DigitalTwinPanel />
          </div>
        )}

        {currentRoute === '/machinery' && (
          <MachineryPage />
        )}

        {currentRoute === '/alerts' && (
          <AlertsPage />
        )}

        {currentRoute === '/analytics' && (
          <AnalyticsPage />
        )}

        {currentRoute === '/maintenance' && (
          <SectionPlaceholder
            sectionId="maintenance"
            title="Maintenance & Operations SOP"
            subtitle="Preventive maintenance schedules, standard operating procedures, asset operating hours, and spare parts inventory."
            icon={Wrench}
            onNavigate={handleRouteChange}
          />
        )}

        {currentRoute === '/settings' && (
          <SettingsPage onNavigate={handleRouteChange} />
        )}
      </main>

      {/* Floating Operations Motion Dock Rail */}
      <div className="dock-rail-container">
        <MotionDock currentRoute={currentRoute} onRouteChange={handleRouteChange} />
      </div>

      {/* Floating Simulation Control Drawer & Lab */}
      <SimulationControlDrawer />
    </div>
  );
};

export function App() {
  return (
    <StationProvider>
      <SimulationProvider>
        <MainApplication />
      </SimulationProvider>
    </StationProvider>
  );
}

export default App;
