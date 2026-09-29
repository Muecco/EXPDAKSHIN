# DAKSHIN: An Offline-Aware, Dependency-Guided Remote Station Monitoring & Diagnostics Platform
## Project Master Specification & Architecture Blueprint for SIH Grand Finals

### Executive Summary & Core Mission
DAKSHIN (Dependency-Aware Knowledge & SCADA Harness for Isolated Infrastructure) is a resilient, offline-first remote infrastructure monitoring and automated diagnostics platform engineered specifically for extreme environments like India's Antarctic research stations—Maitri (Schirmacher Oasis) and Bharati (Larsemann Hills).

Operating in Antarctica presents unmatched operational challenges: katabatic winds exceeding 150 km/h, sub-zero freeze-thaw cycles, extreme isolation, and unpredictable satellite dropouts. DAKSHIN bridges the gap between raw hardware telemetry and intelligent operational diagnostics without relying on cloud availability.

```
                     ┌────────────────────────────────────────────────────────┐
                     │             DAKSHIN CORE ARCHITECTURE                 │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
        ┌────────────────────────────────────────┴────────────────────────────────────────┐
        ▼                                                                                 ▼
┌─────────────────────────────────────────┐                     ┌─────────────────────────────────────────┐
│     36-HOUR INTEGRATED MVP ENGINE       │                     │    SCALABLE EDGE PLATFORM TARGET        │
├─────────────────────────────────────────┤                     ├─────────────────────────────────────────┤
│ • Two-PC Distributed Edge Setup         │                     │ • 3D WebGL Digital Twin (Three.js/R3F)  │
│ • MQTT Telemetry (Mosquitto / Port 1883)│  ══ Scale Path ══►  │ • PyTorch Unsupervised LSTM Autoencoder │
│ • FastAPI Gateway + SQLite Ingestion    │                     │ • Dynamic Rolling 3σ Z-Score Gate       │
│ • CascadeGuard Dependency Engine        │                     │ • Offline Air-Gapped RAG (FAISS/Ollama) │
│ • Buffered Replay & Deduplication Sync  │                     │ • TimescaleDB Hypertables               │
└─────────────────────────────────────────┘                     └─────────────────────────────────────────┘
```

The platform addresses two primary operational challenges:
1. **Explainable Failure Cascade Analysis (CascadeGuard)**: When a primary asset fails (e.g., Main Generator), standard SCADA systems trigger isolated threshold alarms. DAKSHIN traverses directed asset dependency pathways to explicitly explain to operators what downstream systems (e.g., microgrid, water circulation pumps, habitat heating, satellite tracking dishes) are potentially affected and why.
2. **Evidence-Backed Offline Resilience**: During satellite dropouts or link loss, edge nodes buffer telemetry locally in persistent queues. Upon link restoration, buffered messages are replayed and idempotently deduplicated on the control gateway, preserving a complete audit trail without data loss.

---

### 1. Global Precedents & Indian Antarctic Alignment
Polar facilities and heavy industries use telemetry, digital twins, and automated SCADA engines to maintain continuous stability:

* **British Antarctic Survey (Halley VI Station)**: Operates uncrewed winter monitoring centered on Capstone C30 micro-turbines, streaming low-bandwidth MQTT packets over satellite to Cambridge to monitor turbine RPM (70,000 RPM), fuel pressure, and automated valve state transitions.
* **NASA Deep Space Network (DSN) & Sub-mm Tracking**: Uses finite-element structural models combined with live wind vector sensors to calculate phase drift ($\Delta\phi=2\pi\Delta x/\lambda$) and boresight misalignment during severe storms, automatically feeding compensating vectors to pointing drives.
* **Princess Elisabeth Station (Belgium / IPF)**: Uses smart microgrid SCADA software to dynamically balance 9 wind turbines and 284 solar panels with zero human intervention and automated load shedding.
* **Offshore Energy Digital Twins (Equinor / Shell)**: Uses 3D WebGL models (Three.js/CAD) to visualize remote rigs. Components flash amber/red under abnormal vibration spectral loads, linking directly to time-series graphs.

#### Specific Indian Station Deployment Alignment
* **Bharati Research Station (Larsemann Hills)**: Houses ISRO's AGEOS (Antarctica Ground Station for Earth Observation Satellites) satellite tracking antenna alongside modular buildings powered by combined heat and power (CHP) diesel gensets. DAKSHIN monitors generator thermal recovery and correlates wind shear with antenna boresight loss.
* **Maitri Research Station (Schirmacher Oasis)**: Relies on heavy diesel gensets, lake water pumping systems (Lake Priyadarshini), and atmospheric HF/VHF radar arrays. DAKSHIN monitors structural load, fuel pipeline viscosity/temperature, and radar array phase stability under polar storm fronts.

---

### 2. Detailed Dual-Node System Architecture
DAKSHIN operates on an asynchronous, decoupled Two-PC Distributed Node Topology representing an Antarctic Field Station (PC1) and the Central Station Operations Control Gateway (PC2).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [PC1] ANTARCTIC STATION FIELD EDGE                                                                     │
│                                                                                                        │
│  ┌───────────────────────────┐      MQTT / JSON       ┌─────────────────────────────────────────────┐  │
│  │ Telemetry Simulator / ADC │ ─────────────────────► │ Bounded Persistent Resend Queue (SQLite)    │  │
│  │ (Generator, Water Pump)   │  (Normal Operation)    │ [Event ID | Timestamp | Payload | Status]   │  │
│  └───────────────────────────┘                        └──────────────────────┬──────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────│─────────────────────────┘
                                                                               │
                                                                   (On Link Interruption)
                                                                               │
                                                                               ▼
                                                        ┌──────────────────────────────────────────────┐
                                                        │  📶 LOCAL BUFFERED REPLAY & SYNC ENGINE      │
                                                        └──────────────────────┬───────────────────────┘
                                                                               │
                                                                   (On Link Restoration)
                                                                               │
                                                                               ▼
