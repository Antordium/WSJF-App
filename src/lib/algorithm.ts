import type { Vote, SignalStrengthBreakdown, SignalStrengthResult, VoterProfile, FeatureVote, FeatureResult, Feature, Weights } from './types';
import { PERSONA_WEIGHTS, SIGNAL_STRENGTH_CAP, DEFAULT_SCORE, DEFAULT_SPRINT_ALPHA, ARCHITECTURE_BV_FLOOR } from './constants';
import type { PersonaType } from './types';

// ===========================
// SIGNAL STRENGTH ALGORITHM
// ===========================

export function calculateWeightedAverage(votes: Vote[]): number {
  if (votes.length === 0) return DEFAULT_SCORE;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const vote of votes) {
    const weight = PERSONA_WEIGHTS[vote.persona];
    weightedSum += vote.score * weight;
    totalWeight += weight;
  }
  return weightedSum / totalWeight;
}

export function calculateVolumeFactor(voterCount: number): number {
  if (voterCount <= 0) return 0.85;
  const rawFactor = 0.8 + (Math.log2(voterCount) * 0.1);
  return Math.min(1.2, Math.max(0.85, rawFactor));
}

export function calculateServiceSpreadBonus(votes: Vote[]): number {
  const uniqueServices = new Set(votes.map(v => v.service));
  const serviceCount = uniqueServices.size;
  const bonus = 1.0 + (0.15 * (serviceCount - 1));
  return Math.min(1.6, bonus);
}

export function calculatePersonaSpreadBonus(votes: Vote[]): number {
  const uniquePersonas = new Set(votes.map(v => v.persona));
  const personaCount = uniquePersonas.size;
  const bonus = 1.0 + (0.1 * (personaCount - 1));
  return Math.min(1.5, bonus);
}

