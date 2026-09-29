import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
  Key,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useStation } from '../../context/StationContext';
import { queryGeminiRag, getGeminiApiKey, saveGeminiApiKey } from '../../services/geminiRagService';
import type { RagResponse } from '../../services/geminiRagService';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  citations?: { id: string; title: string; section: string }[];
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedActions?: string[];
  isFallback?: boolean;
}

interface RagCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'What to do if Generator GEN-01 fails completely?',
  'What is the plan for Maitri-II replacement research station?',
  'How does Digital Twin RUL prediction and LSTM Autoencoder work?',
  'What are the specs for NCPOR Ice-Class Polar Research Vessel (PRV)?',
  'Lake Priyadarshini water pump freeze-up - what is the emergency SOP?',
  'ISRO AGEOS tracking dish boresight loss in 120 km/h wind - how to compensate?',
];

// Clean text renderer that converts raw text into structured engineering steps
const FormattedMessageText: React.FC<{ text: string }> = ({ text }) => {
  const clean = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '');

  const lines = clean.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Render Step badges cleanly
        if (trimmed.startsWith('Step ') || /^\d+\./.test(trimmed)) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                backgroundColor: 'rgba(0, 78, 100, 0.06)',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                borderLeft: '3px solid #00A896',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--deep-teal)',
                lineHeight: '1.45',
              }}
            >
              <CheckCircle2 size={15} style={{ marginTop: '2px', flexShrink: 0, color: '#00A896' }} />
              <span>{trimmed}</span>
            </div>
          );
        }

        // Render Headings / SOP Titles
        if (trimmed.endsWith(':') && trimmed.length < 60) {
          return (
            <div key={idx} style={{ fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.4rem', fontSize: '0.88rem', letterSpacing: '0.02em' }}>
              {trimmed}
            </div>
          );
        }

        return (
          <div key={idx} style={{ lineHeight: '1.5' }}>
            {trimmed}
          </div>
        );
      })}
    </div>
  );
};

export const RagCopilotDrawer: React.FC<RagCopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { selectedStation } = useStation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      sender: 'copilot',
      text: `Greetings, Engineer. I am DAKSHIN Engineering Copilot, grounded in master research specifications for ${
        selectedStation?.name || 'Antarctic Operations'
      }.\n\nAsk me any diagnostic question or select an emergency operating procedure below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: 'HIGH',
      citations: [
        { id: 'spec_1.1', title: 'Executive Mission', section: 'Executive Summary' },
        { id: 'spec_3.1', title: 'CascadeGuard Engine', section: 'Section 3.1' },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [activeKey, setActiveKey] = useState(getGeminiApiKey());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveKey(getGeminiApiKey());
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const telemetryContext = selectedStation
        ? `Station ID: ${selectedStation.id}, Name: ${selectedStation.name}, Location: ${selectedStation.location}`
        : 'Maitri & Bharati Telemetry Active';

      const response: RagResponse = await queryGeminiRag(query, selectedStation?.id || 'maitri', telemetryContext);

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'copilot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
        confidence: response.confidence,
        suggestedActions: response.suggestedActions,
        isFallback: response.isFallback,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'copilot',
          text: `An error occurred while connecting to the Gemini RAG engine: ${
            err instanceof Error ? err.message : 'Unknown Error'
          }`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          confidence: 'LOW',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (apiKeyInput.trim()) {
      saveGeminiApiKey(apiKeyInput.trim());
      setActiveKey(apiKeyInput.trim());
      setApiKeyInput('');
      setShowKeyModal(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 20, 30, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {/* Copilot Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(20px)',
              boxShadow: '-12px 0 40px rgba(0, 78, 100, 0.25)',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid rgba(0, 78, 100, 0.15)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(0, 78, 100, 0.12)',
                backgroundColor: 'rgba(0, 78, 100, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #004E64 0%, #00A896 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(0, 168, 150, 0.35)',
                  }}
                >
                  <Bot size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-teal)', margin: 0 }}>
                      DAKSHIN RAG Copilot
                    </h3>
                    <span
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} className="status-dot-pulse" />
                      AI COPILOT ACTIVE
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Research Grounded • Maitri & Bharati Diagnostics
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowKeyModal(!showKeyModal)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: showKeyModal ? 'rgba(0,78,100,0.1)' : 'transparent',
                    border: 'none',
                    color: 'var(--deep-teal)',
                    cursor: 'pointer',
                  }}
                  title="API Key Configuration"
                >
                  <Key size={18} />
                </button>

                <button
                  onClick={onClose}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* API Key Modal Drawer Header Overlay */}
            {showKeyModal && (
              <div
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: '#F0F9FF',
                  borderBottom: '1px solid #BAE6FD',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0369A1', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Key size={14} /> API Key Configuration
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    placeholder="Enter API key..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #7DD3FC',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveKey}
                    style={{
                      backgroundColor: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Chat Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '0.9rem 1.1rem',
                      borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: msg.sender === 'user' ? 'var(--deep-teal)' : '#FFFFFF',
                      color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-dark)',
                      boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(0, 78, 100, 0.25)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(0, 78, 100, 0.1)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <FormattedMessageText text={msg.text} />

                    {/* Grounding Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.85rem',
                          paddingTop: '0.65rem',
                          borderTop: '1px dashed rgba(0, 78, 100, 0.15)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.4rem',
                        }}
                      >
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FileText size={12} /> Research Sources:
                        </span>
                        {msg.citations.map((c) => (
                          <span
                            key={c.id}
                            style={{
                              backgroundColor: 'rgba(0, 78, 100, 0.08)',
                              color: 'var(--deep-teal)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            [{c.title}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      padding: '0 4px',
                    }}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--deep-teal)', fontSize: '0.82rem', fontWeight: 600 }}>
                  <RefreshCw size={16} className="animate-spin" />
                  Analyzing Station Specifications & Generating SOP...
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Field Engineer Prompts */}
            <div
              style={{
                padding: '0.75rem 1.5rem',
                borderTop: '1px solid rgba(0, 78, 100, 0.08)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Field Engineer Emergency SOPs
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    style={{
                      backgroundColor: 'rgba(0, 78, 100, 0.06)',
                      border: '1px solid rgba(0, 78, 100, 0.12)',
                      borderRadius: '9999px',
                      padding: '5px 13px',
                      fontSize: '0.74rem',
                      color: 'var(--deep-teal)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 78, 100, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 78, 100, 0.06)')}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(0, 78, 100, 0.12)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{ display: 'flex', gap: '0.6rem' }}
              >
                <input
                  type="text"
                  placeholder="Ask field diagnostic question (e.g. what to do if generator fails)..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 78, 100, 0.2)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    backgroundColor: 'rgba(240, 244, 248, 0.6)',
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputQuery.trim()}
                  style={{
                    backgroundColor: 'var(--deep-teal)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isLoading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !inputQuery.trim() ? 0.5 : 1,
                    boxShadow: '0 4px 12px rgba(0, 78, 100, 0.2)',
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
