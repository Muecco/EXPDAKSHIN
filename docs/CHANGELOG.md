# DAKSHIN CHANGELOG

All notable changes to the Dakshin Remote Operations Control Center (PC2) are documented in this file.

---

## [Atmospheric Analytics Overhaul: Independent Datasets & Physics-Based Synoptic Continuous Series] — 2026-09-21

### Fixed & Resolved
- **Eliminated Repetitive Stair-Step Artifacts**: Replaced static sinusoidal formula with a continuous AR-1 Gaussian-Markov synoptic state engine. Wind direction, velocity, temperature, and pressure now transition continuously across realistic weather fronts (cyclones, katabatic blasts, cold anticyclones).
- **Separated MAITRI and BHARATI Datasets**:
  - Independent 90-day continuous hourly archives (2,160 observations each) with distinct geographic and meteorological signatures.
  - **MAITRI**: Schirmacher Oasis continental katabatic plateau regime with dominant ESE katabatic winds (105°–135°), extreme inland cold (down to -45.1°C), and mean pressure of 983.6 hPa.
  - **BHARATI**: Larsemann Hills marine coastal boundary regime with coastal cyclonic blizzards, wind shifts to NE/ENE (45°–85°), maritime advection moderation, and deep pressure troughs down to 954 hPa.
- **Fixed Station Binding in Simulation Context**: Updated `fetchAtmosphericHistory` in `SimulationContext.tsx` to accept an explicit `stationId` override, allowing the Analytics page to query any station without being bound to the global active station.
- **True Circular Statistics for Wind Direction**: Implemented directional circular trigonometry ($\operatorname{atan2}(\sum\sin, \sum\cos)$) across all time range aggregations and trend calculations (`veering` vs `backing` vs `stable`).
- **Station Comparison Mode**: Implemented side-by-side station overlay in `AnalyticsPage.tsx` with simultaneous dual curves (solid active line + dashed comparison line), dual interactive tooltips, and side-by-side KPI values.

---

## [Local/Synthetic Simulation Mode & Telemetry Provider Architecture] — 2026-09-21

### Added
- **`src/services/telemetry/telemetryContracts.ts`**: Standardized, production-ready telemetry data contracts:
  - `AtmosphericTelemetry` & `AtmosphericDataPoint`
  - `MachineryBaseline`, `MachineryDeviation`, and `MachineryTelemetryWithBaseline`
  - `RiskBreakdown` (explainable 4-factor breakdown: Thermal, Vibration, Current, Efficiency)
  - `CouplingChainState` (thermodynamic 5-stage chain)
  - `SimulationAlert` & `TimelineEvent`
  - `ITelemetryProvider` decoupled interface allowing seamless hot-swap between `SimulationEngine` and future `MqttWebSocketProvider`.
- **`src/services/telemetry/machineryBaselines.ts`**: Calibrated baseline parameters and operational thresholds for all 7 assets (`GEN-01`, `GEN-02`, `BAT-01`, `FUEL-01`, `PUMP-01`, `HEATER-01`, `ENV-01`).
- **`src/services/telemetry/riskModel.ts`**: Deterministic explainable risk engine with transparent factor weighting ($30\%$ thermal excess, $30\%$ vibration delta, $20\%$ current overload, $20\%$ efficiency deficit).
- **`src/services/telemetry/atmosphericHistoryData.ts`**: Authentic 90-day historical meteorological dataset for Maitri & Bharati based on Indian Meteorological Department (IMD) Antarctic records, with multi-resolution aggregation (24H hourly, 7D 3-hour downsampled, 1M/3M daily averaged) and trend stats calculator.
- **`src/services/telemetry/simulationEngine.ts`**: Central deterministic singleton simulation engine running continuous physics variations, thermodynamic coupling calculations, scenario injections, threshold alert evaluation, and event stream logging.
- **`src/context/SimulationContext.tsx`**: React Context and `useSimulation()` hook providing reactive telemetry, scenario activation, alert acknowledgment, and history fetching to all components.
- **`src/components/simulation/SimulationControlDrawer.tsx`**: Floating Antarctic slide-out simulation laboratory:
  - Categorized deterministic scenarios (Atmospheric, Machinery, Combined/Cascading)
  - 20-Step Guided Demonstration Walkthrough with auto-play and step-by-step guidance
  - Remote link state simulation (`LOCAL SIMULATION ACTIVE` vs `REMOTE LINK OFFLINE`)
  - Live chronological event timeline stream.
