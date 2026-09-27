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
} from 'lucide-react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import { getStationDigitalTwinData } from '../../services/digitalTwinData';
import type { MachineAssetId, MachineTelemetry } from '../../types/digitalTwin';
import type { WeatherCondition, WeatherState } from '../../types/weather';
import type { UserRole } from '../../types/commands';
import type { OperationalStatus } from '../../types';
import { getDefaultStationWeather, WEATHER_PRESETS } from '../../services/weatherData';
import { AntarcticWeatherSystem } from './weatherSystem';
import { AssetDetailPanel } from './AssetDetailPanel';
import { RoleSwitcher } from './RoleSwitcher';

interface DigitalTwinPanelProps {
  onSelectAsset?: (asset: MachineTelemetry) => void;
  selectedAssetId?: MachineAssetId | null;
  compact?: boolean;
}

// 3D status → color mapping (single source of truth)
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

  // Demo role for access-gated UI (frontend only)
  const [userRole, setUserRole] = useState<UserRole>('OPERATOR');

  // Frontend-only Antarctic Weather State
  const [weather, setWeather] = useState<WeatherCondition>(() =>
    getDefaultStationWeather(selectedStation?.id || 'maitri')
  );
  const weatherRef = useRef<WeatherCondition>(weather);
  weatherRef.current = weather;

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
    }
  }, [selectedStation?.id]);

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

  // Selection highlight refs — store the selection ring mesh per asset
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const activeAssetRef = useRef<MachineTelemetry | null>(null);
  activeAssetRef.current = activeAsset;

  // Real-time reactive mesh status updates from simulation without rebuilding scene
  useEffect(() => {
    if (!assetMeshesRef.current || !machineryAssets) return;
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
  }, [machineryAssets]);

  // Real-time reactive weather updates from simulation
  useEffect(() => {
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
  }, [currentAtmospheric]);

  const setCameraPreset = (preset: 'iso' | 'top' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    switch (preset) {
      case 'iso':
        camera.position.set(16, 12, 18);
        controls.target.set(0, 1.5, 0);
        break;
      case 'top':
        camera.position.set(0, 26, 0.1);
        controls.target.set(0, 0, 0);
        break;
      case 'side':
        camera.position.set(0, 4, 22);
        controls.target.set(0, 1.5, 0);
        break;
    }
    controls.update();
  };

  // Apply / remove 3D selection highlight
  const applySelectionHighlight = (assetId: string | null) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old highlight ring
    if (selectionRingRef.current) {
      scene.remove(selectionRingRef.current);
      selectionRingRef.current.geometry.dispose();
      (selectionRingRef.current.material as THREE.Material).dispose();
      selectionRingRef.current = null;
    }

    if (!assetId || !stationData) return;

    const group = assetMeshesRef.current.get(assetId);
    if (!group) return;

    const asset = stationData.assets[assetId as MachineAssetId];
    if (!asset) return;

    // Animated selection ring — slightly larger than the existing base ring
    const ringGeo = new THREE.RingGeometry(1.35, 1.55, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(asset.position[0], 0.03, asset.position[2]);
    ring.name = '__selectionRing__';
    scene.add(ring);
    selectionRingRef.current = ring;
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !selectedStation || !stationData) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = compact ? 380 : 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#C4D4DE');
    scene.fog = new THREE.FogExp2('#C4D4DE', 0.016);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 120);
    camera.position.set(16, 12, 18);
    cameraRef.current = camera;

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
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.5, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 6;
    controls.maxDistance = 45;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight('#E8F1F5', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFFFFF', 2.0);
    sunLight.position.set(22, 28, 16);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);

    const polarBounceLight = new THREE.HemisphereLight('#FFFFFF', '#B8CCD6', 0.7);
    scene.add(polarBounceLight);

    // 6. Ground
    const groundGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#E0E7EC',
      roughness: 0.85,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Weather System
    const weatherSys = new AntarcticWeatherSystem(scene, ground);
    weatherSystemRef.current = weatherSys;

    // Grid
    const grid = new THREE.GridHelper(50, 25, '#004E64', '#B4C5CF');
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // 7. Station Architecture
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    assetMeshesRef.current.clear();

    const isMaitri = selectedStation.id === 'maitri';

    const structureMat = new THREE.MeshStandardMaterial({
      color: isMaitri ? '#004E64' : '#F4F7F9',
      roughness: 0.35,
      metalness: 0.2,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#003645', roughness: 0.4 });
    const steelStiltMat = new THREE.MeshStandardMaterial({
      color: '#4A5B66',
      roughness: 0.6,
      metalness: 0.8,
    });

    if (isMaitri) {
      const hub = new THREE.Mesh(new THREE.BoxGeometry(7, 2.4, 4.5), structureMat);
      hub.position.set(0, 1.2, 0);
      hub.castShadow = true;
      hub.receiveShadow = true;
      stationGroup.add(hub);

      const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, 4.7), trimMat);
      roofTrim.position.set(0, 2.45, 0);
      roofTrim.castShadow = true;
      stationGroup.add(roofTrim);

      const eastWing = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 3.5), structureMat);
      eastWing.position.set(5.5, 1.1, 0.5);
      eastWing.castShadow = true;
      stationGroup.add(eastWing);

      const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.8, 16), steelStiltMat);
      tunnel.rotation.z = Math.PI / 2;
      tunnel.position.set(3.4, 1.1, 0.3);
      tunnel.castShadow = true;
      stationGroup.add(tunnel);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 6, 8), steelStiltMat);
      mast.position.set(2.5, 5, -1.5);
      mast.castShadow = true;
      stationGroup.add(mast);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2 })
      );
      dome.position.set(-2, 2.8, 0);
      dome.castShadow = true;
      stationGroup.add(dome);
    } else {
      const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(9.5, 2.6, 5), structureMat);
      mainBlock.position.set(0, 2.7, 0);
      mainBlock.castShadow = true;
      mainBlock.receiveShadow = true;
      stationGroup.add(mainBlock);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.2, 4), structureMat);
      nose.rotation.z = -Math.PI / 2;
      nose.rotation.y = Math.PI / 4;
      nose.position.set(5.8, 2.7, 0);
      nose.castShadow = true;
      stationGroup.add(nose);

      const stiltPositions: [number, number, number][] = [
        [-3.8, 1.0, -1.8], [-3.8, 1.0, 1.8],
        [0, 1.0, -1.8],    [0, 1.0, 1.8],
        [3.8, 1.0, -1.8],  [3.8, 1.0, 1.8],
      ];
      stiltPositions.forEach(([x, y, z]) => {
        const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.0, 12), steelStiltMat);
        stilt.position.set(x, y, z);
        stilt.castShadow = true;
        stationGroup.add(stilt);
      });

      const helideck = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.15, 24), trimMat);
      helideck.position.set(-2.5, 4.1, 0);
      helideck.castShadow = true;
      stationGroup.add(helideck);

      const commTower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 7.5, 8), steelStiltMat);
      commTower.position.set(3.2, 6.2, -1.2);
      commTower.castShadow = true;
      stationGroup.add(commTower);
    }

    // 8. Machinery Assets
    Object.values(stationData.assets).forEach((asset) => {
      const assetGroup = new THREE.Group();
      assetGroup.name = asset.asset_id;
      assetGroup.position.set(asset.position[0], asset.position[1], asset.position[2]);

      const baseColor = assetStatusColor(asset);

      let geom: THREE.BufferGeometry;
      if (asset.asset_type === 'generator') {
        geom = new THREE.BoxGeometry(1.4, 1.2, 1.8);
      } else if (asset.asset_type === 'fuel_system') {
        geom = new THREE.CylinderGeometry(1.0, 1.0, 2.2, 24);
      } else if (asset.asset_type === 'pump') {
        geom = new THREE.CylinderGeometry(0.5, 0.65, 1.2, 16);
      } else if (asset.asset_type === 'battery') {
        geom = new THREE.BoxGeometry(1.2, 1.0, 1.2);
      } else {
        geom = new THREE.BoxGeometry(1.1, 1.1, 1.1);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.35,
        metalness: 0.4,
        emissive: baseColor,
        emissiveIntensity: asset.status === 'CRITICAL' ? 0.35 : 0.05,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { assetId: asset.asset_id };
      assetGroup.add(mesh);

      // Base telemetry ring
      const ringGeo = new THREE.RingGeometry(1.1, 1.25, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -asset.position[1] + 0.02;
      assetGroup.add(ring);

      scene.add(assetGroup);
      assetMeshesRef.current.set(asset.asset_id, assetGroup);
    });

    // 9. Raycasting
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
          if (cur.name && stationData.assets[cur.name as MachineAssetId]) {
            foundAsset = stationData.assets[cur.name as MachineAssetId];
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
          if (cur.name && stationData.assets[cur.name as MachineAssetId]) {
            const asset = stationData.assets[cur.name as MachineAssetId];
            setActiveAsset(asset);
            applySelectionHighlight(asset.asset_id);
            if (onSelectAsset) onSelectAsset(asset);
            return;
          }
          cur = cur.parent;
        }
      }
      // Click on empty space — clear selection
      // (Don't clear here — let user close via X in panel)
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('click', handleClick);

    // 10. Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = compact ? 380 : 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Animation loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      // Pulse critical machines
      const time = Date.now() * 0.003;
      assetMeshesRef.current.forEach((group, assetId) => {
        const asset = stationData.assets[assetId as MachineAssetId];
        if (asset && (asset.status === 'CRITICAL' || asset.status === 'FAILED')) {
          const scale = 1.0 + Math.sin(time) * 0.04;
          group.scale.set(scale, scale, scale);
        }
      });

      // Animate selection ring (subtle pulse + slow rotation)
      if (selectionRingRef.current) {
        const ring = selectionRingRef.current;
        ring.rotation.z = time * 0.4;
        const ringMat = ring.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.6 + Math.sin(time * 2.5) * 0.3;
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

      // Clean up selection ring
      if (selectionRingRef.current) {
        scene.remove(selectionRingRef.current);
        selectionRingRef.current.geometry.dispose();
        (selectionRingRef.current.material as THREE.Material).dispose();
        selectionRingRef.current = null;
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
      {/* ── TOP OVERLAY ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background:
            'linear-gradient(to bottom, rgba(224, 229, 233, 0.95) 0%, rgba(224, 229, 233, 0) 100%)',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Station Identity */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
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
            <Box size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
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
                  fontSize: '0.65rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 78, 100, 0.1)',
                  color: 'var(--deep-teal)',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                }}
              >
                LIVE SYNCHRONIZATION
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              High-fidelity structural layout &amp; synthetic machinery matrix
            </div>
          </div>
        </div>

        {/* Right: Weather + Weather Presets + Camera + Role Switcher */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem',
            justifyContent: 'flex-end',
          }}
        >
          {/* Weather Condition Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '0.35rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(0, 78, 100, 0.15)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--deep-teal)',
              boxShadow: '0 2px 6px rgba(0, 78, 100, 0.06)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: weather.weatherState === 'BLIZZARD' ? '#DC2626' : 'var(--deep-teal)',
              }}
            >
              <CloudSnow size={14} />
              <span>{weather.weatherState.replace('_', ' ')}</span>
            </span>
            <span style={{ opacity: 0.25 }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Thermometer size={13} /> {weather.temperature}°C
            </span>
            <span style={{ opacity: 0.25 }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Wind size={13} /> {weather.windSpeed} m/s {weather.windDirectionCardinal} ({weather.windDirection}°)
            </span>
          </div>

          {/* Weather Preset Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 78, 100, 0.15)',
              boxShadow: '0 2px 6px rgba(0, 78, 100, 0.05)',
            }}
            title="Antarctic Weather Simulation Preset"
          >
            {(['CLEAR', 'LIGHT_SNOW', 'MODERATE_SNOW', 'HEAVY_SNOW', 'BLIZZARD'] as WeatherState[]).map(
              (stateKey) => {
                const isActive = weather.weatherState === stateKey;
                const shortLabel =
                  stateKey === 'CLEAR' ? 'CLEAR' :
                  stateKey === 'LIGHT_SNOW' ? 'LIGHT' :
                  stateKey === 'MODERATE_SNOW' ? 'MOD' :
                  stateKey === 'HEAVY_SNOW' ? 'HEAVY' : 'BLIZZARD';

                return (
                  <button
                    key={stateKey}
                    onClick={() => {
                      const preset = WEATHER_PRESETS[stateKey];
                      setWeather((prev) => ({ ...prev, ...preset, temperature: prev.temperature }));
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'var(--deep-teal)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--deep-teal)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: 'none',
                    }}
                  >
                    {shortLabel}
                  </button>
                );
              }
            )}
          </div>

          {/* Camera Presets */}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 78, 100, 0.12)',
            }}
          >
            {(['iso', 'top', 'side'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setCameraPreset(preset)}
                title={preset === 'iso' ? 'Isometric' : preset === 'top' ? 'Plan View' : 'Elevation View'}
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--deep-teal)',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                }}
              >
                {preset.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Demo Role Switcher */}
          <RoleSwitcher currentRole={userRole} onChange={setUserRole} />
        </div>
      </div>

      {/* ── 3D CANVAS ────────────────────────────────────────────────────── */}
      <div style={{ width: '100%', height: compact ? '380px' : '520px', position: 'relative' }}>
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
              minWidth: '180px',
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
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {hoveredAsset.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Click to open asset detail →
            </div>
          </div>
        )}

        {/* Asset Detail Panel — slides in from the right over the 3D canvas */}
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
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(to top, rgba(224, 229, 233, 0.95) 0%, rgba(224, 229, 233, 0) 100%)',
          pointerEvents: 'none',
        }}
      >
        {/* Legend */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(0, 78, 100, 0.12)',
            fontSize: '0.72rem',
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
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--deep-teal)',
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <RotateCcw size={12} /> Rotate: Left-Click + Drag | Zoom: Scroll | Click asset to inspect
        </div>

        {/* Station Health */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(0, 78, 100, 0.15)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--status-normal)' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-teal)', textTransform: 'uppercase' }}>
            Station Health:
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--status-normal)' }}>
            {stationData.calculated_health_pct}%
          </span>
        </div>
      </div>
    </div>
  );
};
