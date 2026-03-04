/**
 * WSJF Calculator - v4.1 (Signal Strength)
 *
 * Weighted Shortest Job First (WSJF) prioritization tool for SAFe/Agile teams.
 * Helps teams prioritize work based on Cost of Delay divided by effort (sprints).
 *
 * Formula: WSJF = Cost of Delay / Number of Sprints
 * Where Cost of Delay = (AdjustedUV x weight) + (TC x weight) + (RR x weight) + (CR x weight)
 *
 * Changes in v4.1:
 * - User Value (UV) now uses Signal Strength algorithm with weighted multi-voter input
 * - UV votes capture persona, service, and voter ID for traceability
 * - Signal Strength = Volume x ServiceSpread x PersonaSpread x Consensus (capped at 2.0)
 * - Adjusted UV = Weighted UV Average x Signal Strength
 * - CSV/PDF exports include vote count, unique services/personas, signal strength, adjusted UV
 * - Data persists to localStorage (survives page refresh)
 * - TC, RR, CR, Sprints remain single-value inputs (unchanged)
 */

'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HelpCircle, Trash2, Database, Sun, Moon, FileDown, FileText, Edit2, Plus, ChevronDown, ChevronUp, Users } from 'lucide-react';

// ===========================
// SIGNAL STRENGTH TYPES
// ===========================

type PersonaType =
  | 'USCYBERCOM'
  | 'Operator'
  | 'Trainer'
  | 'ContentAuthor'
  | 'Leadership'
  | 'PlatformMaintainer';

type ServiceType =
  | 'USCYBERCOM'
  | 'ARCYBER'
  | 'FLTCYBER'
  | 'MARFORCYBER'
  | 'AFCYBER'
  | 'Other';

interface UVVote {
  id: string;
  score: number;
  persona: PersonaType;
  service: ServiceType;
  voterId: string;
  timestamp: string;
}

interface SignalStrengthBreakdown {
  weightedUVAverage: number;
  volumeFactor: number;
  serviceSpreadBonus: number;
  personaSpreadBonus: number;
  consensusBonus: number;
  uncappedSignalStrength: number;
}

interface SignalStrengthResult {
  adjustedUV: number;
  signalStrength: number;
  breakdown: SignalStrengthBreakdown;
}

// ===========================
// SIGNAL STRENGTH CONSTANTS
// ===========================

const PERSONA_WEIGHTS: Record<PersonaType, number> = {
  USCYBERCOM: 1.4,
  Operator: 1.3,
  Trainer: 1.1,
  ContentAuthor: 1.0,
  Leadership: 0.9,
  PlatformMaintainer: 0.85,
};

const PERSONA_LABELS: Record<PersonaType, string> = {
  USCYBERCOM: 'USCYBERCOM (J7 Staff)',
  Operator: 'Operator',
  Trainer: 'Trainer',
  ContentAuthor: 'Content Author / Range Engineer',
  Leadership: 'Leadership',
  PlatformMaintainer: 'Platform Maintainer',
};

const SERVICE_LABELS: Record<ServiceType, string> = {
  USCYBERCOM: 'USCYBERCOM',
  ARCYBER: 'ARCYBER',
  FLTCYBER: 'FLTCYBER',
  MARFORCYBER: 'MARFORCYBER',
  AFCYBER: 'AFCYBER',
  Other: 'Other',
};

const ALL_PERSONAS: PersonaType[] = [
  'USCYBERCOM', 'Operator', 'Trainer', 'ContentAuthor', 'Leadership', 'PlatformMaintainer'
];

const ALL_SERVICES: ServiceType[] = [
  'USCYBERCOM', 'ARCYBER', 'FLTCYBER', 'MARFORCYBER', 'AFCYBER', 'Other'
];

const SIGNAL_STRENGTH_CAP = 2.0;
const DEFAULT_UV = 3;

const STORAGE_KEYS = {
  INITIATIVES: 'wsjf_initiatives',
  WEIGHTS: 'wsjf_weights',
  DARK_MODE: 'darkMode',
};

// ===========================
// SIGNAL STRENGTH ALGORITHM
// ===========================

function calculateWeightedUVAverage(votes: UVVote[]): number {
  if (votes.length === 0) return DEFAULT_UV;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const vote of votes) {
    const weight = PERSONA_WEIGHTS[vote.persona];
    weightedSum += vote.score * weight;
    totalWeight += weight;
  }
  return weightedSum / totalWeight;
}

function calculateVolumeFactor(voterCount: number): number {
  if (voterCount <= 0) return 0.85;
  const rawFactor = 0.8 + (Math.log2(voterCount) * 0.1);
  return Math.min(1.2, Math.max(0.85, rawFactor));
}

function calculateServiceSpreadBonus(votes: UVVote[]): number {
  const uniqueServices = new Set(votes.map(v => v.service));
  const serviceCount = uniqueServices.size;
  const bonus = 1.0 + (0.15 * (serviceCount - 1));
  return Math.min(1.6, bonus);
}

function calculatePersonaSpreadBonus(votes: UVVote[]): number {
  const uniquePersonas = new Set(votes.map(v => v.persona));
  const personaCount = uniquePersonas.size;
  const bonus = 1.0 + (0.1 * (personaCount - 1));
  return Math.min(1.5, bonus);
}