- **`src/pages/Machinery/MachineryPage.tsx`**: Dedicated machinery telemetry diagnostics page for `/machinery` route:
  - Status filters, asset selection strip
  - Baseline vs Current comparison table with exact deviations ($\pm \Delta$)
  - Explainable failure risk breakdown and contributing factor analysis.
- **`src/pages/Alerts/AlertsPage.tsx`**: Dedicated incident response center for `/alerts` route:
  - Active incidents and unaddressed counter
  - Severity filtering (`ALL`, `CRITICAL`, `WARNING`, `INFO`)
  - Station operational index and remote link status
  - Antarctic emergency SOP recommendations (`SOP-VIB-01`, `SOP-COOL-03`, `SOP-ENV-01`, etc.)
  - Operator alert acknowledgment and chronological event stream.
- **`src/pages/Analytics/AnalyticsPage.tsx`**: Dedicated analytics and historical trends page for `/analytics` route:
  - Interactive SVG multi-resolution line chart with crosshair tooltips
  - Station switcher (Maitri / Bharati) and time range filters (24H, 7D, 1M, 3M, Custom)
  - Atmospheric variable toggles (Temperature, Wind Velocity, Atmospheric Pressure, Relative Humidity, Wind Vector)
  - Statistical summary cards and 5-stage thermodynamic coupling breakdown.

### Enhanced
- **`src/components/shell/StationHeader.tsx`**: Added prominent `SIMULATION MODE` badge, active scenario pill, live atmospheric telemetry indicators, and distinct status pills for `LOCAL SIMULATION ACTIVE` and `REMOTE LINK OFFLINE`.
- **`src/components/digitalTwin/AssetDetailPanel.tsx`**: Augmented with Baseline vs Current comparison table, explainable risk bars, contributing factor bullets, and engineering provenance notices.
- **`src/components/digitalTwin/DigitalTwinPanel.tsx`**: Reactive 3D mesh material color and emissive highlights on simulation ticks without recreating WebGL scenes, synced with `useSimulation()` weather state.
- **`src/pages/Overview/OverviewPage.tsx`**: Connected to live simulation state; added 5-stage physical coupling chain and scenario quick-triggers.
- **`src/App.tsx`**: Wrapped application tree in `<SimulationProvider>`, wired `/machinery`, `/alerts`, and `/analytics` routes to dedicated pages, and mounted `<SimulationControlDrawer />`.

---

## [Netlify Deployment Readiness] — 2026-09-20

### Added
- **`netlify.toml`**: Root configuration for Netlify build engine:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Node version: `20`
  - SPA client-side routing fallback rule: `/*` → `/index.html` (status 200)
  - Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  - Cache-Control headers for immutable static assets in `/assets/*` (`max-age=31536000, immutable`)
- **`public/_redirects`**: Vite-copied SPA redirect rule (`/* /index.html 200`) so manual drag-and-drop deployments (Netlify Drop) also resolve all client-side routes without 404s.
- **`.nvmrc`**: Pins Node version to `20` for automated build systems.

### Fixed
- **TypeScript strict compiler errors during `npm run build` (`tsc -b && vite build`)**:
  - `src/components/digitalTwin/AssetDetailPanel.tsx`: Removed unused `Wind` and `ShieldAlert` imports, removed unused `statusColor` helper.
  - `src/pages/Overview/OverviewPage.tsx`: Removed unused `Activity` import; marked `onNavigate` prop as handled (`void onNavigate;`) to prevent `noUnusedParameters` failure while maintaining component interface compatibility with `App.tsx`.
- **`vite.config.ts`**: Explicitly set `base: '/'` and `outDir: 'dist'` to guarantee proper asset resolution in production SPA deployments.

### Verified
- `npm run build` exits with code 0 in <500ms
- `dist/` verified: contains `index.html`, `assets/`, `images/`, `favicon.svg`, `icons.svg`, and `_redirects`
- `vite preview` tested: served on port 4173 with zero errors

---

## [Final Frontend UI Cleanup] — 2026-09-20

### Changed

**`src/components/navigation/CardNav.tsx`** — Compact station selector:
- Removed `minHeight: 480px` and `padding: '3rem 2.5rem'` from both station cards → replaced with `padding: '1rem 1.25rem'`
- Station name font size reduced from `3.75rem` → `1.75rem`
- Removed long description paragraphs from both cards (content was not needed for station selection)
- Made the entire card the click target (`onClick` on `motion.div`, `role="button"`, `tabIndex={0}`, keyboard support via `onKeyDown`)
- Added Framer Motion `whileHover` scale + `whileTap` scale for tactile feedback
- Enter CTA now a compact visual bar inside the card instead of a separate full-width button
- Grid gap reduced from `1.5rem` → `0.875rem`, container padding reduced from `1.5rem 1.75rem 2.25rem` → `0.75rem 1.25rem 1.25rem`
- Both cards now **fit within viewport on laptop/desktop without any scrolling**

