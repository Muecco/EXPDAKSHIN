# DAKSHIN — TECHNICAL IMPLEMENTATION GUIDE & TECH STACK

**System:** PC2 Remote Operations Control Center  
**Platform:** Antarctic Research Station Digital Twin & Management (Smart India Hackathon 2026)  
**Stations Supported:** MAITRI & BHARATI  

---

## 1. TECHNOLOGY STACK

| Category | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React + TypeScript | React `^19.x`, TS `~6.x` | High-performance reactive UI, strict data schemas, and type-safe telemetry contracts. |
| **Build Tool & Dev Server** | Vite | `^8.x` | Ultra-fast HMR (Hot Module Replacement), ES modules, and instant dev server reloads (~180ms startup). |
| **Styling & Design System** | Vanilla CSS + CSS Custom Properties | Native CSS3 | Maximum control, zero runtime CSS bloat, pixel-perfect glassmorphism, responsive control-room grid, and hardware-accelerated animations. |
| **Typography** | Epilogue, Inter, JetBrains Mono | Google Fonts | - **Epilogue**: Heavy mission control headings & station titles.<br>- **Inter**: Clean, legible operational data text.<br>- **JetBrains Mono**: Technical numbers, coordinates, and telemetry timestamps. |
| **Iconography** | Lucide React | `^1.x` | Matches all icons from original prototypes (`radar`, `mountain-snow`, `box`, `cog`, `triangle-alert`, `activity`, `wrench`, `sliders-horizontal`, `compass`, `wind`, `thermometer`). |
| **Animation Engine** | Framer Motion & CSS Cubic Beziers | `^12.x` | Smooth physics-based transitions, card expand/collapse (CardNav), dock item hover magnification (`scale(1.12)`), and active state micro-indicators. |
| **State Management** | React Context API (`StationContext`) | Native React | Global station selection (`maitri` \| `bharati`), satellite connection state machine (`ONLINE`, `DEGRADED`, `OFFLINE`), and local station clock. |
| **3D Digital Twin Engine** | Three.js + OrbitControls | `^0.186.x` | High-performance WebGL 3D rendering for Antarctic research station digital twin, procedural architecture, asset telemetry mapping, and interactive orbit controls. |
| **Routing** | Custom URL-sync routing (hash-free) | Native browser History API | URL path-synchronized navigation without external router, supporting `/overview`, `/stations`, `/digital-twin`, `/machinery`, `/alerts`, `/analytics`, `/maintenance`, `/settings`. |

---

## 2. OFFICIAL COLOR PALETTE & DESIGN SYSTEM TOKENS

The system strictly adheres to the mandatory Antarctic design anchors:

### Primary Anchor: Deep Teal (`#004E64`)
- Used for: Primary navigation, selected states, headers, primary buttons, structural accents, and key telemetry indicators.
- CSS Variable: `--deep-teal: #004E64;`

### Dominant Light Surface: Mist Gray (`#E0E5E9`)
- Used for: App background, station cards, telemetry panels, glassmorphic dock surface, and secondary containers.
- CSS Variable: `--mist-gray: #E0E5E9;`

### Semantic Status Palette
Operational colors are strictly purposeful:
- **NORMAL / ONLINE**: `#0E9F6E` (Teal-Green) with 2s pulsing indicator (`status-dot-pulse`).
- **WARNING**: `#D97706` (Amber) for degrading metrics and pending alerts.
- **CRITICAL**: `#DC2626` (High-alert Red) for threshold breaches.
- **FAILED**: `#991B1B` (Dark Red) for failed machinery assets.
- **OFFLINE**: `#64748B` (Neutral Cool Gray) for disconnected links.
- **UNKNOWN**: `#94A3B8` (Desaturated Slate) for missing sensor telemetry.
- **INFO**: `#0284C7` (Polar Blue) for diagnostic status.

### Antarctic Frost & Ice Crystal Lattice Identity
- Procedural SVG microscopic hexagonal ice lattice overlay (`frost-texture-overlay`) rendered at `0.045` opacity.
- Delivers an authentic scientific, frozen-environment ambiance without obstructing data readability.
- Frosted glass panels (`frost-card`) feature `backdrop-filter: blur(16px)`.
- Motion Dock glassmorphism: `background: rgba(224, 229, 233, 0.90)` with inset highlight.
- Background Watermark: Outlined typography (`-webkit-text-stroke: 1px var(--deep-teal)`) at `5%` opacity.

---

## 3. APPLICATION FLOW & UX ARCHITECTURE

The application implements a **3-state flow** (per the UX Correction spec):

```
STATE 1: Welcome Page (WelcomePage.tsx)
  → Mist Gray frost background + Antarctic hero image
  → DAKSHIN title, subtitle, and context
  → Hosts the CardNav station selector (initially open)

STATE 2: Station Selection (within WelcomePage via CardNav)
  → CardNav component (authoritative UI prototype converted to React)
  → Deep Teal station cards for MAITRI and BHARATI
  → Animated expand/collapse (Framer Motion)
  → Click "ENTER MAITRI / BHARATI STATION" → proceeds to STATE 3

STATE 3: Station Control Center (App Shell)
  → StationHeader (top bar with station name, live telemetry, clock, link status)
  → main-viewport (scrollable content area)
  → MotionDock (floating bottom dock rail)
  → Routes: /overview, /stations, /digital-twin, /machinery,
            /alerts, /analytics, /maintenance, /settings
```

