import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Box,
  RotateCcw,
  Thermometer,
  Wind,
  ShieldCheck,
  CloudSnow,
  Eye,
  Layers,
  Network,
  Flame,
} from 'lucide-react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import { getStationDigitalTwinData } from '../../services/digitalTwinData';
import type { MachineAssetId, MachineTelemetry } from '../../types/digitalTwin';
import type { WeatherCondition } from '../../types/weather';
import type { UserRole } from '../../types/commands';
import type { OperationalStatus } from '../../types';
import { getDefaultStationWeather, WEATHER_PRESETS } from '../../services/weatherData';
import { AntarcticWeatherSystem } from './weatherSystem';
import { AssetDetailPanel } from './AssetDetailPanel';
import { TwinViewMenu } from './TwinViewMenu';
import { BharatiStation } from './bharati/BharatiStation';
import type { VisionMode, HeatMapMetric, CameraPresetId } from './bharati/types';
import { HEAT_MAP_CONFIGS } from './bharati/HeatMapController';
import { MaitriStation } from './maitri/MaitriStation';
import { getStationLayout } from './station/layouts';
import type { StationLayout, TwinHandle } from './station/types';

interface DigitalTwinPanelProps {
  onSelectAsset?: (asset: MachineTelemetry) => void;
  selectedAssetId?: MachineAssetId | null;
  compact?: boolean;
}

// 3D status → color mapping
function assetStatusColor(statusOrAsset: OperationalStatus | MachineTelemetry): string {
  const status = typeof statusOrAsset === 'string' ? statusOrAsset : statusOrAsset.status;
  if (status === 'CRITICAL' || status === 'FAILED') return '#DC2626';
  if (status === 'WARNING' || status === 'DEGRADING') return '#D97706';
  if (status === 'OFFLINE') return '#64748B';
  if (status === 'UNKNOWN') return '#94A3B8';
  return '#004E64'; // NORMAL — Deep Teal
}