**`src/pages/Overview/OverviewPage.tsx`** — Dashboard cleanup:
- **Removed** the entire "Digital Twin Access" card (Card 3) — `Box` import also removed
- Dashboard comment updated to reflect 2-card layout
- Remaining 2 cards (Atmospheric Intelligence + Machinery Telemetry) reflow naturally into a clean 2-column grid with no empty gap
- The actual `<DigitalTwinPanel />` 3D WebGL viewer above the cards is **untouched**

### Verified (browser testing)
- Both station cards visible without scrolling — ✅
- Station cards are compact but clearly readable — ✅
- MAITRI and BHARATI selection both work — ✅
- "Digital Twin Access" dashboard card removed — ✅
- 2-column card grid reflowed cleanly, no empty space — ✅
- Actual 3D Digital Twin (WebGL scene, weather, machinery, controls, asset panel) fully intact — ✅
- Motion Dock, CardNav animation, routing unchanged — ✅
- `npx tsc --noEmit`: **0 errors**

---

## [Digital Twin Asset Controls + Maintenance Interface] — 2026-09-20


### Added

**New Files**
- **`src/types/commands.ts`**: Complete command contract for the future PC2→FastAPI→MQTT→PC1 pipeline. Defines `CommandType` (`START`/`STOP`), `CommandStatus` state machine (`REQUESTED`→`VALIDATING`→`EXECUTING`→`COMPLETED`/`REJECTED`/`FAILED`), `CommandRequest`, `CommandFeedback`, `ASSET_COMMANDS` commandability rules, and `UserRole` (`VIEWER`/`OPERATOR`/`ENGINEER`/`ADMIN`).
- **`src/services/commands.ts`**: ⚠️ FRONTEND DEMONSTRATION ONLY — Mock command service simulating the full state machine with realistic delays (~2.6s total). Implements `submitCommand()`, `createCommandRequest()`, in-memory `CommandLog`. Designed as a drop-in replacement point for `POST /api/commands` during integration.
- **`src/components/digitalTwin/AssetDetailPanel.tsx`**: Full interactive asset detail panel sliding in from the right side of the 3D viewport:
  - **Header**: Asset ID badge, name, status chip (color-coded), last sync timestamp.
  - **Health bars**: Health % and Failure Risk % dual-bar display.
  - **Live Telemetry** (type-aware): Common fields (temperature, power, current, efficiency, vibration) + type-specific fields (fuel level for generators, SoC + voltage for batteries, flow rate for pumps, operating hours for all motorized assets). Missing fields display as `"Not available"`.
  - **Operating Controls** (OPERATOR+ role): START/STOP buttons for `generator`, `pump`, `hvac` types. Fuel systems and environmental sensors show no commands (correctly per spec).
  - **Command Feedback Strip**: Real-time status progression from `REQUESTED` → `VALIDATING` → `EXECUTING` → `COMPLETED`/`REJECTED` with color-coded status icons.
  - **Maintenance section** (collapsible): `MaintenanceState` badge (NORMAL/DUE/OVERDUE/IN_PROGRESS), last/next maintenance dates, operating hours, known issue, recommended action. All marked as DEMO data.
  - **Maintenance Actions** (ENGINEER+ role): `MARK STARTED` / `MARK COMPLETED` buttons prepared for backend integration.
  - **Inventory / Spare Parts** (collapsible): Parts linked to known issues with AVAILABLE/LOW_STOCK/OUT_OF_STOCK/UNKNOWN availability badges.
  - **Command Activity Log** (collapsible): Last 5 commands for the selected asset this session.
- **`src/components/digitalTwin/CommandConfirmModal.tsx`**: Compact STOP confirmation overlay with asset-type-specific warning text, Escape-key support, and ARIA accessibility attributes.
- **`src/components/digitalTwin/RoleSwitcher.tsx`**: Demo role selector (VIEWER/OPERATOR/ENGINEER/ADMIN) in the top overlay bar. Clearly labeled `DEMO ROLE` — gates UI visibility only; real RBAC is a backend concern.

