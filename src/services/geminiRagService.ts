// DAKSHIN Antarctic Station - Gemini RAG Copilot Service
// Grounded retrieval & generative diagnostic engine for polar operations & Earth System Science

export interface KnowledgeChunk {
  id: string;
  title: string;
  section: string;
  content: string;
  tags: string[];
}

export interface RagResponse {
  answer: string;
  citations: { id: string; title: string; section: string }[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedActions: string[];
  isFallback?: boolean;
}

// Expanded Knowledge Base incorporating DAKSHIN Master Spec, MoES Parliamentary 411th Report, & Digital Twins SLR (van Dinter 2022)
const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'spec_1.1',
    title: 'Executive Mission & Polar Environment Specs',
    section: 'Executive Summary',
    content: `DAKSHIN is an offline-first infrastructure monitoring and automated diagnostics platform for India's Antarctic research stations: Maitri (Schirmacher Oasis) and Bharati (Larsemann Hills). Operating in Antarctica involves extreme katabatic winds (>150 km/h), sub-zero freeze-thaw cycles, extreme isolation, and unpredictable satellite dropouts. DAKSHIN provides explainable failure cascade analysis (CascadeGuard) and evidence-backed offline telemetry resilience without cloud dependency.`,
    tags: ['maitri', 'bharati', 'antarctica', 'katabatic', 'isolation', 'offline', 'mission'],
  },
  {
    id: 'spec_1.2',
    title: 'Bharati & Maitri Operational Alignment',
    section: 'Section 1: Station Alignment',
    content: `Bharati Station (Larsemann Hills) houses ISRO's AGEOS (Antarctica Ground Station for Earth Observation Satellites) parabolic dish antenna alongside modular buildings powered by combined heat and power (CHP) diesel gensets. Maitri Station (Schirmacher Oasis) relies on heavy diesel gensets, lake water pumping systems (Lake Priyadarshini), and atmospheric HF/VHF radar arrays. DAKSHIN correlates ambient polar weather constraints directly with mechanical stress, fuel burn rate, and radar pointing accuracy.`,
    tags: ['bharati', 'maitri', 'ageos', 'isro', 'lake priyadarshini', 'radar', 'genset', 'chp'],
  },
  {
    id: 'moes_2.1',
    title: 'Maitri-II Antarctic Replacement Research Station',
    section: 'MoES 411th Report (Chapter III - PRITHVI)',
    content: `The existing Maitri Station (commissioned 1989) has exceeded its designed operational lifespan, facing structural deterioration, space limitations, and environmental/waste-management constraints. The Ministry of Earth Sciences is establishing Maitri-II as a modern replacement station to ensure safety and India's year-round polar presence under the Antarctic Treaty System. The architectural design consultant was selected via global competition (consortium of Ramboll Deutschland GmbH and bofArchitekten, Germany). Recommendations emphasize incorporating indigenous Indian engineering for extreme-cold construction.`,
    tags: ['maitri-ii', 'maitri 2', 'ramboll', 'bofarchitekten', 'replacement station', 'structural deterioration', 'antarctic treaty'],
  },
  {
    id: 'moes_2.2',
    title: 'NCPOR Ice-Class Polar Research Vessel (PRV)',
    section: 'MoES 411th Report (Chapter IV - NCPOR)',
    content: `National Centre for Polar and Ocean Research (NCPOR, Goa) coordinates expeditions to Antarctica (Maitri & Bharati) and the Arctic (Himadri station, Svalbard). Approval has been granted for acquiring a dedicated ice-class Polar Research Vessel (PRV) with ice-breaking capabilities at an estimated cost of ₹2,329.40 crore to support deep polar research and logistics.`,
    tags: ['prv', 'polar research vessel', 'ice-breaker', 'ncpor', 'himadri', 'svalbard', 'arctic', 'expedition'],
  },
  {
    id: 'moes_2.3',
    title: 'PRITHVI Scheme, Mission Mausam & Deep Ocean Mission',
    section: 'MoES 411th Report (Chapter III)',
    content: `PRITHVI (Prithvi Vigyan) scheme integrates atmosphere, ocean, cryosphere, and geosciences. Includes Low-Temperature Thermal Desalination (LTTD) in Lakshadweep (transitioning from diesel to solar/OTEC). Mission Mausam expands Doppler Weather Radar (DWR) network by 84 additional DWRs (budget ₹942.57 crore), establishes cloud microphysics lab at IITM Pune for cloudburst warnings, and floating buoy radars. Deep Ocean Mission (outlay ₹4,077 crore) focuses on Samudrayaan crewed submersible and polymetallic nodule mining.`,
    tags: ['prithvi', 'mission mausam', 'dwr', 'doppler radar', 'deep ocean mission', 'samudrayaan', 'iitm pune', 'cloudburst'],
  },
  {
    id: 'dt_3.1',
    title: 'Predictive Maintenance Using Digital Twins (van Dinter et al., 2022)',
    section: 'Digital Twin Systematic Literature Review',
    content: `Digital Twin design patterns include Digital Model, Digital Shadow (one-way simulation streaming), Digital Monitor (condition monitoring & RUL estimation), and Digital Control (two-way automated synchronization). Core ML/DL techniques include Seq2Seq LSTM Autoencoders for unsupervised reconstruction error calculation, CNNs for spectral feature extraction, and SVMs for multi-class fault classification. Protocols include MQTT (TCP/IP publish/subscribe), OPC UA, and Modbus. Key parameters monitored: vibration, velocity, torque, temperature, current, voltage.`,
    tags: ['digital twin', 'predictive maintenance', 'rul', 'van dinter', 'digital shadow', 'digital monitor', 'opc ua', 'modbus', 'mqtt'],
  },
  {
    id: 'spec_2.1',
    title: 'Two-PC Distributed Node Topology & Link Outage Recovery',
    section: 'Section 2: Dual-Node System Architecture',
    content: `DAKSHIN operates on a two-PC topology: PC1 (Antarctic Field Station Edge) simulates equipment telemetry and maintains a local SQLite resend queue. PC2 (Central Gateway) hosts Mosquitto MQTT broker, FastAPI Gateway, NetworkX CascadeGuard engine, and React 3D Twin. When the PC1-PC2 network link drops, PC1 buffers telemetry locally in persistent SQLite tables (event_id, timestamp, payload, status). Upon link restoration, PC1 replays buffered events and PC2 deduplicates records using primary key constraints (INSERT OR IGNORE into telemetry_sync_ledger).`,
    tags: ['two-pc', 'pc1', 'pc2', 'mqtt', 'mosquitto', 'sqlite', 'deduplication', 'replay', 'buffer', 'outage'],
  },
  {
    id: 'spec_3.1',
    title: 'CascadeGuard Dependency Traversal Engine',
    section: 'Section 3.1: CascadeGuard Impact Engine',
    content: `CascadeGuard models station assets as a directed graph G=(V,E). When an asset fails (e.g. Primary Generator GEN-01 high temperature >85.5°C), CascadeGuard traverses downstream operational pathways: GEN-01 -> Power Microgrid Bus -> PUMP-01 (Water Circulation) -> Primary Habitat Heating & AGEOS Satellite Dish, plus GEN-01 -> Fuel Pre-Heater Line. Downstream assets are strictly labeled POTENTIALLY_AFFECTED until independent telemetry confirms their actual operational state.`,
    tags: ['cascadeguard', 'graph', 'dependency', 'networkx', 'impact', 'potentially_affected', 'gen-01', 'pump-01', 'generator'],
  },
  {
    id: 'spec_4.1',
    title: 'PyTorch LSTM Autoencoder & Rolling 3σ Z-Score Gate',
    section: 'Section 4: Predictive ML & Z-Score Gate',
    content: `Continuous telemetry is converted into sliding temporal windows X (60 ticks). The PyTorch Seq2Seq LSTM Autoencoder reconstructs inputs. Reconstruction error (MSE) is evaluated against a 1-hour rolling window: Z = (MSE - μ_rolling) / σ_rolling. Z < 1.5σ is Nominal; 1.5σ <= Z < 3.0σ is Warning; Z >= 3.0σ triggers Critical Anomaly alert, launching CascadeGuard dependency traversal and the Local RAG Copilot diagnostic playbook.`,
    tags: ['lstm', 'autoencoder', 'z-score', '3sigma', 'anomaly', 'mse', 'rolling', 'pytorch'],
  },
  {
    id: 'spec_4.2',
    title: 'OEM Emergency Standard Operating Procedures (SOP)',
    section: 'Section 4.3: OEM Manual Guidelines',
    content: `Generator Failure / High Temperature (>85°C): Step 1: Immediately switch microgrid load to backup generator GEN-02. Step 2: Inspect secondary coolant line valve V-04. Step 3: Check bearing oil viscosity and verify fuel pre-heater line. Water Pump Cavitation / Freeze-up (Lake Priyadarshini): Step 1: Verify intake pipe electrical heating element current. Step 2: Clear ice blockage at pump intake screen. Step 3: Enable circulation pump PUMP-02. Radar Dish Boresight Misalignment: Step 1: Read wind vector (>80 km/h gust threshold). Step 2: Compute phase drift Δφ = 2πΔx/λ. Step 3: Feed compensating motor encoder vectors to pointing drives.`,
    tags: ['sop', 'oem', 'manual', 'repair', 'coolant', 'valve', 'priyadarshini', 'boresight', 'generator', 'fails', 'freeze'],
  },
];