function calculateConsensusBonus(votes: UVVote[]): number {
  if (votes.length < 2) return 1.0;
  const scores = votes.map(v => v.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  const cov = mean > 0 ? stdDev / mean : 0;
  const bonus = 1.0 + (0.15 * (1 - cov));
  return Math.max(1.0, Math.min(1.15, bonus));
}

function calculateAdjustedUV(votes: UVVote[]): SignalStrengthResult {
  if (votes.length === 0) {
    return {
      adjustedUV: DEFAULT_UV,
      signalStrength: 1.0,
      breakdown: {
        weightedUVAverage: DEFAULT_UV,
        volumeFactor: 1.0,
        serviceSpreadBonus: 1.0,
        personaSpreadBonus: 1.0,
        consensusBonus: 1.0,
        uncappedSignalStrength: 1.0,
      },
    };
  }

  const weightedUVAverage = calculateWeightedUVAverage(votes);
  const uniqueVoters = new Set(votes.map(v => v.voterId));
  const voterCount = uniqueVoters.size;
  const volumeFactor = calculateVolumeFactor(voterCount);
  const serviceSpreadBonus = calculateServiceSpreadBonus(votes);
  const personaSpreadBonus = calculatePersonaSpreadBonus(votes);
  const consensusBonus = calculateConsensusBonus(votes);

  const uncappedSignalStrength = volumeFactor * serviceSpreadBonus * personaSpreadBonus * consensusBonus;
  const signalStrength = Math.min(SIGNAL_STRENGTH_CAP, uncappedSignalStrength);
  const adjustedUV = weightedUVAverage * signalStrength;

  return {
    adjustedUV,
    signalStrength,
    breakdown: {
      weightedUVAverage,
      volumeFactor,
      serviceSpreadBonus,
      personaSpreadBonus,
      consensusBonus,
      uncappedSignalStrength,
    },
  };
}

// ===========================
// DATA MIGRATION
// ===========================

function migrateInitiative(raw: any): Initiative {
  if (Array.isArray(raw.uvVotes)) {
    return raw as Initiative;
  }
  const legacyUV = typeof raw.uv === 'number' ? raw.uv : DEFAULT_UV;
  return {
    id: raw.id,
    createdAt: raw.createdAt,
    name: raw.name,
    uvVotes: [{
      id: `legacy-${raw.id}`,
      score: legacyUV,
      persona: 'Operator' as PersonaType,
      service: 'USCYBERCOM' as ServiceType,
      voterId: 'legacy',
      timestamp: raw.createdAt || new Date().toISOString(),
    }],
    tc: raw.tc,
    rr: raw.rr,
    cr: raw.cr,
    jobSize: raw.jobSize,
  };
}

// ===========================
// CONSTANTS & SCORING SCALES
// ===========================

const SIMPLE_SCORES = [1, 2, 3, 4, 5];
const SPRINT_SCORES = [1, 2, 3, 4, 5, 6];

// ===========================
// SCORING DEFINITIONS
// ===========================

const definitions = {
  uv: {
    1: 'Minimal user benefit; purely technical or internal.',
    2: 'Small improvement; affects a limited group or edge case.',
    3: 'Moderate value; addresses a common user need.',
    4: 'High value; significant impact on mission readiness.',
    5: 'Major value; transforms user capability or removes critical blocker.'
  },
  tc: {
    1: 'No time pressure; do anytime.',
    2: 'Some urgency; within the next few PIs.',
    3: 'Moderate criticality; within 1-2 PIs.',
    4: 'Urgent; must deliver this PI or face impact.',
    5: 'Severe criticality; miss this PI = mission failure or penalty.'
  },
  rr: {
    1: 'No risk mitigation; does not affect reliability.',
    2: 'Minor risk reduction; addresses low-probability issues.',
    3: 'Moderate risk reduction; improves system stability.',
    4: 'High risk reduction; prevents major outage scenario.',
    5: 'Prevents high-impact failure; eliminates existential risk.'
  },
  cr: {
    1: 'No compliance requirement.',
    2: 'Internal policy alignment; nice to have.',
    3: 'Recommended by audit; should address.',
    4: 'Required by regulation or SLA within defined timeline.',
    5: 'Mandated by law, DoD directive, or immediate SLA breach risk.'
  }
};

// ===========================
// THEME CONFIGURATION
// ===========================

const getTheme = (isDark: boolean) => ({
  background: isDark ? '#111827' : '#f3f4f6',
  cardBackground: isDark ? '#1f2937' : '#ffffff',
  textPrimary: isDark ? '#f9fafb' : '#111827',
  textSecondary: isDark ? '#d1d5db' : '#4b5563',
  textMuted: isDark ? '#9ca3af' : '#6b7280',
  border: isDark ? '#374151' : '#e5e7eb',
  borderAccent: isDark ? '#4b5563' : '#d1d5db',
  toggleBg: isDark ? '#374151' : '#e5e7eb',
  toggleText: isDark ? '#e5e7eb' : '#1f2937',
  sliderBg: isDark ? '#4b5563' : '#d1d5db',
  sliderThumb: '#3b82f6',
  buttonPrimary: '#3b82f6',
  buttonSuccess: '#10b981',
  buttonDanger: '#ef4444',
  hoverOverlay: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
});

// ===========================
// DATA MODEL
// ===========================

interface Initiative {
  id: string;
  createdAt: string;
  name: string;
  uvVotes: UVVote[];
  tc: number;
  rr: number;
  cr: number;
  jobSize: number;
}

// ===========================
// UI COMPONENTS
// ===========================

const DarkModeToggle = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => {
  const theme = getTheme(isDark);

  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '24px',
        backgroundColor: theme.toggleBg,
        color: theme.toggleText,
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 150ms ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <>
          <Sun style={{ width: '20px', height: '20px' }} />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon style={{ width: '20px', height: '20px' }} />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};

type TooltipProps = { text: string; children: React.ReactNode; theme: any };
const Tooltip = ({ text, children, theme }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            width: '288px',
            padding: '12px',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#1f2937',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            lineHeight: '1.4'
          }}
        >
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1f2937'
          }} />
        </div>
      )}
    </div>
  );
};