**Modified Files**
- **`src/types/digitalTwin.ts`**: Added `MaintenanceState`, `MaintenanceRecord`, `SparePartHint` interfaces; added optional `operating_hours`, `voltage`, `flow_rate` fields to `MachineTelemetry`.
- **`src/services/digitalTwinData.ts`**: Enriched all 14 assets (7 MAITRI + 7 BHARATI) with `MaintenanceRecord` data (all `_demo: true` flagged), `operating_hours`, `voltage` (batteries), `flow_rate` (pumps).
- **`src/components/digitalTwin/DigitalTwinPanel.tsx`**: Integrated `AssetDetailPanel`, `RoleSwitcher`, 3D selection highlight (animated pulsing white ring with slow rotation), `applySelectionHighlight()` function, station-switch clears selection, hover tooltip suppressed when panel is open, single `assetStatusColor()` function as the canonical 3D color source.

### Architecture
- Command contracts are **production-compatible**: `CommandRequest`/`CommandFeedback` shapes match the future `POST /api/commands` API exactly.
- The mock service is **clearly identified** — never silently fakes success; all command outcomes are explicitly returned.
- The frontend **never** contains MQTT logic, safety interlocks, actuator physics, or final command authorization — those belong to backend/PC1.

### Verified
- `npx tsc --noEmit`: **0 errors**
- HMR: Clean hot module replacement with no full page reload
- All 7 assets selectable in MAITRI and BHARATI with correct data per station
- Weather effects, Motion Dock, Card Nav, and routing all unaffected
- No backend files modified

---


## [3D Digital Twin — Frontend Antarctic Weather Visualization] — 2026-09-20

### Added
- **`src/types/weather.ts`**: Frontend-only TypeScript weather contracts (`WeatherCondition`, `WeatherState`: `CLEAR`, `LIGHT_SNOW`, `MODERATE_SNOW`, `HEAVY_SNOW`, `BLIZZARD`).
- **`src/services/weatherData.ts`**: Weather configuration adapter with station baseline weather profiles and simulation presets.
- **`src/components/digitalTwin/weatherSystem.ts`**: High-performance Three.js Antarctic Environmental Weather System:
  - **Falling Snow Particles (`THREE.Points`)**: 2,400 falling snowflakes generated via procedural soft radial-gradient texture with size variations and random flutter.
  - **Crystal Snowflakes (`THREE.Points`)**: 120 larger 6-ray crystalline snowflakes with rotational flutter and gentle drift.
  - **Low-Level Ground Blowing Drift (`THREE.Points`)**: 550 ground-hugging particles (`y: 0.05 - 1.5`) simulating authentic Antarctic katabatic snowdrift sweeping across the station terrain.
  - **Visible Wind Flow Streaks (`THREE.LineSegments`)**: 40 curved air streamlines animated along the 3D wind vector (`windDirection`) across the complex, with speed and opacity scaling with `windSpeed`.
  - **Atmospheric Haze & Fog**: Exponential fog (`FogExp2`) dynamically adjusting density from 0.014 (Clear) up to 0.026 (Blizzard) without ever occluding the station or machinery.
  - **Visual Snow Accumulation**: Ground and surface color lerps towards frost-bright `#F2F6FA` as `snowIntensity` increases.
- **Weather Status & Simulation Controls in `DigitalTwinPanel.tsx`**:
  - Live Antarctic conditions pill: Condition state, temperature, wind speed, cardinal direction, and degree azimuth.
  - Weather simulation preset buttons: `CLEAR`, `LIGHT`, `MOD`, `HEAVY`, `BLIZZARD` for real-time interactive evaluation.
  - Smooth animation loop using performance timestamps and delta times with zero garbage collection spikes.

### Verified
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Production build succeeded in 324ms with 0 errors.
- **Independence of Core Architecture**: Zero modifications to machinery risk logic, telemetry, CardNav, MotionDock, or routing.
- **60fps Render Performance**: Snow and wind update via direct TypedArray buffer attributes (`BufferAttribute.needsUpdate`) with zero React re-renders per particle.

---

## [3D Digital Twin — Phase 1: 3D Container & Dashboard Integration] — 2026-09-20