---

## 4. DIRECTORY ARCHITECTURE

```text
dakhsin/
│
├── UI elements/                   # Original prototypes (Strictly preserved, read-only)
│   ├── card nav                   # Station card navigation reference
│   └── motion dock                # Operations dock reference
│
├── docs/                          # Project documentation
│   ├── GUIDE.md                   # This comprehensive technical guide
│   ├── PROJECT_IMPLEMENTATION_REPORT.md  # Living phase report
│   └── CHANGELOG.md               # Phase-by-phase version log
│
├── public/
│   └── images/                    # Station photographic assets
│       ├── antarctic_station_hero.jpg
│       ├── maitri_station.jpg
│       └── bharati_station.jpg
│
├── src/
│   ├── components/
│   │   ├── digitalTwin/
│   │   │   ├── DigitalTwinPanel.tsx # 3D WebGL Station Digital Twin (Three.js)
│   │   │   └── weatherSystem.ts    # Antarctic Weather Engine (Snow, Wind streaks, Ground drift, Fog)
│   │   ├── navigation/
│   │   │   ├── CardNav.tsx        # Station selection card (FROM UI prototype, full React conversion)
│   │   │   └── MotionDock.tsx     # Floating operations rail dock with hover collapse
│   │   └── shell/
│   │       ├── AppShell.tsx       # Master application shell wrapper
│   │       ├── Header.tsx         # Original header (superseded by StationHeader)
│   │       └── StationHeader.tsx  # Active: Mission Control top bar (station-specific)
│   │
│   ├── context/
│   │   └── StationContext.tsx     # Global station & connection context provider
│   │
│   ├── services/
│   │   ├── digitalTwinData.ts     # Decoupled machinery telemetry adapter
│   │   └── weatherData.ts         # Frontend Antarctic weather conditions & simulation presets
│   │
│   ├── pages/
│   │   ├── Welcome/
│   │   │   └── WelcomePage.tsx    # STATE 1 + 2: Welcome hero + CardNav station selector
│   │   ├── Overview/
│   │   │   └── OverviewPage.tsx   # STATE 3 route: /overview — station dashboard + 3D Twin
│   │   └── SectionPlaceholder.tsx # Placeholder for routes not yet implemented
│   │
│   ├── styles/
│   │   ├── design-tokens.css      # Official palette, frost textures, status tokens
│   │   └── layout.css             # Shell layouts, grids, status badges, responsiveness
│   │
│   ├── types/
│   │   ├── index.ts               # Core TypeScript definitions (StationConfig, StationId, etc.)
│   │   ├── digitalTwin.ts         # MachineAssetId, MachineTelemetry, StationDigitalTwinData
│   │   └── weather.ts             # WeatherCondition, WeatherState
│   │
│   ├── App.tsx                    # Main application routing & state orchestration
│   ├── index.css                  # Master CSS reset and token import
│   └── main.tsx                   # React root mount
│
├── index.html                     # HTML template with Google Fonts & SEO metadata
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite bundler configuration
```

---

## 5. IMPLEMENTED ROUTES & SECTIONS

| Route | Status | Component | Description |
| :--- | :--- | :--- | :--- |
| `/` (no station) | ✅ Done | `WelcomePage` | Welcome + Station Selection via CardNav |
| `/overview` | ✅ Done | `OverviewPage` | Station hero card, atmospheric data, machinery telemetry, digital twin quick jump |
| `/stations` | 🔲 Placeholder | `SectionPlaceholder` | Switch between Maitri / Bharati via CardNav |
| `/digital-twin` | ✅ Done | `DigitalTwinPanel` | Interactive 3D Antarctic research station digital twin |
| `/machinery` | 🔲 Placeholder | `SectionPlaceholder` | Synthetic machinery simulation dashboard |
| `/alerts` | 🔲 Placeholder | `SectionPlaceholder` | Alert & Incident Center (3 badge shown) |
| `/analytics` | 🔲 Placeholder | `SectionPlaceholder` | Historical atmospheric trends & analytics |
| `/maintenance` | 🔲 Placeholder | `SectionPlaceholder` | Maintenance schedules & SOP |
| `/settings` | 🔲 Placeholder | `SectionPlaceholder` | Station & link settings |

---

## 6. HOW TO RUN AND BUILD LOCALLY

### Prerequisites
- Node.js (v18+ or v24+)
- NPM (v9+)

### Commands
```bash
# Install dependencies
npm install

# Start local development server (starts on http://localhost:5173/)
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Run production build
npm run build

# Preview production build locally
npm run preview
```

---

## 7. KEY DESIGN PRINCIPLES (per original spec)

1. **Mist Gray dominates** — `#E0E5E9` is the primary background everywhere, NOT dark/black
2. **Deep Teal structures** — `#004E64` is for accents, nav, headers, icons, badges
3. **No dark gradients** — Avoid dark/neon aesthetic; keep it frosted, clean, icy-light
4. **UI prototypes are authoritative** — CardNav and MotionDock are faithfully converted from the original HTML/CSS prototypes, not redesigned
5. **Welcome → Selection → Dashboard** — The 3-state flow is mandatory; no auto-routing to a station without explicit user selection
6. **Historical data, no fabrication** — All atmospheric data is labeled as "HISTORICAL SIMULATION", not live sensor data

---

*Last updated: Phase 3 — UX Architecture Correction + Application Shell + Overview Page*