interface ScoringSliderProps {
  name: string;
  value: number;
  handler: (e: { target: { name: string; value: number } }) => void;
  tooltipText: string;
  label: string;
  definitions: Record<number, string>;
  theme: any;
  isJobSize?: boolean;
}

const ScoringSlider = ({
  name,
  value,
  handler,
  tooltipText,
  label,
  definitions: defs,
  theme,
  isJobSize = false
}: ScoringSliderProps): React.JSX.Element => {
  const allowedScores = isJobSize ? SPRINT_SCORES : SIMPLE_SCORES;
  const valueIndex = allowedScores.indexOf(value);

  const handleChange = (e: { target: { value: string } }) => {
    const newIndex = parseInt(e.target.value, 10);
    const newValue = allowedScores[newIndex];
    handler({ target: { name: name, value: newValue } });
  };

  const currentDefinition = defs[value];

  return (
    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label htmlFor={name} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: theme.textSecondary }}>
          {label}
          <Tooltip text={tooltipText} theme={theme}>
            <HelpCircle style={{ width: '16px', height: '16px', marginLeft: '6px', color: theme.textMuted, cursor: 'help' }} />
          </Tooltip>
        </label>
        <span style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#60a5fa',
          backgroundColor: theme.sliderBg,
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max={allowedScores.length - 1}
        value={valueIndex}
        onChange={handleChange}
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.sliderBg,
          borderRadius: '8px',
          appearance: 'none',
          cursor: 'pointer',
          outline: 'none'
        }}
      />
      <div style={{
        fontSize: '12px',
        color: theme.textMuted,
        marginTop: '8px',
        lineHeight: '1.4',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'flex-start'
      }}>
        {currentDefinition}
      </div>
    </div>
  );
};

interface ConfigPanelProps {
  onConfigTest: () => void;
  onClearData: () => void;
  theme: any;
}
const ConfigPanel = ({ onConfigTest, onClearData, theme }: ConfigPanelProps) => (
  <div style={{
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: `1px solid #3b82f6`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Database style={{ width: '20px', height: '20px', color: '#60a5fa', marginRight: '8px' }} />
        <span style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary }}>Storage Mode: localStorage</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onConfigTest}
          style={{
            fontSize: '12px',
            backgroundColor: theme.sliderBg,
            color: theme.textPrimary,
            padding: '6px 12px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 150ms ease'
          }}
        >
          Test Config
        </button>
        <button
          onClick={onClearData}
          style={{
            fontSize: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 150ms ease'
          }}
        >
          Clear All Data
        </button>
      </div>
    </div>
    <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '8px' }}>
      Data persists across page refreshes via localStorage. Use &quot;Clear All Data&quot; to reset.
    </p>
  </div>
);

// ===========================
// UV VOTE FORM COMPONENT
// ===========================

interface UVVoteFormProps {
  votes: UVVote[];
  onVotesChange: (votes: UVVote[]) => void;
  theme: any;
}