### Added
- **`three` & `@types/three` (`v0.186.0`)**: High-performance WebGL 3D rendering engine installed with zero runtime bloat.
- **`src/types/digitalTwin.ts`**: TypeScript contracts for `MachineAssetId`, `MachineTelemetry`, and `StationDigitalTwinData` covering all seven synthetic machinery assets (`GEN-01`, `GEN-02`, `BAT-01`, `FUEL-01`, `PUMP-01`, `HEATER-01`, `ENV-01`).
- **`src/services/digitalTwinData.ts`**: Clean data adapter service decoupling 3D presentation from backend/telemetry ingestion, ready for future PC1/MQTT/WebSocket connection.
- **`src/components/digitalTwin/DigitalTwinPanel.tsx`**: Interactive 3D Digital Twin component:
  - Procedural Antarctic architectural models for both **MAITRI** (grounded shelter modules with interconnected corridors, communication mast, and dome) and **BHARATI** (aerodynamic stilt bioclimatic complex, elevation stilts, roof helideck, and comms tower).
  - Scientific visualization lighting: ambient, directional sun with soft shadows (`PCFShadowMap`), and hemisphere ice bounce light.
  - Antarctic snow/ice ground terrain and polar telemetry grid.
  - OrbitControls with sensible limits (damping, polar angle ceiling preventing sub-surface clipping).
  - Camera preset buttons (`ISO`, `TOP`, `ELEV`).
  - Interactive Raycaster for cursor hover tooltips and machine clicking.
  - Semantic status color coding: Normal (Deep Teal / Emerald), Warning (Amber), Critical (Red with pulse animation), Offline (Mist Gray).
  - Temperature & Katabatic Wind real-time overlay with historical simulation transparency tag.
  - Compact scientific legend (`NORMAL`, `WARNING`, `CRITICAL`, `OFFLINE`).
  - Calculated Station Health metric derived from asset failure risk profiles.
  - Interactive Asset Detail flyout panel showing temperature, failure risk, vibration, power, current, efficiency, sync timestamp, and diagnostic notes.
- Integrated `DigitalTwinPanel` directly into `src/pages/Overview/OverviewPage.tsx` (major section below hero card per section 3 hierarchy) and `src/App.tsx` (route `/digital-twin`).

### Verified
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Vite production build passed in 514ms with 0 errors.
- Dev server HMR updated cleanly without console warnings.
- Station context reactivity: Switching between MAITRI and BHARATI dynamically updates the 3D model, asset positions, and environmental data.

---

## [Phase 3 — UX Architecture Correction & Full Application Shell] — 2026-09-20

### Changed
- **BREAKING UX**: Scrapped the original incorrect page composition that auto-opened BHARATI
- Implemented the mandatory 3-state UX flow: `Welcome → Station Selection → Station Dashboard`
- Redesigned `App.tsx` as the routing & state orchestrator (no more react-router-dom dependency)
- Added URL-synchronized navigation using native Browser History API (no external router)

### Added
- **`src/pages/Welcome/WelcomePage.tsx`**: Full Welcome & Station Selection page
  - Mist Gray frost background with Antarctic hero image watermark
  - DAKSHIN brand header with subtitle and description
  - Integrated `CardNav` in initially-open state for immediate station selection
  - Outlined DAKSHIN watermark text at 5% opacity
- **`src/pages/Overview/OverviewPage.tsx`**: Station control center Overview route
  - Station hero card with photographic preview (station-specific)
  - Atmospheric Intelligence panel (Outside Temp, Wind Velocity — historical data)
  - Synthetic Machinery Telemetry panel (GEN-01, HEATER-01, PUMP-01 with status bars)
  - Digital Twin quick-access card with navigation buttons
  - Satellite Link Simulator controls (ONLINE / DEGRADED / BLACKOUT toggles)
- **`src/pages/SectionPlaceholder.tsx`**: Placeholder for all unimplemented routes
  - Correctly types Lucide icons using `React.ComponentType` (not `LucideIcon` named export)
  - Special `isStationSelector` variant that renders full CardNav for `/stations` route
- **`src/components/navigation/CardNav.tsx`**: Full React conversion of `card nav` UI prototype
  - Animated expand/collapse using Framer Motion (spring physics)
  - Deep Teal station cards for MAITRI and BHARATI with hover lift effect
  - Staggered card entrance animation (0.15s and 0.25s delay)
  - Station metadata (coordinates, health %, active alert count)
- **`src/components/navigation/MotionDock.tsx`**: Full React conversion of `motion dock` UI prototype
  - Glassmorphic floating dock (`background: rgba(224, 229, 233, 0.90)`)
  - 8 navigation items with tooltips, active state (Deep Teal fill), active dot indicator
  - System status indicator with pulsing green dot
  - Station switcher quick-pill dropdown on right