export function calculateConsensusBonus(votes: Vote[]): number {
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

/**
 * Generic Signal Strength calculation — works for both BV and TC votes.
 */
export function calculateSignalStrength(votes: Vote[]): SignalStrengthResult {
  if (votes.length === 0) {
    return {
      adjustedScore: DEFAULT_SCORE,
      signalStrength: 1.0,
      breakdown: {
        weightedAverage: DEFAULT_SCORE,
        volumeFactor: 1.0,
        serviceSpreadBonus: 1.0,
        personaSpreadBonus: 1.0,
        consensusBonus: 1.0,
        uncappedSignalStrength: 1.0,
      },
    };
  }

  const weightedAverage = calculateWeightedAverage(votes);
  const uniqueVoters = new Set(votes.map(v => v.voterId));
  const voterCount = uniqueVoters.size;
  const volumeFactor = calculateVolumeFactor(voterCount);
  const serviceSpreadBonus = calculateServiceSpreadBonus(votes);
  const personaSpreadBonus = calculatePersonaSpreadBonus(votes);
  const consensusBonus = calculateConsensusBonus(votes);

  const uncappedSignalStrength = volumeFactor * serviceSpreadBonus * personaSpreadBonus * consensusBonus;
  const signalStrength = Math.min(SIGNAL_STRENGTH_CAP, uncappedSignalStrength);
  const adjustedScore = weightedAverage * signalStrength;

  return {
    adjustedScore,
    signalStrength,
    breakdown: {
      weightedAverage,
      volumeFactor,
      serviceSpreadBonus,
      personaSpreadBonus,
      consensusBonus,
      uncappedSignalStrength,
    },
  };
}

// ===========================
// VOTING TOOL WSJF CALCULATION
// ===========================

/**
 * Convert Firebase votes + voter profiles into Vote[] for Signal Strength calculation.
 * Used for both BV and TC — pass the score extractor.
 */
export function buildVotesForSignalStrength(
  featureVotes: Record<string, FeatureVote>,
  voterProfiles: Record<string, VoterProfile>,
  scoreExtractor: (fv: FeatureVote) => number,
): Vote[] {
  const votes: Vote[] = [];
  for (const [voterId, fv] of Object.entries(featureVotes)) {
    const profile = voterProfiles[voterId];
    if (!profile) continue;
    votes.push({
      id: `${voterId}-${fv.timestamp}`,
      score: scoreExtractor(fv),
      persona: profile.persona,
      service: profile.service,
      voterId,
      timestamp: new Date(fv.timestamp).toISOString(),
    });
  }
  return votes;
}

/**
 * Calculate full WSJF result for a single feature.
 * Architecture features: BV fixed at ARCHITECTURE_BV_FLOOR, TC from admin (feature.tc), no voter signal strength.
 * User-facing features: BV and TC from voter signal strength algorithm.
 *
 * `alpha` dampens the influence of sprint count: WSJF = CoD / sprints^alpha
 * (0.5 = square root, the default). This stops a low sprint estimate from
 * disproportionately inflating priority.
 */
export function calculateFeatureWSJF(
  feature: Feature,
  featureVotes: Record<string, FeatureVote>,
  voterProfiles: Record<string, VoterProfile>,
  weights: Weights,
  alpha: number = DEFAULT_SPRINT_ALPHA,
): FeatureResult {
  const isArchitecture = (feature.featureType || 'user') === 'architecture';

  const noSignal: SignalStrengthResult = {
    adjustedScore: 0,
    signalStrength: 1.0,
    breakdown: { weightedAverage: 0, volumeFactor: 1.0, serviceSpreadBonus: 1.0, personaSpreadBonus: 1.0, consensusBonus: 1.0, uncappedSignalStrength: 1.0 },
  };

  // Architecture: BV fixed at 1.0, TC from admin slider (no voters)
  // User-facing: BV and TC from voter signal strength
  let bvResult: SignalStrengthResult;
  let tcResult: SignalStrengthResult;
  let bvVotes: Vote[] = [];
  let tcVotes: Vote[] = [];

  if (isArchitecture) {
    bvResult = { ...noSignal, adjustedScore: ARCHITECTURE_BV_FLOOR, breakdown: { ...noSignal.breakdown, weightedAverage: ARCHITECTURE_BV_FLOOR } };
    const adminTC = feature.tc ?? 3;
    tcResult = { ...noSignal, adjustedScore: adminTC, breakdown: { ...noSignal.breakdown, weightedAverage: adminTC } };
  } else {
    bvVotes = buildVotesForSignalStrength(featureVotes, voterProfiles, fv => fv.bv);
    tcVotes = buildVotesForSignalStrength(featureVotes, voterProfiles, fv => fv.tc);
    bvResult = calculateSignalStrength(bvVotes);
    tcResult = calculateSignalStrength(tcVotes);
  }

  const rr = feature.rr ?? 3;
  const cr = feature.cr ?? 1;
  const sprints = feature.sprints ?? 1;

  const costOfDelay =
    bvResult.adjustedScore * weights.bv +
    tcResult.adjustedScore * weights.tc +
    rr * weights.rr +
    cr * weights.cr;

  const wsjf = costOfDelay / Math.pow(sprints > 0 ? sprints : 1, alpha);

  const uniqueServices = new Set(bvVotes.map(v => v.service)).size;
  const uniquePersonas = new Set(bvVotes.map(v => v.persona)).size;
  const rawBVAvg = bvVotes.length > 0 ? bvVotes.reduce((s, v) => s + v.score, 0) / bvVotes.length : 0;
  const rawTCAvg = tcVotes.length > 0 ? tcVotes.reduce((s, v) => s + v.score, 0) / tcVotes.length : 0;

  return {
    featureId: feature.id,
    featureName: feature.name,
    jiraNumber: feature.jiraNumber,
    developerTeam: feature.developerTeam,
    problemSolved: feature.problemSolved,
    featureType: feature.featureType || 'user',
    voteCount: isArchitecture ? 0 : Object.keys(featureVotes).length,
    uniqueServices,
    uniquePersonas,
    rawBVAvg: isArchitecture ? ARCHITECTURE_BV_FLOOR : rawBVAvg,
    bvSignalStrength: bvResult.signalStrength,
    adjustedBV: bvResult.adjustedScore,
    rawTCAvg: isArchitecture ? (feature.tc ?? 3) : rawTCAvg,
    tcSignalStrength: tcResult.signalStrength,
    adjustedTC: tcResult.adjustedScore,
    rr,
    cr,
    costOfDelay,
    sprints,
    wsjf,
  };
}