const UVVoteForm = ({ votes, onVotesChange, theme }: UVVoteFormProps) => {
  const [currentVote, setCurrentVote] = useState({
    score: 3,
    persona: 'Operator' as PersonaType,
    service: 'USCYBERCOM' as ServiceType,
    voterId: '',
  });
  const [editingVoteId, setEditingVoteId] = useState<string | null>(null);

  const signalResult = calculateAdjustedUV(votes);

  const handleAddVote = () => {
    if (!currentVote.voterId.trim()) {
      alert('Please enter a Voter ID.');
      return;
    }

    if (editingVoteId) {
      const updated = votes.map(v =>
        v.id === editingVoteId
          ? { ...v, score: currentVote.score, persona: currentVote.persona, service: currentVote.service, voterId: currentVote.voterId.trim() }
          : v
      );
      onVotesChange(updated);
      setEditingVoteId(null);
    } else {
      const newVote: UVVote = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        score: currentVote.score,
        persona: currentVote.persona,
        service: currentVote.service,
        voterId: currentVote.voterId.trim(),
        timestamp: new Date().toISOString(),
      };
      onVotesChange([...votes, newVote]);
    }

    setCurrentVote({ score: 3, persona: 'Operator', service: 'USCYBERCOM', voterId: '' });
  };

  const handleEditVote = (vote: UVVote) => {
    setCurrentVote({
      score: vote.score,
      persona: vote.persona,
      service: vote.service,
      voterId: vote.voterId,
    });
    setEditingVoteId(vote.id);
  };

  const handleDeleteVote = (voteId: string) => {
    onVotesChange(votes.filter(v => v.id !== voteId));
    if (editingVoteId === voteId) {
      setEditingVoteId(null);
      setCurrentVote({ score: 3, persona: 'Operator', service: 'USCYBERCOM', voterId: '' });
    }
  };

  const handleCancelEdit = () => {
    setEditingVoteId(null);
    setCurrentVote({ score: 3, persona: 'Operator', service: 'USCYBERCOM', voterId: '' });
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme.background,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
    flex: 1,
    minWidth: '140px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme.background,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
    flex: 1,
    minWidth: '120px',
  };

  return (
    <div style={{
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: theme.cardBackground,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Users style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
        <span style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary }}>
          User Value (UV) - Signal Strength Voting
        </span>
        <Tooltip text="User Value is now calculated from multiple weighted votes. Each voter selects a score (1-5), their persona, and service. The Signal Strength algorithm adjusts the UV based on voter volume, service/persona diversity, and consensus." theme={theme}>
          <HelpCircle style={{ width: '16px', height: '16px', color: theme.textMuted, cursor: 'help' }} />
        </Tooltip>
      </div>

      {/* Vote input form */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: theme.background,
        borderRadius: '6px',
      }}>
        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: theme.textSecondary }}>Score (1-5)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="1"
              max="5"
              value={currentVote.score}
              onChange={(e) => setCurrentVote(prev => ({ ...prev, score: parseInt(e.target.value) }))}
              style={{
                width: '80px',
                height: '6px',
                backgroundColor: theme.sliderBg,
                borderRadius: '6px',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#60a5fa',
              backgroundColor: theme.sliderBg,
              padding: '2px 8px',
              borderRadius: '4px',
              minWidth: '24px',
              textAlign: 'center',
            }}>
              {currentVote.score}
            </span>
          </div>
        </div>

        {/* Persona */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '160px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: theme.textSecondary }}>Persona</label>
          <select
            value={currentVote.persona}
            onChange={(e) => setCurrentVote(prev => ({ ...prev, persona: e.target.value as PersonaType }))}
            style={selectStyle}
          >
            {ALL_PERSONAS.map(p => (
              <option key={p} value={p}>{PERSONA_LABELS[p]} ({PERSONA_WEIGHTS[p]}x)</option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: theme.textSecondary }}>Service</label>
          <select
            value={currentVote.service}
            onChange={(e) => setCurrentVote(prev => ({ ...prev, service: e.target.value as ServiceType }))}
            style={selectStyle}
          >
            {ALL_SERVICES.map(s => (
              <option key={s} value={s}>{SERVICE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Voter ID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '120px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: theme.textSecondary }}>Voter ID</label>
          <input
            type="text"
            placeholder="e.g., SGT Smith"
            value={currentVote.voterId}
            onChange={(e) => setCurrentVote(prev => ({ ...prev, voterId: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddVote(); }}
            style={inputStyle}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddVote}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              backgroundColor: editingVoteId ? '#f59e0b' : '#3b82f6',
              color: 'white',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {editingVoteId ? (
              <><Edit2 style={{ width: '14px', height: '14px' }} /> Update Vote</>
            ) : (
              <><Plus style={{ width: '14px', height: '14px' }} /> Add Vote</>
            )}
          </button>
          {editingVoteId && (
            <button
              onClick={handleCancelEdit}
              style={{
                padding: '8px 12px',
                backgroundColor: theme.sliderBg,
                color: theme.textPrimary,
                fontWeight: '500',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Votes table */}
      {votes.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '8px' }}>
            Votes ({votes.length}):
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: theme.textMuted, fontWeight: '500' }}>Score</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Persona</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Service</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Voter</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', color: theme.textMuted, fontWeight: '500' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {votes.map(vote => (
                  <tr key={vote.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: theme.textPrimary }}>
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontWeight: '600',
                        fontSize: '12px',
                      }}>
                        {vote.score}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: theme.textSecondary }}>{PERSONA_LABELS[vote.persona]}</td>
                    <td style={{ padding: '6px 8px', color: theme.textSecondary }}>{SERVICE_LABELS[vote.service]}</td>
                    <td style={{ padding: '6px 8px', color: theme.textSecondary }}>{vote.voterId}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleEditVote(vote)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#60a5fa', padding: '4px', borderRadius: '4px',
                        }}
                        title="Edit vote"
                      >
                        <Edit2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteVote(vote.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#ef4444', padding: '4px', borderRadius: '4px', marginLeft: '4px',
                        }}
                        title="Delete vote"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signal strength breakdown */}
      <div style={{
        padding: '12px',
        backgroundColor: theme.background,
        borderRadius: '6px',
        fontSize: '13px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600', color: theme.textPrimary }}>Signal Strength:</span>
          <span style={{
            fontWeight: 'bold',
            color: votes.length === 0 ? theme.textMuted : '#60a5fa',
            fontSize: '16px',
          }}>
            {signalResult.signalStrength.toFixed(2)}x
          </span>
          <span style={{ color: theme.textMuted }}>
            | Adjusted UV: <strong style={{ color: '#60a5fa' }}>{signalResult.adjustedUV.toFixed(2)}</strong>
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '6px',
          color: theme.textMuted,
        }}>
          <span>Wt. Avg: <strong style={{ color: theme.textSecondary }}>{signalResult.breakdown.weightedUVAverage.toFixed(2)}</strong></span>
          <span>Volume: <strong style={{ color: theme.textSecondary }}>{signalResult.breakdown.volumeFactor.toFixed(2)}</strong> ({new Set(votes.map(v => v.voterId)).size} voters)</span>
          <span>Svc Spread: <strong style={{ color: theme.textSecondary }}>{signalResult.breakdown.serviceSpreadBonus.toFixed(2)}</strong> ({new Set(votes.map(v => v.service)).size} svc)</span>
          <span>Persona: <strong style={{ color: theme.textSecondary }}>{signalResult.breakdown.personaSpreadBonus.toFixed(2)}</strong> ({new Set(votes.map(v => v.persona)).size} types)</span>
          <span>Consensus: <strong style={{ color: theme.textSecondary }}>{signalResult.breakdown.consensusBonus.toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
  );
};