┌──────────────────────────────────────────────────────────────────────────────│─────────────────────────┐
│ [PC2] CENTRAL STATION OPERATIONS GATEWAY & CONTROL                           │                         │
│                                                                              │                         │
│  ┌───────────────────────────┐      MQTT / Port 1883   ┌─────────────────────▼───────────────────────┐  │
│  │ Mosquitto MQTT Broker     │ ─────────────────────►  │ FastAPI Gateway & Ingestion Service         │  │
│  │ (Edge Messaging Bus)      │                         │ (Pydantic Validation & Schema Check)        │  │
│  └───────────────────────────┘                         └─────────────────────┬───────────────────────┘  │
│                                                                              │                         │
│                                                                              ▼                         │
│                                                        ┌─────────────────────────────────────────────┐  │
│                                                        │ Local Storage Layer                         │  │
│                                                        │ (SQLite / TimescaleDB Hypertables)          │  │
│                                                        └─────────────────────┬───────────────────────┘  │
│                                                                              │                         │
│                                     ┌────────────────────────────────────────┴───────────────────────┐ │
│                                     ▼                                                                ▼ │
│        ┌─────────────────────────────────────────┐       ┌─────────────────────────────────────────┐   │
│        │ CascadeGuard Dependency Graph Engine    │       │ PyTorch LSTM Autoencoder ML Engine      │   │
│        │ (NetworkX Traversal & Impact Rules)     │       │ (Unsupervised Reconstruction & Z-Score) │   │
│        └────────────────────┬────────────────────┘       └────────────────────┬────────────────────┘   │
│                             │                                                 │                        │
│                             └────────────────────────┬────────────────────────┘                        │
│                                                      │                                                 │
│                                                      ▼                                                 │
│        ┌──────────────────────────────────────────────────────────────────────────────────────────┐    │
│        │ React Operator Dashboard & 3D WebGL Twin (Three.js / React Three Fiber)                 │    │
│        └─────────────────────────────────────────────┬────────────────────────────────────────────┘    │
│                                                      │                                                 │
│                                           (If Rolling Z-Score ≥ 3.0σ)                                  │
│                                                      │                                                 │
│                                                      ▼                                                 │
│        ┌──────────────────────────────────────────────────────────────────────────────────────────┐    │
│        │ Local Air-Gapped Diagnostic Assistant (FAISS Vector Search + Quantized Mistral 7B)       │    │
│        └──────────────────────────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1 Telemetry JSON Schema
```json
{
  "event_id": "evt_9842f1a0-45b2-4d8e-912a-8921104e1201",
  "station_id": "maitri-station-01",
  "asset_id": "gen-01",
  "sequence": 14209,
  "timestamp": "2026-09-29T22:40:31.000Z",
  "metrics": {
    "core_temperature_c": 85.5,
    "vibration_amplitude_mms": 3.4,
    "phase_current_a": 117.8,
    "active_power_kw": 138.8,
    "mechanical_efficiency_pct": 83.0,
    "fuel_consumption_lph": 36.5
  },
  "operating_state": "RUNNING",
  "simulation": true
}
```

---

### 3. Core Differentiators & Algorithmic Design
#### 3.1 CascadeGuard: Dependency-Aware Impact Engine
CascadeGuard models station assets as a directed graph $G=(V,E)$, where $V$ represents equipment/services and $E$ represents physical operational dependencies.

```
                                CASCADEGUARD DEPENDENCY TRAVERSAL
                                
     [ GEN-01 ] ──(Critical Fault: Temp=85.5°C)
         │
         ├───► [ Power Microgrid Bus ] ──► (State: POTENTIALLY AFFECTED)
         │           │
         │           ├───► [ PUMP-01 (Water Circulation) ] ──► (State: POTENTIALLY AFFECTED)
         │           │           │
         │           │           └───► [ Primary Habitat Heating ] ──► (State: POTENTIALLY AFFECTED)
         │           │
         │           └───► [ AGEOS Satellite Dish ] ──► (State: POTENTIALLY AFFECTED)
         │
         └───► [ Fuel Pre-Heater Line ] ──► (State: POTENTIALLY AFFECTED)
```

**Safety Rule**: Downstream nodes are strictly labeled `POTENTIALLY_AFFECTED` until independent live telemetry confirms their state.

#### 3.2 Dynamic Rolling $3\sigma$ Z-Score Gate
Reconstruction error (MSE) is evaluated against a 1-hour moving temporal window:
$$Z = \frac{\text{MSE} - \mu_{\text{rolling}}}{\sigma_{\text{rolling}}}$$

* $Z < 1.5\sigma \implies$ Nominal
* $1.5\sigma \le Z < 3.0\sigma \implies$ Warning
* $Z \ge 3.0\sigma \implies$ Critical Anomaly (Triggers CascadeGuard & Local RAG Copilot)

---

### 4. Technology Stack Matrix
* **3D Visualization & UI**: Three.js / React-Three-Fiber, WebGL, TailwindCSS, Lucide Icons
* **Backend Telemetry Engine**: Python (FastAPI / Asyncio), Node.js, MQTT Broker (Mosquitto)
* **Dependency Engine**: Python NetworkX (CascadeGuard Directed Graph Traversal)
* **Predictive ML**: PyTorch Seq2Seq LSTM Autoencoder + Rolling $3\sigma$ Z-Score
* **Vector Index**: Meta FAISS / Local Vector Store over chunked OEM manual PDFs
* **Local LLM / Copilot**: Quantized local LLM / Gemini API integration for diagnostic action plans