// Helper to retrieve relevant context chunks using keyword relevance
export function retrieveContext(query: string, limit: number = 4): KnowledgeChunk[] {
  const normalizedQuery = query.toLowerCase();
  const keywords = normalizedQuery.split(/\W+/).filter((w) => w.length > 2);

  const scored = KNOWLEDGE_BASE.map((chunk) => {
    let score = 0;
    const textToSearch = `${chunk.title} ${chunk.section} ${chunk.content} ${chunk.tags.join(' ')}`.toLowerCase();

    for (const kw of keywords) {
      if (chunk.tags.some((tag) => tag.includes(kw))) score += 4;
      const count = (textToSearch.match(new RegExp(kw, 'g')) || []).length;
      score += count;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.chunk);
}

// Get API Key from env or window config
export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '') return envKey.trim();
  const storedKey = localStorage.getItem('dakshin_gemini_api_key');
  return storedKey ? storedKey.trim() : '';
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem('dakshin_gemini_api_key', key.trim());
}

// Call Gemini API with grounded context & telemetry state
export async function queryGeminiRag(
  userQuery: string,
  stationId: string,
  activeTelemetryContext?: string
): Promise<RagResponse> {
  const apiKey = getGeminiApiKey();
  const relevantChunks = retrieveContext(userQuery, 4);
  const citations = relevantChunks.map((c) => ({ id: c.id, title: c.title, section: c.section }));

  const contextText = relevantChunks
    .map((c) => `[DOCUMENT ${c.id}: ${c.title} (${c.section})]\n${c.content}`)
    .join('\n\n');

  if (!apiKey) {
    return generateOfflineFallbackResponse(userQuery, relevantChunks, citations);
  }

  const systemInstruction = `You are DAKSHIN Antarctic Station Engineering Copilot, an expert technical assistant for station engineers at Maitri (Schirmacher Oasis) and Bharati (Larsemann Hills), as well as MoES polar research projects (Maitri-II, PRITHVI Scheme, Digital Twin Predictive Maintenance).

CRITICAL FORMATTING INSTRUCTIONS:
1. Provide a direct, highly practical, step-by-step engineering answer.
2. DO NOT use raw asterisks, markdown code blocks, decorative symbols, or unnecessary formatting characters. Write clean, direct prose and numbered steps (Step 1, Step 2, Step 3).
3. Explicitly state the immediate actions the engineer must take on the field.
4. Clearly state potential downstream impacts (labeled as POTENTIALLY AFFECTED) according to CascadeGuard dependency rules.

CURRENT STATION: ${stationId.toUpperCase()}
ACTIVE TELEMETRY CONTEXT: ${activeTelemetryContext || 'Station Operating Nominally.'}

STATION RESEARCH & ARCHITECTURE SPECIFICATIONS:
${contextText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nENGINEER QUESTION: ${userQuery}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
          },
        }),
      }
    );

    if (!response.ok) {
      const fallbackResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\nENGINEER QUESTION: ${userQuery}` }] }],
          }),
        }
      );
      if (!fallbackResp.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const fallbackData = await fallbackResp.json();
      const text = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return {
          answer: cleanFormatting(text),
          citations,
          confidence: 'HIGH',
          suggestedActions: extractSuggestedActions(text),
        };
      }
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No text generated by Gemini');
    }

    return {
      answer: cleanFormatting(generatedText),
      citations,
      confidence: 'HIGH',
      suggestedActions: extractSuggestedActions(generatedText),
    };
  } catch (err) {
    console.warn('Gemini API call failed, using local grounded knowledge base:', err);
    return generateOfflineFallbackResponse(userQuery, relevantChunks, citations);
  }
}