// ===========================
// MAIN APP COMPONENT
// ===========================

function WSJFApp() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [weights, setWeights] = useState({ uv: 1, tc: 1, rr: 1, cr: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form state for new initiative (UV handled separately via pendingVotes)
  const [newInitiative, setNewInitiative] = useState({
    name: '',
    tc: 3,
    rr: 3,
    cr: 1,
    jobSize: 1,
  });

  // UV votes for the initiative being created
  const [pendingVotes, setPendingVotes] = useState<UVVote[]>([]);

  // Track expanded signal strength detail rows in results table
  const [expandedInitiativeId, setExpandedInitiativeId] = useState<string | null>(null);

  const theme = getTheme(isDarkMode);

  const tooltips = {
    uv: 'User Value / Training Readiness Impact: How much value this delivers to the user, reducing manual effort or enabling critical training functionality.',
    tc: 'Time Criticality / Event Dependency: Is there a specific deadline or event where delays would have severe consequences?',
    rr: 'Risk Reduction / Opportunity Enablement: Does this reduce operational/technical risk or enable significant future opportunities?',
    cr: 'Compliance / Regulatory / SLA: Is this required by law, regulation, or a Service Level Agreement?',
    jobSize: 'Number of Sprints: Estimated number of sprints required to complete this objective (1-6 sprints).',
  };

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, newMode.toString());
    }
  };

  const clearAllData = useCallback(() => {
    if (confirm('Are you sure you want to clear all objectives and reset weights? This cannot be undone.')) {
      setInitiatives([]);
      setWeights({ uv: 1, tc: 1, rr: 1, cr: 1 });
      setPendingVotes([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.INITIATIVES);
        localStorage.removeItem(STORAGE_KEYS.WEIGHTS);
      }
    }
  }, []);

  // ===========================
  // EXPORT FUNCTIONS
  // ===========================

  const handleExportCsv = () => {
    if (initiatives.length === 0) {
      alert('Please add some objectives first.');
      return;
    }

    try {
      const headers = [
        'Rank', 'Objective',
        'Vote Count', 'Unique Services', 'Unique Personas',
        'Signal Strength', 'Adjusted UV',
        'TC', 'RR', 'CR', 'Sprints',
        'Cost of Delay', 'WSJF Score'
      ];

      const rows = rankedInitiatives.map((init, index) => {
        const uniqueServices = new Set(init.uvVotes.map(v => v.service)).size;
        const uniquePersonas = new Set(init.uvVotes.map(v => v.persona)).size;
        return [
          index + 1,
          `"${init.name.replace(/"/g, '""')}"`,
          init.uvVotes.length,
          uniqueServices,
          uniquePersonas,
          init.signalStrength.toFixed(2),
          init.adjustedUV.toFixed(2),
          init.tc,
          init.rr,
          init.cr,
          init.jobSize,
          init.costOfDelay.toFixed(2),
          init.wsjf.toFixed(2),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wsjf_prioritization_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please try again.');
    }
  };

  const handleExportPdf = async () => {
    if (initiatives.length === 0) {
      alert('Please add some objectives first.');
      return;
    }

    setIsExporting(true);

    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF export is only available in the browser');
      }

      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape' });

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 297, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('WSJF Prioritization Report', 148, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 148, 28, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      // Weights section
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(14, 42, 269, 28, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cost of Delay Weights', 14, 50);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`UV: ${weights.uv}x (Signal Strength)  |  TC: ${weights.tc}x  |  RR: ${weights.rr}x  |  CR: ${weights.cr}x`, 14, 58);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total Objectives: ${rankedInitiatives.length}`, 14, 65);

      doc.setTextColor(0, 0, 0);

      // Table data
      const tableData = rankedInitiatives.map((init, index) => [
        (index + 1).toString(),
        init.name,
        init.uvVotes.length.toString(),
        init.signalStrength.toFixed(2) + 'x',
        init.adjustedUV.toFixed(1),
        init.tc.toString(),
        init.rr.toString(),
        init.cr.toString(),
        init.jobSize.toString(),
        init.costOfDelay.toFixed(1),
        init.wsjf.toFixed(2),
      ]);

      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable({
          head: [['Rank', 'Objective', 'Votes', 'Signal', 'UV(Adj)', 'TC', 'RR', 'CR', 'Sprints', 'CoD', 'WSJF']],
          body: tableData,
          startY: 75,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.5
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
            1: { cellWidth: 65 },
            2: { halign: 'center', cellWidth: 16 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center', cellWidth: 18 },
            5: { halign: 'center', cellWidth: 12 },
            6: { halign: 'center', cellWidth: 12 },
            7: { halign: 'center', cellWidth: 12 },
            8: { halign: 'center', cellWidth: 18 },
            9: { halign: 'center', cellWidth: 18 },
            10: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [59, 130, 246] }
          },
          didParseCell: function(data: any) {
            if (data.row.index < 3 && data.section === 'body' && data.column.index === 0) {
              const colors = [
                [16, 185, 129],
                [245, 158, 11],
                [249, 115, 22]
              ];
              data.cell.styles.fillColor = colors[data.row.index];
              data.cell.styles.textColor = [255, 255, 255];
            }
          },
          margin: { top: 75, left: 14, right: 14 }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 200;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('WSJF = Cost of Delay / Sprints | UV = Weighted Avg x Signal Strength | Higher WSJF = Higher Priority', 148, finalY + 10, { align: 'center' });
      } else {
        let yPosition = 75;
        doc.setFontSize(9);
        doc.text('Rank | Objective | Votes | Signal | UV(Adj) | TC | RR | CR | Sprints | CoD | WSJF', 14, yPosition);
        yPosition += 5;

        tableData.forEach((row) => {
          const rowText = row.join(' | ');
          doc.text(rowText, 14, yPosition);
          yPosition += 5;
          if (yPosition > 190) {
            doc.addPage();
            yPosition = 20;
          }
        });
      }

      doc.save(`wsjf_prioritization_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWeightChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setWeights((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleInitiativeChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setNewInitiative((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };

  const addInitiative = () => {
    if (!newInitiative.name.trim()) {
      alert('Please enter an objective name.');
      return;
    }
    if (pendingVotes.length === 0) {
      alert('Please add at least one UV vote before adding the objective.');
      return;
    }
    const initiative: Initiative = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      name: newInitiative.name,
      uvVotes: [...pendingVotes],
      tc: newInitiative.tc,
      rr: newInitiative.rr,
      cr: newInitiative.cr,
      jobSize: newInitiative.jobSize,
    };
    setInitiatives((prev) => [...prev, initiative]);
    setNewInitiative({ name: '', tc: 3, rr: 3, cr: 1, jobSize: 1 });
    setPendingVotes([]);
  };

  const deleteInitiative = (id: string) => {
    setInitiatives((prev) => prev.filter((item) => item.id !== id));
    if (expandedInitiativeId === id) {
      setExpandedInitiativeId(null);
    }
  };

  const testConfiguration = () => {
    const config = {
      storageMode: 'localStorage',
      dataCount: initiatives.length,
      weights: weights,
    };
    alert(`Configuration Test:\n${JSON.stringify(config, null, 2)}`);
  };

  // ===========================
  // INITIALIZATION & EFFECTS
  // ===========================

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load dark mode
      const savedMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = savedMode ? savedMode === 'true' : prefersDark;
      setIsDarkMode(shouldUseDark);

      // Load saved initiatives (with migration for old format)
      const savedInitiatives = localStorage.getItem(STORAGE_KEYS.INITIATIVES);
      if (savedInitiatives) {
        try {
          const parsed = JSON.parse(savedInitiatives);
          if (Array.isArray(parsed)) {
            setInitiatives(parsed.map(migrateInitiative));
          }
        } catch (e) {
          console.error('Failed to load saved initiatives:', e);
        }
      }

      // Load saved weights
      const savedWeights = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
      if (savedWeights) {
        try {
          const parsed = JSON.parse(savedWeights);
          if (parsed && typeof parsed.uv === 'number') {
            setWeights(parsed);
          }
        } catch (e) {
          console.error('Failed to load saved weights:', e);
        }
      }
    }

    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Save initiatives to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.INITIATIVES, JSON.stringify(initiatives));
    }
  }, [initiatives, isLoading]);

  // Save weights to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(weights));
    }
  }, [weights, isLoading]);

  // ===========================
  // WSJF CALCULATION
  // ===========================

  const rankedInitiatives = useMemo(() => {
    return initiatives
      .map((initiative) => {
        const { uvVotes, tc, rr, cr, jobSize } = initiative;
        const uvResult = calculateAdjustedUV(uvVotes);
        const costOfDelay =
          uvResult.adjustedUV * weights.uv +
          tc * weights.tc +
          rr * weights.rr +
          cr * weights.cr;
        const effectiveJobSize = jobSize > 0 ? jobSize : 1;
        const wsjf = costOfDelay / effectiveJobSize;
        return {
          ...initiative,
          costOfDelay,
          wsjf,
          adjustedUV: uvResult.adjustedUV,
          signalStrength: uvResult.signalStrength,
          signalBreakdown: uvResult.breakdown,
        };
      })
      .sort((a, b) => b.wsjf - a.wsjf);
  }, [initiatives, weights]);

  // ===========================
  // UI HELPER FUNCTIONS
  // ===========================

  const renderWeightSlider = (
    name: string,
    value: number,
    handler: React.ChangeEventHandler<HTMLInputElement>,
    tooltipText: string,
    label: string,
  ) => (
    <div style={{ flex: 1, minWidth: '150px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label htmlFor={name} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: theme.textSecondary }}>
          {label}
          <Tooltip text={tooltipText} theme={theme}>
            <HelpCircle style={{ width: '16px', height: '16px', marginLeft: '6px', color: theme.textMuted, cursor: 'help' }} />
          </Tooltip>
        </label>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', backgroundColor: theme.sliderBg, padding: '4px 8px', borderRadius: '4px' }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={handler}
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.sliderBg,
          borderRadius: '8px',
          appearance: 'none',
          cursor: 'pointer',
          outline: 'none'
        }}
      />
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: theme.background,
        color: theme.textPrimary,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #60a5fa',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '18px' }}>Loading Prioritization Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.background,
      color: theme.textPrimary,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      transition: 'all 200ms ease'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Header with Dark Mode Toggle */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          gap: '16px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#60a5fa',
            margin: 0,
            textAlign: 'center'
          }}>
            WSJF Calculator
          </h1>
          <DarkModeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
        </div>

        {/* Configuration Panel */}
        <ConfigPanel onConfigTest={testConfiguration} onClearData={clearAllData} theme={theme} />

        {/* Weights Configuration */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: theme.textPrimary,
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '8px',
            margin: '0 0 16px 0'
          }}>
            Define Cost of Delay Weights
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {renderWeightSlider('uv', weights.uv, handleWeightChange, tooltips.uv, 'User Value (UV)')}
            {renderWeightSlider('tc', weights.tc, handleWeightChange, tooltips.tc, 'Time Criticality (TC)')}
            {renderWeightSlider('rr', weights.rr, handleWeightChange, tooltips.rr, 'Risk Reduction (RR)')}
            {renderWeightSlider('cr', weights.cr, handleWeightChange, tooltips.cr, 'Compliance/Regulatory (CR)')}
          </div>
        </div>

        {/* Objective Input Form */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: theme.textPrimary,
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '8px',
            margin: '0 0 16px 0'
          }}>
            Add New Objective
          </h2>

          {/* Objective Name */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.textSecondary,
              marginBottom: '8px'
            }}>
              Objective Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={newInitiative.name}
              onChange={handleInitiativeChange}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: theme.background,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.textPrimary,
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter objective name..."
            />
          </div>

          {/* UV Vote Collection - Full Width */}
          <div style={{ marginBottom: '16px' }}>
            <UVVoteForm
              votes={pendingVotes}
              onVotesChange={setPendingVotes}
              theme={theme}
            />
          </div>

          {/* TC, RR, CR, Sprints Grid - Unchanged */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <ScoringSlider
              name="tc"
              value={newInitiative.tc}
              handler={handleInitiativeChange}
              tooltipText={tooltips.tc}
              label="Time Criticality (TC)"
              definitions={definitions.tc}
              theme={theme}
            />
            <ScoringSlider
              name="rr"
              value={newInitiative.rr}
              handler={handleInitiativeChange}
              tooltipText={tooltips.rr}
              label="Risk Reduction (RR)"
              definitions={definitions.rr}
              theme={theme}
            />
            <ScoringSlider
              name="cr"
              value={newInitiative.cr}
              handler={handleInitiativeChange}
              tooltipText={tooltips.cr}
              label="Compliance/Regulatory (CR)"
              definitions={definitions.cr}
              theme={theme}
            />
            <ScoringSlider
              name="jobSize"
              value={newInitiative.jobSize}
              handler={handleInitiativeChange}
              tooltipText={tooltips.jobSize}
              label="Number of Sprints"
              definitions={{
                1: '',
                2: '',
                3: '',
                4: '',
                5: '',
                6: ''
              }}
              theme={theme}
              isJobSize={true}
            />
          </div>
          <button
            onClick={addInitiative}
            style={{
              backgroundColor: theme.buttonPrimary,
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background-color 150ms ease'
            }}
          >
            Add Objective
          </button>
        </div>

        {/* Results Table */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: `1px solid ${theme.border}`,
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.textPrimary,
              margin: 0
            }}>
              Prioritized Objectives ({rankedInitiatives.length})
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleExportCsv}
                disabled={initiatives.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: initiatives.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: initiatives.length === 0 ? 0.5 : 1,
                  transition: 'all 150ms ease'
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                Export to CSV
              </button>
              <button
                onClick={handleExportPdf}
                disabled={isExporting || initiatives.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: theme.buttonSuccess,
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: isExporting || initiatives.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: isExporting || initiatives.length === 0 ? 0.5 : 1,
                  transition: 'all 150ms ease'
                }}
              >
                <FileDown style={{ width: '16px', height: '16px' }} />
                {isExporting ? 'Generating PDF...' : 'Export to PDF'}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: theme.background }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Rank
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Objective
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    UV (Adj)
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Signal
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cost of Delay
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sprints
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    WSJF Score
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: theme.cardBackground }}>
                {rankedInitiatives.length > 0 ? (
                  rankedInitiatives.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr
                        style={{
                          borderTop: `1px solid ${theme.border}`,
                          transition: 'background-color 150ms ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.hoverOverlay;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              backgroundColor:
                                index === 0 ? '#10b981' :
                                index === 1 ? '#f59e0b' :
                                index === 2 ? '#f97316' : theme.sliderBg,
                              color:
                                index === 0 ? 'white' :
                                index === 1 ? '#1f2937' :
                                index === 2 ? 'white' : theme.textPrimary
                            }}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td style={{ padding: '16px 8px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '500', color: theme.textPrimary }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
                            {`UV(adj):${item.adjustedUV.toFixed(1)} | TC:${item.tc} | RR:${item.rr} | CR:${item.cr}`}
                          </div>
                        </td>
                        <td style={{ padding: '16px 8px', whiteSpace: 'nowrap', textAlign: 'center', color: theme.textSecondary }}>
                          {item.adjustedUV.toFixed(1)}
                        </td>
                        <td style={{ padding: '16px 8px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <button
                            onClick={() => setExpandedInitiativeId(
                              expandedInitiativeId === item.id ? null : item.id
                            )}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#60a5fa', fontWeight: '500', fontSize: '14px',
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '4px 8px', borderRadius: '4px',
                            }}
                            title="Click to expand signal strength breakdown"
                          >
                            {item.signalStrength.toFixed(2)}x
                            {expandedInitiativeId === item.id ?
                              <ChevronUp style={{ width: 14, height: 14 }} /> :
                              <ChevronDown style={{ width: 14, height: 14 }} />
                            }
                          </button>
                        </td>
                        <td style={{ padding: '16px 8px', whiteSpace: 'nowrap', textAlign: 'center', color: theme.textSecondary }}>
                          {item.costOfDelay.toFixed(0)}
                        </td>
                        <td style={{ padding: '16px 8px', whiteSpace: 'nowrap', textAlign: 'center', color: theme.textSecondary }}>
                          {item.jobSize}
                        </td>
                        <td style={{ padding: '16px 8px', whiteSpace: 'nowrap', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>
                          {item.wsjf.toFixed(2)}
                        </td>
                        <td style={{ padding: '16px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          <button
                            onClick={() => deleteInitiative(item.id)}
                            style={{
                              color: theme.textMuted,
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '50%',
                              transition: 'all 150ms ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = theme.textMuted;
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 style={{ width: '20px', height: '20px' }} />
                          </button>
                        </td>
                      </tr>
                      {/* Expanded signal strength breakdown row */}
                      {expandedInitiativeId === item.id && (
                        <tr style={{ backgroundColor: theme.background }}>
                          <td colSpan={8} style={{ padding: '12px 24px', borderTop: 'none' }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                              gap: '12px',
                              fontSize: '13px',
                            }}>
                              <div>
                                <span style={{ color: theme.textMuted }}>Wt. UV Avg:</span>{' '}
                                <strong style={{ color: theme.textPrimary }}>{item.signalBreakdown.weightedUVAverage.toFixed(2)}</strong>
                              </div>
                              <div>
                                <span style={{ color: theme.textMuted }}>Volume:</span>{' '}
                                <strong style={{ color: theme.textPrimary }}>{item.signalBreakdown.volumeFactor.toFixed(2)}</strong>
                                <span style={{ color: theme.textMuted }}> ({item.uvVotes.length} votes)</span>
                              </div>
                              <div>
                                <span style={{ color: theme.textMuted }}>Svc Spread:</span>{' '}
                                <strong style={{ color: theme.textPrimary }}>{item.signalBreakdown.serviceSpreadBonus.toFixed(2)}</strong>
                                <span style={{ color: theme.textMuted }}> ({new Set(item.uvVotes.map(v => v.service)).size} svc)</span>
                              </div>
                              <div>
                                <span style={{ color: theme.textMuted }}>Persona Spread:</span>{' '}
                                <strong style={{ color: theme.textPrimary }}>{item.signalBreakdown.personaSpreadBonus.toFixed(2)}</strong>
                                <span style={{ color: theme.textMuted }}> ({new Set(item.uvVotes.map(v => v.persona)).size} types)</span>
                              </div>
                              <div>
                                <span style={{ color: theme.textMuted }}>Consensus:</span>{' '}
                                <strong style={{ color: theme.textPrimary }}>{item.signalBreakdown.consensusBonus.toFixed(2)}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '64px 24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '500', color: theme.textPrimary, margin: '0 0 8px 0' }}>No objectives yet.</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted }}>
                        Use the form above to add your first objective.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }

        select option {
          background-color: #1f2937;
          color: #f9fafb;
        }
      `}</style>
    </div>
  );
}

export default WSJFApp;