export const DigitalTwinPanel: React.FC<DigitalTwinPanelProps> = ({
  onSelectAsset,
  selectedAssetId: _selectedAssetId,
  compact = false,
}) => {
  const { selectedStation } = useStation();
  const { currentAtmospheric, machineryAssets } = useSimulation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredAsset, setHoveredAsset] = useState<MachineTelemetry | null>(null);
  const [activeAsset, setActiveAsset] = useState<MachineTelemetry | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Digital Twin Vision Modes
  const [visionMode, setVisionMode] = useState<VisionMode>('NORMAL');
  const [heatMapMetric, setHeatMapMetric] = useState<HeatMapMetric>('temperature');

  // Demo role for access-gated UI
  const [userRole, setUserRole] = useState<UserRole>('OPERATOR');

  // Antarctic Weather State
  const [weather, setWeather] = useState<WeatherCondition>(() =>
    getDefaultStationWeather(selectedStation?.id || 'bharati')
  );
  const weatherRef = useRef<WeatherCondition>(weather);
  weatherRef.current = weather;
  /**
   * When the operator picks a manual weather preset the 3D weather stops
   * following the simulation until LIVE is re-enabled.
   */
  const [weatherOverride, setWeatherOverride] = useState(false);

  // Real-time active asset state synced with simulation engine
  const liveActiveAsset = useMemo(() => {
    if (!activeAsset) return null;
    const sim = machineryAssets[activeAsset.asset_id];
    if (!sim) return activeAsset;
    return {
      ...activeAsset,
      status: sim.status,
      temperature: sim.current_temperature,
      vibration: sim.current_vibration,
      current: sim.current_current,
      power: sim.current_power,
      efficiency: sim.current_efficiency,
      fuel: sim.current_fuel,
      failure_risk: sim.risk.score,
      possible_issue: sim.possible_issue,
    } as MachineTelemetry;
  }, [activeAsset, machineryAssets]);

  useEffect(() => {
    if (selectedStation) {
      setWeather(getDefaultStationWeather(selectedStation.id));
      setWeatherOverride(false);
    }
  }, [selectedStation?.id]);

  // Synchronize 3D digital twin atmospheric state with real-time/simulation telemetry
  useEffect(() => {
    if (weatherOverride || !currentAtmospheric) return;
    setWeather((prev) => ({
      ...prev,
      temperature: currentAtmospheric.temperature,
      windSpeed: currentAtmospheric.wind_speed,
      weatherState: currentAtmospheric.weather_state,
      snowIntensity:
        currentAtmospheric.weather_state === 'BLIZZARD' ? 1.0 :
        currentAtmospheric.weather_state === 'HEAVY_SNOW' ? 0.75 :
        currentAtmospheric.weather_state === 'MODERATE_SNOW' ? 0.5 :
        currentAtmospheric.weather_state === 'LIGHT_SNOW' ? 0.25 : 0.05,
      fogDensity:
        currentAtmospheric.weather_state === 'BLIZZARD' ? 0.035 :
        currentAtmospheric.weather_state === 'HEAVY_SNOW' ? 0.02 : 0.005,
    }));
  }, [currentAtmospheric, weatherOverride]);

  // Clear selection when station changes
  useEffect(() => {
    setActiveAsset(null);
    setHoveredAsset(null);
    setTooltipPos(null);
  }, [selectedStation?.id]);

  const stationData = useMemo(() => {
    if (!selectedStation) return null;
    return getStationDigitalTwinData(selectedStation.id);
  }, [selectedStation]);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const assetMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const weatherSystemRef = useRef<AntarcticWeatherSystem | null>(null);
  // Active station twin. MAITRI and BHARATI models are swapped through this one
  // handle, so no code path can mount a station model in the wrong section.
  const twinRef = useRef<TwinHandle | null>(null);
  /** Layout manifest of the active station (null = station keeps its own geometry). */
  const layoutRef = useRef<StationLayout | null>(null);

  // Selection highlight refs
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const activeAssetRef = useRef<MachineTelemetry | null>(null);
  activeAssetRef.current = activeAsset;

  // Handle Vision Mode switches (no scene rebuild, station-agnostic)
  useEffect(() => {
    if (twinRef.current && stationData) {
      twinRef.current.setVisionMode(
        visionMode,
        heatMapMetric,
        stationData.assets,
        currentAtmospheric
      );
    }
  }, [visionMode, heatMapMetric, stationData, currentAtmospheric, selectedStation?.id]);

  // Real-time reactive mesh status updates from simulation without rebuilding scene
  useEffect(() => {
    if (!machineryAssets) return;

    if (twinRef.current) {
      twinRef.current.updateTelemetry(machineryAssets, currentAtmospheric);
    }

    if (assetMeshesRef.current) {
      Object.values(machineryAssets).forEach((asset) => {
        const group = assetMeshesRef.current.get(asset.asset_id);
        if (!group) return;
        const colorHex = assetStatusColor(asset.status);
        const isCritical = asset.status === 'CRITICAL' || asset.status === 'FAILED';
        const isWarn = asset.status === 'WARNING' || asset.status === 'DEGRADING';
        const emissiveIntensity = isCritical ? 0.45 : isWarn ? 0.22 : 0.05;

        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.color.set(colorHex);
              child.material.emissive.set(colorHex);
              child.material.emissiveIntensity = emissiveIntensity;
            } else if (child.material instanceof THREE.MeshBasicMaterial) {
              child.material.color.set(colorHex);
            }
          }
        });
      });
    }
  }, [machineryAssets, currentAtmospheric]);

  // Real-time reactive weather updates from the simulation engine.
  // The telemetry object is mutated in place, so this effect must key on the
  // atmospheric VALUES: keying on the object reference meant the 3D weather
  // initialised once and then never followed the simulation again.
  useEffect(() => {
    if (weatherOverride) return; // manual preset takes precedence
    if (currentAtmospheric) {
      setWeather({
        temperature: currentAtmospheric.temperature,
        windSpeed: currentAtmospheric.wind_speed,
        windDirection: currentAtmospheric.wind_direction,
        windDirectionCardinal: currentAtmospheric.wind_direction_cardinal,
        snowIntensity:
          currentAtmospheric.weather_state === 'CLEAR' ? 0.04 :
          currentAtmospheric.weather_state === 'LIGHT_SNOW' ? 0.25 :
          currentAtmospheric.weather_state === 'HEAVY_SNOW' ? 0.75 :
          currentAtmospheric.weather_state === 'BLIZZARD' ? 1.0 : 0.5,
        weatherState: currentAtmospheric.weather_state,
        visibilityKm:
          currentAtmospheric.weather_state === 'BLIZZARD' ? 1.2 :
          currentAtmospheric.weather_state === 'HEAVY_SNOW' ? 4.8 : 20.0,
      });
    }
  }, [
    currentAtmospheric.temperature,
    currentAtmospheric.wind_speed,
    currentAtmospheric.wind_direction,
    currentAtmospheric.wind_direction_cardinal,
    currentAtmospheric.weather_state,
    weatherOverride,
  ]);

  const setCameraPreset = (preset: CameraPresetId) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Stations that own a layout manifest define their own presets
    const layoutPreset = layoutRef.current?.cameraPresets[preset];
    if (layoutPreset) {
      camera.position.set(
        layoutPreset.position[0],
        layoutPreset.position[1],
        layoutPreset.position[2]
      );
      controls.target.set(layoutPreset.target[0], layoutPreset.target[1], layoutPreset.target[2]);
      controls.update();
      return;
    }

    switch (preset) {
      case 'aerial':
        camera.position.set(18, 14, 20);
        controls.target.set(0, 3.0, 0);
        break;
      case 'front':
        camera.position.set(17, 4.8, 0);
        controls.target.set(0, 3.8, 0);
        break;
      case 'side':
        camera.position.set(0, 4.8, 22);
        controls.target.set(0, 3.8, 0);
        break;
      case 'infra':
        camera.position.set(-11, 5.5, -8);
        controls.target.set(-4.5, 2.5, 0);
        break;
      case 'plan':
        camera.position.set(0, 28, 0.1);
        controls.target.set(0, 0, 0);
        break;
    }
    controls.update();
  };

  // Apply / remove 3D selection highlight
  const applySelectionHighlight = (assetId: string | null) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (selectionRingRef.current) {
      scene.remove(selectionRingRef.current);
      selectionRingRef.current.geometry.dispose();
      (selectionRingRef.current.material as THREE.Material).dispose();
      selectionRingRef.current = null;
    }

    if (twinRef.current) {
      twinRef.current.selectAsset(assetId);
    }

    if (!assetId || !stationData) return;

    const asset = stationData.assets[assetId as MachineAssetId];
    if (!asset) return;

    // The ring follows the station layout manifest when the active station owns
    // one (single source of truth); otherwise the asset data position is used.
    const layoutPosition = layoutRef.current?.assetPositions[assetId as MachineAssetId];
    const ringX = layoutPosition ? layoutPosition[0] : asset.position[0];
    const ringZ = layoutPosition ? layoutPosition[2] : asset.position[2];

    // Animated selection ring
    const ringGeo = new THREE.RingGeometry(1.4, 1.62, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ringX, 0.05, ringZ);
    ring.name = '__selectionRing__';
    scene.add(ring);
    selectionRingRef.current = ring;
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !selectedStation || !stationData) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = compact ? 420 : 580;

    // Station layout manifest — null for stations that keep their own geometry.
    const layout = getStationLayout(selectedStation.id);
    layoutRef.current = layout;
    const skyColor = layout?.environment.skyColor ?? '#C4D4DE';

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, layout?.environment.fogDensity ?? 0.015);

    // 2. Camera — opens on the station's own aerial preset
    const aerialPreset = layout?.cameraPresets.aerial;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 200);
    camera.position.set(
      aerialPreset ? aerialPreset.position[0] : 18,
      aerialPreset ? aerialPreset.position[1] : 14,
      aerialPreset ? aerialPreset.position[2] : 20
    );
    cameraRef.current = camera;    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    const focusTarget = layout?.cameraPresets.aerial.target ?? [0, 3.0, 0];
    controls.target.set(focusTarget[0], focusTarget[1], focusTarget[2]);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = layout?.orbit.minDistance ?? 12;
    controls.maxDistance = layout?.orbit.maxDistance ?? 55;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight('#E8F1F5', 1.25);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFFFFF', 2.2);
    sunLight.position.set(24, 32, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 85;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    scene.add(sunLight);

    const polarBounceLight = new THREE.HemisphereLight('#FFFFFF', '#B8CCD6', 0.75);
    scene.add(polarBounceLight);

    // 6. Ground & Larsemann Hills Terrain
    // Base terrain plane. Its colour comes from the station environment profile
    // so the shared plane blends into each station's own site detailing.
    const groundGeo = new THREE.PlaneGeometry(320, 320, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: layout?.environment.groundColor ?? '#E0E7EC',
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Rocky outcrops characteristic of the Bharati (Larsemann Hills) coastline.
    // Stations that build their own site terrain supply this instead.
    if (!layout) {
      const rockMat = new THREE.MeshStandardMaterial({ color: '#556573', roughness: 0.95 });
      [
        [-14, 0.4, -12, 4.5, 0.8, 4.0],
        [16, 0.6, -14, 5.0, 1.2, 5.0],
        [-12, 0.5, 14, 4.0, 1.0, 4.5],
        [15, 0.4, 15, 6.0, 0.9, 5.5],
      ].forEach(([x, y, z, sx, sy, sz]) => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), rockMat);
        rock.scale.set(sx, sy, sz);
        rock.position.set(x, y, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
      });
    }

    // Weather System
    const weatherSys = new AntarcticWeatherSystem(scene, ground);
    weatherSystemRef.current = weatherSys;

    // Grid
    const grid = new THREE.GridHelper(60, 30, '#004E64', '#B4C5CF');
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    assetMeshesRef.current.clear();

    // 7. Station Architecture Twin
    //    Exactly one station model is created, and only for the station whose
    //    section is active. Bharati keeps its dedicated model class; Maitri gets
    //    its own station-specific model. The two are never interchanged.
    const isBharati = selectedStation.id === 'bharati';
    const twin: TwinHandle = isBharati ? new BharatiStation() : new MaitriStation();
    twin.initializeTelemetry(stationData.assets);
    scene.add(twin.rootGroup);
    twinRef.current = twin;

    // Register asset meshes for raycast selection & reactive status colouring
    const assetGroups = twin.getAssetGroups ? twin.getAssetGroups() : null;
    if (assetGroups) {
      assetGroups.forEach((group, assetId) => {
        assetMeshesRef.current.set(assetId, group);
      });
    }

    // 8. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let foundAsset: MachineTelemetry | null = null;
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          const directId = cur.userData?.assetId || cur.name;
          if (directId && stationData.assets[directId as MachineAssetId]) {
            foundAsset = stationData.assets[directId as MachineAssetId];
            break;
          }
          cur = cur.parent;
        }
        if (foundAsset) break;
      }

      if (foundAsset) {
        setHoveredAsset(foundAsset);
        setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        canvas.style.cursor = 'pointer';
      } else {
        setHoveredAsset(null);
        setTooltipPos(null);
        canvas.style.cursor = 'grab';
      }
    };

    const handlePointerDown = () => { canvas.style.cursor = 'grabbing'; };
    const handlePointerUp = () => { canvas.style.cursor = hoveredAsset ? 'pointer' : 'grab'; };

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          const directId = cur.userData?.assetId || cur.name;
          if (directId && stationData.assets[directId as MachineAssetId]) {
            const asset = stationData.assets[directId as MachineAssetId];
            setActiveAsset(asset);
            applySelectionHighlight(asset.asset_id);
            if (onSelectAsset) onSelectAsset(asset);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('click', handleClick);

    // 9. Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = compact ? 420 : 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      const time = now * 0.001;

      // Update the active station twin (pipelines, beacons, pulses)
      if (twinRef.current) {
        twinRef.current.update(dt, time);
      }

      // Animate selection ring
      if (selectionRingRef.current) {
        const ring = selectionRingRef.current;
        ring.rotation.z = time * 0.8;
        const ringMat = ring.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.6 + Math.sin(time * 3.0) * 0.35;
      }

      // Weather system update
      if (weatherSystemRef.current) {
        weatherSystemRef.current.update(dt, weatherRef.current);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);

      if (selectionRingRef.current) {
        scene.remove(selectionRingRef.current);
        selectionRingRef.current.geometry.dispose();
        (selectionRingRef.current.material as THREE.Material).dispose();
        selectionRingRef.current = null;
      }

      if (twinRef.current) {
        twinRef.current.dispose();
        twinRef.current = null;
      }

      if (weatherSystemRef.current) {
        weatherSystemRef.current.dispose();
        weatherSystemRef.current = null;
      }
      controls.dispose();
      renderer.dispose();
    };
  }, [selectedStation, stationData, compact, onSelectAsset]);

  if (!selectedStation || !stationData) return null;

  const currentHeatMapConfig = HEAT_MAP_CONFIGS[heatMapMetric];
  /**
   * Layout manifest of the active station. Stations that own one drive thermal
   * intensity from live machine temperature (emission), so the metric picker
   * and the metric colourbar do not apply to them.
   */
  const activeLayout = getStationLayout(selectedStation.id);

  return (
    <div
      ref={containerRef}
      className="frost-card"
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        backgroundColor: 'var(--mist-gray)',
        border: '1px solid rgba(0, 78, 100, 0.16)',
        boxShadow: '0 8px 30px rgba(0, 78, 100, 0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP OVERLAY: Station identity, weather, role ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background:
            'linear-gradient(to bottom, rgba(224, 229, 233, 0.96) 0%, rgba(224, 229, 233, 0) 100%)',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Station Identity */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--deep-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 78, 100, 0.25)',
              flexShrink: 0,
            }}
          >
            <Box size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: 'var(--deep-teal)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {selectedStation.name} 3D DIGITAL TWIN
              </h3>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 78, 100, 0.12)',
                  color: 'var(--deep-teal)',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                }}
              >
                ARCHITECTURAL CAD MODEL
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {activeLayout
                ? `${activeLayout.utilityRoutes.length} utility routes · ${activeLayout.thermalSources.length} thermal emitters · simulated telemetry`
                : 'Real-time machinery matrix'}
            </div>
          </div>
        </div>

        {/* Right: Weather Pill + Weather Presets + Role Switcher */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'flex-end',
          }}
        >
          {/* Weather Condition Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              padding: '0.3rem 0.7rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(0, 78, 100, 0.15)',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--deep-teal)',
              boxShadow: '0 2px 6px rgba(0, 78, 100, 0.06)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: weather.weatherState === 'BLIZZARD' ? '#DC2626' : 'var(--deep-teal)',
              }}
            >
              <CloudSnow size={13} />
              <span>{weather.weatherState.replace('_', ' ')}</span>
            </span>
            <span style={{ opacity: 0.25 }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Thermometer size={12} /> {weather.temperature}°C
            </span>
            <span style={{ opacity: 0.25 }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Wind size={12} /> {weather.windSpeed} m/s
            </span>
          </div>

          {/* Consolidated view menu — camera framing, weather presets and the
              demo role live behind one chip so the viewport header stays clean. */}
          <TwinViewMenu
            weatherState={weather.weatherState}
            weatherOverride={weatherOverride}
            onWeatherPreset={(stateKey) => {
              const preset = WEATHER_PRESETS[stateKey];
              setWeatherOverride(true);
              setWeather((prev) => ({ ...prev, ...preset, temperature: prev.temperature }));
            }}
            onWeatherLive={() => setWeatherOverride(false)}
            onCameraPreset={setCameraPreset}
            role={userRole}
            onRoleChange={setUserRole}
          />
        </div>
      </div>

      {/* ── VISION MODE & CAMERA TOOLBAR (Floating below header) ───────────── */}
      <div
        style={{
          position: 'absolute',
          top: '4.8rem',
          left: '1.25rem',
          right: '1.25rem',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          pointerEvents: 'none',
        }}
      >
        {/* Left: 4 Master Vision Modes */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(10px)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 78, 100, 0.2)',
            boxShadow: '0 4px 14px rgba(0, 78, 100, 0.1)',
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', padding: '0 0.4rem' }}>
            VISION:
          </span>

          <button
            onClick={() => setVisionMode('NORMAL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: visionMode === 'NORMAL' ? 'var(--deep-teal)' : 'transparent',
              color: visionMode === 'NORMAL' ? '#FFFFFF' : 'var(--deep-teal)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={13} />
            NORMAL
          </button>

          <button
            onClick={() => setVisionMode('XRAY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: visionMode === 'XRAY' ? '#0284C7' : 'transparent',
              color: visionMode === 'XRAY' ? '#FFFFFF' : 'var(--deep-teal)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={13} />
            X-RAY
          </button>

          <button
            onClick={() => setVisionMode('CONNECTIVITY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: visionMode === 'CONNECTIVITY' ? '#D97706' : 'transparent',
              color: visionMode === 'CONNECTIVITY' ? '#FFFFFF' : 'var(--deep-teal)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Network size={13} />
            PIPELINE
          </button>

          <button
            onClick={() => setVisionMode('HEAT_MAP')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: visionMode === 'HEAT_MAP' ? '#DC2626' : 'transparent',
              color: visionMode === 'HEAT_MAP' ? '#FFFFFF' : 'var(--deep-teal)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Flame size={13} />
            THERMAL
          </button>
        </div>

      </div>

      {/* ── METRIC SUB-SELECTOR — only for stations still using metric tinting.
             Emission-based thermal stations derive intensity from live machine
             telemetry, so no metric picker applies to them. ─────────────────── */}
      {visionMode === 'HEAT_MAP' && !activeLayout && (
        <div
          style={{
            position: 'absolute',
            top: '7.8rem',
            left: '1.25rem',
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.6rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#F8FAFC' }}>
            METRIC:
          </span>
          {[
            { id: 'temperature', label: 'TEMPERATURE (°C)' },
            { id: 'wind', label: 'WIND EXPOSURE' },
            { id: 'power', label: 'POWER DRAW' },
            { id: 'structural', label: 'STRUCTURAL LOAD' },
            { id: 'fuel', label: 'FUEL BUFFER' },
          ].map(({ id, label }) => {
            const isSel = heatMapMetric === id;
            return (
              <button
                key={id}
                onClick={() => setHeatMapMetric(id as HeatMapMetric)}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSel ? '#DC2626' : 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── PIPELINE CONNECTIVITY LEGEND & HELPER BAR ────────────────────────── */}
      {visionMode === 'CONNECTIVITY' && (
        <div
          style={{
            position: 'absolute',
            top: '7.8rem',
            left: '1.25rem',
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            fontSize: '0.68rem',
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#B45309', marginRight: '0.2rem' }}>
            <Network size={13} />
            <span>LEGEND:</span>
          </div>

          {[
            { label: 'HEATING WATER', color: '#EF4444' },
            { label: 'POTABLE WATER', color: '#3B82F6' },
            { label: 'WASTEWATER', color: '#10B981' },
            { label: 'FUEL', color: '#EAB308' },
            { label: 'AIR / HVAC', color: '#06B6D4' },
            { label: 'ELECTRICAL', color: '#F97316' },
          ].map((item) => (
            <span
              key={item.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: 'var(--slate-800)',
                backgroundColor: 'rgba(241, 245, 249, 0.95)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${item.color}55`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  boxShadow: `0 0 4px ${item.color}`,
                }}
              />
              {item.label}
            </span>
          ))}

          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem', fontSize: '0.65rem' }}>
            · Click machine to isolate
          </span>
        </div>
      )}

      {/* ── 3D CANVAS ────────────────────────────────────────────────────── */}
      <div style={{ width: '100%', height: compact ? '420px' : '580px', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Hover tooltip */}
        {hoveredAsset && tooltipPos && !activeAsset && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltipPos.x + 16}px`,
              top: `${tooltipPos.y - 12}px`,
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 78, 100, 0.2)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0, 78, 100, 0.2)',
              padding: '0.75rem 1rem',
              zIndex: 30,
              pointerEvents: 'none',
              minWidth: '200px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--deep-teal)' }}>
                {hoveredAsset.asset_id}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    hoveredAsset.status === 'CRITICAL' ? 'rgba(220, 38, 38, 0.12)' :
                    hoveredAsset.status === 'WARNING' ? 'rgba(217, 119, 6, 0.12)' :
                    'rgba(0, 78, 100, 0.1)',
                  color:
                    hoveredAsset.status === 'CRITICAL' ? '#DC2626' :
                    hoveredAsset.status === 'WARNING' ? '#D97706' :
                    'var(--deep-teal)',
                }}
              >
                {hoveredAsset.status}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {hoveredAsset.name}
            </div>
            <div style={{ fontSize: '0.7rem', display: 'flex', gap: '0.6rem', color: 'var(--text-secondary)' }}>
              <span>Temp: <strong>{hoveredAsset.temperature}°C</strong></span>
              <span>Power: <strong>{hoveredAsset.power} kW</strong></span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Click to open detailed telemetry &amp; controls →
            </div>
          </div>
        )}

        {/* Floating metric colourbar — emission-based thermal stations use the
            thermal radiation field itself as the visual legend. */}
        {visionMode === 'HEAT_MAP' && !activeLayout && (
          <div
            style={{
              position: 'absolute',
              bottom: '4.5rem',
              left: '1.5rem',
              zIndex: 20,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '0.75rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              color: '#FFFFFF',
              maxWidth: '360px',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', marginBottom: '0.4rem', color: '#93C5FD' }}>
              {currentHeatMapConfig.label}
            </div>
            {/* Gradient bar */}
            <div
              style={{
                height: '10px',
                borderRadius: '5px',
                marginBottom: '0.35rem',
                background: `linear-gradient(to right, ${currentHeatMapConfig.gradient.map((g) => g.color).join(', ')})`,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1' }}>
              <span>{currentHeatMapConfig.min} {currentHeatMapConfig.unit}</span>
              <span>{currentHeatMapConfig.max} {currentHeatMapConfig.unit}</span>
            </div>
          </div>
        )}

        {/* Asset Detail Panel */}
        {liveActiveAsset && (
          <AssetDetailPanel
            asset={liveActiveAsset}
            userRole={userRole}
            onClose={() => {
              setActiveAsset(null);
              applySelectionHighlight(null);
            }}
          />
        )}
      </div>

      {/* ── BOTTOM OVERLAY ───────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(to top, rgba(224, 229, 233, 0.96) 0%, rgba(224, 229, 233, 0) 100%)',
          pointerEvents: 'none',
        }}
      >
        {/* Legend */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(0, 78, 100, 0.12)',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {[
            { label: 'NORMAL', color: 'var(--deep-teal)' },
            { label: 'WARNING', color: '#D97706' },
            { label: 'CRITICAL', color: '#DC2626' },
            { label: 'OFFLINE', color: '#64748B' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              {label}
            </span>
          ))}
        </div>

        {/* Controls hint */}
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color: 'var(--deep-teal)',
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <RotateCcw size={12} /> Drag to orbit · scroll to zoom · click machinery to inspect
        </div>

        {/* Station Health */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(0, 78, 100, 0.15)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <ShieldCheck size={15} style={{ color: 'var(--status-normal)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--deep-teal)', textTransform: 'uppercase' }}>
            Station Health:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.88rem', color: 'var(--status-normal)' }}>
            {stationData.calculated_health_pct}%
          </span>
        </div>
      </div>
    </div>
  );
};