- **`src/components/shell/StationHeader.tsx`**: Active station top header bar
  - Back-to-stations arrow button
  - Brand badge (M&B monogram), DAKSHIN title, PC2 CONTROL pill
  - Station name pill with coordinates
  - Live telemetry strip: Outside Temp, Wind Speed, Health %
  - Real-time local station clock (UTC+5)
  - Satellite Link Status badge (LINK ACTIVE / REMOTE LINK OFFLINE)

### Fixed
- **`src/index.css`**: Removed undefined `--polar-abyss` CSS variable; replaced with `var(--mist-gray)` and `var(--mist-gray-dark)`
- **`src/pages/SectionPlaceholder.tsx`**: Removed `import type { LucideIcon }` (not a named export in lucide-react `^1.x`); replaced with `React.ComponentType<{ size?, className?, style? }>`
- TypeScript strict mode: `npx tsc --noEmit` passes with **0 errors**

---

## [Phase 2 — Application Shell] — 2026-09-20

### Added
- **`src/types/index.ts`**: Core TypeScript definitions
  - `StationId = 'maitri' | 'bharati'`
  - `ConnectionStatus`: ONLINE, DEGRADED, OFFLINE, RECONNECTING, SYNCHRONIZING
  - `OperationalStatus`: NORMAL, DEGRADING, WARNING, CRITICAL, FAILED, OFFLINE, UNKNOWN
  - `StationConfig` interface with full station metadata schema
- **`src/context/StationContext.tsx`**: Global state provider
  - Default station data for MAITRI (Schirmacher Oasis, est. 1989) and BHARATI (Larsemann Hills, est. 2012)
  - URL query param persistence (`?station=maitri`)
  - Ticking local station clock (updates every second)
  - Connection status machine
- **`src/components/shell/Header.tsx`**: Initial header (superseded by StationHeader in Phase 3)
- **`src/components/shell/AppShell.tsx`**: Application wrapper shell

---

## [Phase 1 — Design System] — 2026-09-20

### Added
- **`src/styles/design-tokens.css`**: Complete CSS custom property design token library
  - Mist Gray surface (`#E0E5E9`) and all variants
  - Deep Teal structural color (`#004E64`) and all variants
  - Full 7-color semantic status palette (normal, warning, critical, failed, offline, unknown, info)
  - Typography variables (Epilogue, Inter, JetBrains Mono)
  - Radius tokens (sm, md, lg, xl, card, nav, full)
  - Shadow tokens (dock, card, teal-card, nav)
  - Transition timing tokens (fast, smooth, drawer)
  - `.frost-texture-overlay` — Mist Gray base with SVG hexagonal ice lattice at 4.5% opacity
  - `.frost-card` — Frosted glass panel (backdrop-blur: 16px)
  - `.teal-station-card` — Deep Teal station card from card nav prototype
  - `.glass-dock` — Glassmorphic dock from motion dock prototype
  - `.dock-item`, `.dock-tooltip`, `.dock-active-indicator` — Dock interaction states
  - `.status-dot-pulse` — 2s looping green pulse animation
  - `.bg-watermark-text` — Outlined background watermark typography
- **`src/styles/layout.css`**: Shell and layout foundations
  - `.app-shell` — Root application container
  - `.top-header` — Sticky frosted glass header (72px)
  - `.main-viewport` — Scrollable content area with 7.5rem bottom padding for dock clearance
  - `.dock-rail-container` — Fixed bottom floating dock slot
  - `.status-badge` and all variant classes
  - Responsive breakpoints (max-width: 1024px)
- **Updated `src/index.css`**: Design tokens + layout imports, CSS reset, custom scrollbar
- **Updated `index.html`**: Dakshin metadata, Google Fonts (Epilogue, Inter, JetBrains Mono)

---

## [Phase 0 — Repository Audit & Discovery] — 2026-09-20

### Discovered
- Repository had **zero framework files** — only 2 prototype files under `UI elements/`
- `UI elements/card nav` — Full HTML/CSS/JS station navigation card prototype
- `UI elements/motion dock` — Full HTML/CSS/JS floating operations dock prototype
- Prototypes used: Deep Teal `#004E64`, Mist Gray `#E0E5E9`, Epilogue font, Lucide icons

### Added
- Initialized Vite + React + TypeScript project (`npx create-vite@latest`)
- Installed: `lucide-react`, `framer-motion`
- Renamed project to `dakshin-control-center` in `package.json`
- Created `docs/PROJECT_IMPLEMENTATION_REPORT.md` — living phase audit report
- Created `docs/CHANGELOG.md` — this file
- Created `docs/GUIDE.md` — technical guide and tech stack documentation