function cleanFormatting(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .trim();
}

function generateOfflineFallbackResponse(
  query: string,
  chunks: KnowledgeChunk[],
  citations: { id: string; title: string; section: string }[]
): RagResponse {
  const qLower = query.toLowerCase();

  if (qLower.includes('maitri-ii') || qLower.includes('maitri 2') || qLower.includes('replacement')) {
    return {
      answer: `MAITRI-II ANTARCTIC STATION STATUS REPORT:\n\nStep 1: Background - Existing Maitri station (commissioned 1989) has exceeded its design lifespan and suffers from structural deterioration and waste-management constraints.\nStep 2: Design Consortium - Ramboll Deutschland GmbH & bofArchitekten (Germany) won the global design competition.\nStep 3: Parliamentary Directive - Committee recommends active involvement of indigenous Indian firms and Army cold-weather engineering to enhance Make in India self-reliance.`,
      citations: [{ id: 'moes_2.1', title: 'Maitri-II Research Station', section: 'MoES 411th Report' }],
      confidence: 'HIGH',
      suggestedActions: ['Review Maitri Structural Degradation Log', 'Inspect Environmental Compliance Systems'],
    };
  }

  if (qLower.includes('vessel') || qLower.includes('prv') || qLower.includes('ice-breaker') || qLower.includes('ncpor')) {
    return {
      answer: `NCPOR POLAR RESEARCH VESSEL (PRV) SPECIFICATIONS:\n\nStep 1: In-principle approval granted by Department of Expenditure for ₹2,329.40 crore.\nStep 2: Designed with dedicated ice-breaking capabilities for Arctic (Himadri, Svalbard) and Antarctic expeditions.\nStep 3: Encouraging domestic Indian shipbuilding participation to build long-term extreme-environment maritime capability.`,
      citations: [{ id: 'moes_2.2', title: 'NCPOR Polar Research Vessel', section: 'MoES 411th Report' }],
      confidence: 'HIGH',
      suggestedActions: ['Check NCPOR Expedition Logistics', 'Review Himadri Svalbard Telemetry'],
    };
  }

  if (qLower.includes('digital twin') || qLower.includes('predictive') || qLower.includes('rul') || qLower.includes('shadow')) {
    return {
      answer: `DIGITAL TWIN & PREDICTIVE MAINTENANCE TAXONOMY (VAN DINTER 2022):\n\nStep 1: Digital Twin Patterns - Digital Shadow (one-way streaming), Digital Monitor (condition monitoring & RUL estimation), and Digital Control (automated two-way synchronization).\nStep 2: AI Algorithms - Seq2Seq LSTM Autoencoders (unsupervised reconstruction MSE), CNNs for vibration spectral analysis, and SVMs for fault diagnosis.\nStep 3: Protocols & Sensors - Standardized using MQTT over TCP/IP, OPC UA, and Modbus across vibration, torque, temperature, and current state parameters.`,
      citations: [{ id: 'dt_3.1', title: 'Digital Twins Systematic Review', section: 'van Dinter et al. 2022' }],
      confidence: 'HIGH',
      suggestedActions: ['Inspect Seq2Seq LSTM Autoencoder MSE', 'Verify MQTT Topic Schema'],
    };
  }

  if (qLower.includes('generator') || qLower.includes('gen-01') || qLower.includes('fails') || qLower.includes('fail')) {
    return {
      answer: `EMERGENCY GENERATOR FAILURE SOP (GEN-01):\n\nStep 1: Instantly shift station electrical microgrid load to Backup Genset GEN-02.\nStep 2: Inspect secondary coolant line Valve V-04 for thermal blockage or pressure drop.\nStep 3: Check bearing oil viscosity and verify fuel pre-heater pipeline loop.\n\nCASCADEGUARD IMPACT ASSESSMENT:\nDownstream systems marked as POTENTIALLY AFFECTED: Power Microgrid Bus, Lake Priyadarshini Water Circulation Pump (PUMP-01), Habitat Heating Circuit, and ISRO AGEOS Satellite Tracking Dish.`,
      citations: [
        { id: 'spec_3.1', title: 'CascadeGuard Engine', section: 'Section 3.1' },
        { id: 'spec_4.2', title: 'OEM Manual Guidelines', section: 'Section 4.3' },
      ],
      confidence: 'HIGH',
      suggestedActions: ['Switch Microgrid Load to GEN-02', 'Inspect Coolant Valve V-04', 'Verify CascadeGuard Impact Graph'],
    };
  }

  const top = chunks.length > 0 ? chunks[0] : KNOWLEDGE_BASE[0];
  return {
    answer: `${top.title.toUpperCase()}\n\n${cleanFormatting(top.content)}\n\nCASCADEGUARD RULE: All downstream dependent systems remain labeled POTENTIALLY AFFECTED until live telemetry verification.`,
    citations,
    confidence: 'MEDIUM',
    suggestedActions: ['Review Station Telemetry', 'Verify CascadeGuard Dependency Graph'],
  };
}

function extractSuggestedActions(text: string): string[] {
  const actions: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes('maitri') || lower.includes('ramboll')) {
    actions.push('Review Maitri-II Consortium Architecture', 'Check Environmental Compliance Log');
  }
  if (lower.includes('digital twin') || lower.includes('rul')) {
    actions.push('Check LSTM Autoencoder RUL Metric', 'Inspect Digital Shadow Data Stream');
  }
  if (lower.includes('gen') || lower.includes('generator') || lower.includes('coolant')) {
    actions.push('Switch to Backup Genset GEN-02', 'Inspect Secondary Coolant Valve V-04');
  }
  if (actions.length === 0) {
    actions.push('Review Station Telemetry', 'Verify System Alarms');
  }
  return actions;
}
