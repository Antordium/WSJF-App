// ===========================
// SHARED TYPES
// ===========================

export type PersonaType =
  | 'USCYBERCOM'
  | 'Operator'
  | 'Trainer'
  | 'ContentAuthor'
  | 'Leadership'
  | 'PlatformMaintainer';

export type ServiceType =
  | 'USCYBERCOM'
  | 'ARCYBER'
  | 'FLTCYBER'
  | 'MARFORCYBER'
  | 'AFCYBER'
  | 'CGCYBER'
  | 'CNMF'
  | 'DCDC'
  | 'Other';

export interface Vote {
  id: string;
  score: number;
  persona: PersonaType;
  service: ServiceType;
  voterId: string;
  timestamp: string;
}

// Legacy alias for backward compatibility with page.tsx
export type UVVote = Vote;

export interface SignalStrengthBreakdown {
  weightedAverage: number;
  volumeFactor: number;
  serviceSpreadBonus: number;
  personaSpreadBonus: number;
  consensusBonus: number;
  uncappedSignalStrength: number;
}

export interface SignalStrengthResult {
  adjustedScore: number;
  signalStrength: number;
  breakdown: SignalStrengthBreakdown;
}

// WSJF Calculator (page.tsx) types
export interface Initiative {
  id: string;
  createdAt: string;
  name: string;
  uvVotes: UVVote[];
  tc: number;
  rr: number;
  cr: number;
  jobSize: number;
}

export interface Weights {
  uv: number;
  tc: number;
  rr: number;
  cr: number;
}

// ===========================
// VOTING TOOL TYPES
// ===========================

export type SessionStatus = 'lobby' | 'voting' | 'scoring' | 'results';

export interface VoterProfile {
  id: string;
  persona: PersonaType;
  service: ServiceType;
  rank: string;
  lastName: string;
  firstName: string;
  joinedAt: number;
}

export type FeatureType = 'user' | 'architecture';

export interface Feature {
  id: string;
  name: string;
  jiraNumber: string;
  problemSolved: string;
  developerTeam: string;
  featureType: FeatureType;
  order: number;
  votingOpen: boolean;
  rr: number | null;
  cr: number | null;
  sprints: number | null;
}

export interface FeatureVote {
  uv: number;
  tc: number;
  timestamp: number;
}

export interface FeatureResult {
  featureId: string;
  featureName: string;
  jiraNumber: string;
  developerTeam: string;
  problemSolved: string;
  voteCount: number;
  uniqueServices: number;
  uniquePersonas: number;
  rawUVAvg: number;
  uvSignalStrength: number;
  adjustedUV: number;
  rawTCAvg: number;
  tcSignalStrength: number;
  adjustedTC: number;
  rr: number;
  cr: number;
  costOfDelay: number;
  sprints: number;
  wsjf: number;
  featureType: FeatureType;
}

export interface SessionMeta {
  title: string;
  status: SessionStatus;
  currentFeatureIndex: number;
  createdAt: number;
  adminPin: string;
}

export interface VotingSession {
  meta: SessionMeta;
  features: Record<string, Feature>;
  voters: Record<string, VoterProfile>;
  votes: Record<string, Record<string, FeatureVote>>;
  results?: Record<string, FeatureResult>;
}
