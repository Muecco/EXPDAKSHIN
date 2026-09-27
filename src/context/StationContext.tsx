import React, { createContext, useContext, useState, useEffect } from 'react';
import type { StationId, StationConfig, ConnectionStatus } from '../types';

interface StationContextType {
  selectedStationId: StationId | null;
  selectedStation: StationConfig | null;
  allStations: Record<StationId, StationConfig>;
  connectionStatus: ConnectionStatus;
  selectStation: (id: StationId) => void;
  clearStationSelection: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  localStationTime: string;
}

const DEFAULT_STATIONS: Record<StationId, StationConfig> = {
  maitri: {
    id: 'maitri',
    name: 'MAITRI',
    fullName: 'MAITRI RESEARCH STATION',
    configuredLocation: 'Schirmacher Oasis, Queen Maud Land, Antarctica',
    coordinates: {
      lat: '70°45′57″ S',
      long: '11°44′09″ E',
    },
    elevationMeters: 117,
    establishedYear: 1989,
    timezoneOffset: 5,
    connectionStatus: 'ONLINE',
    lastSyncTimestamp: new Date().toISOString(),
    stationHealthPct: 92,
    activeAlertCount: 2,
    outsideTempCelsius: -28.4,
    windSpeedMps: 14.2,
  },
  bharati: {
    id: 'bharati',
    name: 'BHARATI',
    fullName: 'BHARATI RESEARCH STATION',
    configuredLocation: 'Larsemann Hills, East Antarctica',
    coordinates: {
      lat: '69°24′28″ S',
      long: '76°11′14″ E',
    },
    elevationMeters: 35,
    establishedYear: 2012,
    timezoneOffset: 5,
    connectionStatus: 'ONLINE',
    lastSyncTimestamp: new Date().toISOString(),
    stationHealthPct: 87,
    activeAlertCount: 3,
    outsideTempCelsius: -31.8,
    windSpeedMps: 18.0,
  },
};

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL query parameters for ?station=maitri or ?station=bharati
  const [selectedStationId, setSelectedStationId] = useState<StationId | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('station');
      if (s === 'maitri' || s === 'bharati') {
        return s as StationId;
      }
    }
    return null; // Initial state MUST be null per rule #16
  });

  const [stations] = useState<Record<StationId, StationConfig>>(DEFAULT_STATIONS);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('ONLINE');
  const [localStationTime, setLocalStationTime] = useState<string>('');

  const selectedStation = selectedStationId ? stations[selectedStationId] : null;

  // Update real-time Station Local Clock
  useEffect(() => {
    const tzOffset = selectedStation ? selectedStation.timezoneOffset : 5;
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const stationTime = new Date(utc + 3600000 * tzOffset);

      const timeStr = stationTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = stationTime.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      setLocalStationTime(`${timeStr} UTC+${tzOffset} (${dateStr})`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [selectedStation]);

  const selectStation = (id: StationId) => {
    setSelectedStationId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('station', id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const clearStationSelection = () => {
    setSelectedStationId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('station');
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <StationContext.Provider
      value={{
        selectedStationId,
        selectedStation,
        allStations: stations,
        connectionStatus,
        selectStation,
        clearStationSelection,
        setConnectionStatus,
        localStationTime,
      }}
    >
      {children}
    </StationContext.Provider>
  );
};

export const useStation = (): StationContextType => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
};
