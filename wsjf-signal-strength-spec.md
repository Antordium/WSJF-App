# WSJF Signal Strength Algorithm Implementation Specification

**Version:** 1.0  
**Date:** March 2026  
**Project:** WSJF Calculator v4  
**Repository:** https://github.com/Antordium/WSJF-App/tree/v4

---

## Overview

This document specifies the implementation of a **Signal Strength** modifier for the **User Value (UV) component ONLY** of the WSJF calculation. The algorithm adjusts UV scores based on vote metadata to better reflect cross-service agreement, persona diversity, voter volume, and consensus.

### What Changes

- **User Value (UV)**: Now uses Signal Strength algorithm with weighted voting

### What Does NOT Change

- **Time Criticality (TC)**: Remains 1-5 scale, single score, no weighting
- **Risk Reduction (RR)**: Remains 1-5 scale, single score, no weighting  
- **Compliance/Regulatory (CR)**: Remains 1-5 scale, single score, no weighting
- **Number of Sprints**: Remains 1-6 scale, single score
- **Cost of Delay Weights**: Remain configurable 1-10 per factor
- **WSJF Formula Structure**: Remains `(UV×w + TC×w + RR×w + CR×w) ÷ Sprints`

### Business Rationale

The current system treats all UV votes equally. A UV score of 4 from a single voter has the same weight as a UV score of 4 from 20 voters across all services and personas. This loses critical signal about confidence and cross-organizational alignment.

---

## Existing WSJF Formula (Reference)

The current v4 WSJF calculation that must be preserved:

```typescript
// EXISTING FORMULA - DO NOT MODIFY THIS STRUCTURE
WSJF = Cost_of_Delay / Number_of_Sprints

Cost_of_Delay = (UV × weight_uv) + (TC × weight_tc) + (RR × weight_rr) + (CR × weight_cr)

// Where:
// - UV: User Value (1-5) ← THIS IS THE ONLY FACTOR BEING ENHANCED
// - TC: Time Criticality (1-5)
// - RR: Risk Reduction (1-5)
// - CR: Compliance/Regulatory (1-5)
// - Sprints: Number of Sprints (1-6)
// - Weights: Configurable 1-10 for each Cost of Delay factor
```

---

## Signal Strength Enhancement (UV Only)

The Signal Strength algorithm **only modifies how UV is calculated**. Instead of a single UV score, UV is now derived from multiple weighted votes.

```
Adjusted_UV = Weighted_UV_Average × Signal_Strength

Signal_Strength = Volume_Factor × Service_Spread_Bonus × Persona_Spread_Bonus × Consensus_Bonus

Signal_Strength is capped at 2.0 (max)
```

The `Adjusted_UV` replaces the raw UV value in the existing Cost of Delay formula. **All other factors (TC, RR, CR, Sprints) remain single-value inputs with no weighting or signal strength calculation.**

---

## Scope of Changes

### IN SCOPE (Modify)
- User Value (UV) calculation only
- UV data model (single value → vote collection)
- UV input UI (single slider → multi-voter form)
- Display of UV-related metrics (adjusted UV, signal strength)

### OUT OF SCOPE (Do Not Modify)
- Time Criticality (TC) — keep as single 1-5 slider
- Risk Reduction (RR) — keep as single 1-5 slider
- Compliance/Regulatory (CR) — keep as single 1-5 slider
- Number of Sprints — keep as single 1-6 slider
- Cost of Delay weight configuration (1-10 per factor)
- WSJF formula structure
- PDF export format (except adding UV signal strength column)
- CSV export format (except adding UV signal strength column)
- Dark mode toggle
- Any other existing v4 functionality

---

## Data Model Changes

### Vote Object

Each UV vote must capture additional metadata. Update the vote schema:

```typescript
interface UVVote {
  score: number;           // 1-5 scale
  persona: PersonaType;    // Required
  service: ServiceType;    // Required
  voterId: string;         // Unique voter identifier
  timestamp: Date;         // When vote was cast
}

type PersonaType = 
  | 'USCYBERCOM'           // J7 Staff - Product Owner
  | 'Operator'
  | 'Trainer'
  | 'ContentAuthor'        // Content Author / Range Engineer
  | 'Leadership'
  | 'PlatformMaintainer';

type ServiceType =
  | 'USCYBERCOM'
  | 'ARCYBER'
  | 'FLTCYBER'
  | 'MARFORCYBER'
  | 'AFCYBER'
  | 'Other';               // For vendors, support, etc.
```

### Initiative Object

Update the initiative to store UV vote collection while preserving existing fields:

```typescript
interface Initiative {
  id: string;
  name: string;
  
  // USER VALUE - Enhanced with Signal Strength
  uvVotes: UVVote[];       // Collection of individual UV votes (NEW)
  uvAdjusted: number;      // Calculated adjusted UV (read-only, derived)
  uvSignalStrength: number; // Calculated signal strength (read-only, derived)
  
  // THESE FIELDS REMAIN UNCHANGED - Single values, no voting/weighting
  tc: number;              // Time Criticality (1-5, single score)
  rr: number;              // Risk Reduction (1-5, single score)
  cr: number;              // Compliance/Regulatory (1-5, single score)
  sprints: number;         // Number of Sprints (1-6, single score)
  
  // ... existing fields remain unchanged
}
```

---

## Algorithm Components

### 1. Persona Base Weights

Apply these weights when calculating the weighted UV average:

```typescript
const PERSONA_WEIGHTS: Record<PersonaType, number> = {
  'USCYBERCOM': 1.4,        // Product owner voice - highest weight
  'Operator': 1.3,          // Primary end user
  'Trainer': 1.1,           // Key user, training delivery
  'ContentAuthor': 1.0,     // Important but narrower scope
  'Leadership': 0.9,        // Strategic but less tactical detail
  'PlatformMaintainer': 0.85 // Technical, less mission-focused
};
```

### 2. Weighted UV Average Calculation

```typescript
function calculateWeightedUVAverage(votes: UVVote[]): number {
  if (votes.length === 0) return 3; // Default to moderate if no votes
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const vote of votes) {
    const weight = PERSONA_WEIGHTS[vote.persona];
    weightedSum += vote.score * weight;
    totalWeight += weight;
  }
  
  return weightedSum / totalWeight;
}
```

### 3. Volume Factor

Soft penalty for very low voter counts, bonus for higher counts with diminishing returns:

```typescript
function calculateVolumeFactor(voterCount: number): number {
  // Formula: min(1.2, max(0.85, 0.8 + (log2(voterCount) * 0.1)))
  
  if (voterCount <= 0) return 0.85;
  
  const rawFactor = 0.8 + (Math.log2(voterCount) * 0.1);
  return Math.min(1.2, Math.max(0.85, rawFactor));
}
```

**Reference table:**

| Voter Count | Volume Factor |
|-------------|---------------|
| 1           | 0.85          |
| 2           | 0.90          |
| 3           | 0.96          |
| 4           | 1.00          |
| 5           | 1.03          |
| 6           | 1.06          |
| 8           | 1.10          |
| 10          | 1.13          |
| 16          | 1.20 (cap)    |
| 32+         | 1.20 (cap)    |

### 4. Service Spread Bonus

Cross-service agreement is the strongest signal. This component has the largest multiplier range:

```typescript
function calculateServiceSpreadBonus(votes: UVVote[]): number {
  const uniqueServices = new Set(votes.map(v => v.service));
  const serviceCount = uniqueServices.size;
  
  // Formula: 1.0 + (0.15 * (serviceCount - 1))
  // Capped at 1.6 for 5+ services
  
  const bonus = 1.0 + (0.15 * (serviceCount - 1));
  return Math.min(1.6, bonus);
}
```

**Reference table:**

| Unique Services | Service Spread Bonus |
|-----------------|---------------------|
| 1               | 1.00                |
| 2               | 1.15                |
| 3               | 1.30                |
| 4               | 1.45                |
| 5+              | 1.60 (cap)          |

### 5. Persona Spread Bonus

Rewards diversity of personas voting (cross-functional agreement):

```typescript
function calculatePersonaSpreadBonus(votes: UVVote[]): number {
  const uniquePersonas = new Set(votes.map(v => v.persona));
  const personaCount = uniquePersonas.size;
  
  // Formula: 1.0 + (0.1 * (personaCount - 1))
  // Capped at 1.5 for 6 personas
  
  const bonus = 1.0 + (0.1 * (personaCount - 1));
  return Math.min(1.5, bonus);
}
```

**Reference table:**

| Unique Personas | Persona Spread Bonus |
|-----------------|---------------------|
| 1               | 1.00                |
| 2               | 1.10                |
| 3               | 1.20                |
| 4               | 1.30                |
| 5               | 1.40                |
| 6 (all)         | 1.50 (cap)          |

### 6. Consensus Bonus

Rewards agreement among voters, slight penalty for high disagreement:

```typescript
function calculateConsensusBonus(votes: UVVote[]): number {
  if (votes.length < 2) return 1.0; // No consensus calculation for single vote
  
  const scores = votes.map(v => v.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Calculate standard deviation
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  // Coefficient of Variation (CoV) = stdDev / mean
  const cov = mean > 0 ? stdDev / mean : 0;
  
  // Formula: 1.0 + (0.15 * (1 - CoV))
  // Floor at 1.0 (no penalty for high disagreement, just no bonus)
  
  const bonus = 1.0 + (0.15 * (1 - cov));
  return Math.max(1.0, Math.min(1.15, bonus));
}
```

**Reference table:**

| Vote Pattern      | CoV   | Consensus Bonus |
|-------------------|-------|-----------------|
| All same (4,4,4)  | 0.00  | 1.15            |
| Low spread (4,4,5)| ~0.10 | 1.14            |
| Medium (3,4,5)    | ~0.25 | 1.11            |
| High (2,3,5)      | ~0.45 | 1.08            |
| Very high (1,3,5) | ~0.67 | 1.00 (floor)    |

---

## Main Calculation Function

```typescript
interface SignalStrengthResult {
  adjustedUV: number;
  signalStrength: number;
  breakdown: {
    weightedUVAverage: number;
    volumeFactor: number;
    serviceSpreadBonus: number;
    personaSpreadBonus: number;
    consensusBonus: number;
    uncappedSignalStrength: number;
  };
}

function calculateAdjustedUV(votes: UVVote[]): SignalStrengthResult {
  // Handle edge case: no votes
  if (votes.length === 0) {
    return {
      adjustedUV: 3,
      signalStrength: 1.0,
      breakdown: {
        weightedUVAverage: 3,
        volumeFactor: 1.0,
        serviceSpreadBonus: 1.0,
        personaSpreadBonus: 1.0,
        consensusBonus: 1.0,
        uncappedSignalStrength: 1.0
      }
    };
  }
  
  // Step 1: Calculate weighted UV average
  const weightedUVAverage = calculateWeightedUVAverage(votes);
  
  // Step 2: Get unique voter count (dedupe by voterId)
  const uniqueVoters = new Set(votes.map(v => v.voterId));
  const voterCount = uniqueVoters.size;
  
  // Step 3: Calculate all signal strength components
  const volumeFactor = calculateVolumeFactor(voterCount);
  const serviceSpreadBonus = calculateServiceSpreadBonus(votes);
  const personaSpreadBonus = calculatePersonaSpreadBonus(votes);
  const consensusBonus = calculateConsensusBonus(votes);
  
  // Step 4: Calculate signal strength (cap at 2.0)
  const uncappedSignalStrength = volumeFactor * serviceSpreadBonus * personaSpreadBonus * consensusBonus;
  const signalStrength = Math.min(2.0, uncappedSignalStrength);
  
  // Step 5: Calculate final adjusted UV
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
      uncappedSignalStrength
    }
  };
}
```

---

## WSJF Calculation Update

Update the main WSJF calculation to use `adjustedUV` **for the UV component only**. All other factors remain unchanged:

```typescript
interface WSJFResult {
  wsjf: number;
  costOfDelay: number;
  adjustedUV: number;
  signalStrength: number;
}

function calculateWSJF(
  initiative: Initiative,
  weights: { uv: number; tc: number; rr: number; cr: number }
): WSJFResult {
  // ONLY UV uses the Signal Strength algorithm
  const uvResult = calculateAdjustedUV(initiative.uvVotes);
  
  // Calculate Cost of Delay
  // - UV: Uses adjustedUV from Signal Strength calculation
  // - TC, RR, CR: Use raw values directly (NO CHANGE)
  const costOfDelay = 
    (uvResult.adjustedUV * weights.uv) +  // ← Enhanced with Signal Strength
    (initiative.tc * weights.tc) +         // ← Unchanged: raw value × weight
    (initiative.rr * weights.rr) +         // ← Unchanged: raw value × weight
    (initiative.cr * weights.cr);          // ← Unchanged: raw value × weight
  
  // Calculate WSJF (formula structure unchanged)
  const wsjf = costOfDelay / initiative.sprints;  // ← Unchanged: sprints is raw value
  
  return {
    wsjf,
    costOfDelay,
    adjustedUV: uvResult.adjustedUV,
    signalStrength: uvResult.signalStrength
  };
}
```

### Comparison: Before vs After

| Component | Before (v4) | After (v4 + Signal Strength) |
|-----------|-------------|------------------------------|
| **UV** | Single value (1-5) | Weighted votes → Adjusted UV (can exceed 5 due to signal strength) |
| **TC** | Single value (1-5) | Single value (1-5) — **NO CHANGE** |
| **RR** | Single value (1-5) | Single value (1-5) — **NO CHANGE** |
| **CR** | Single value (1-5) | Single value (1-5) — **NO CHANGE** |
| **Sprints** | Single value (1-6) | Single value (1-6) — **NO CHANGE** |
| **Weights** | 1-10 per factor | 1-10 per factor — **NO CHANGE** |
| **Formula** | `(UV×w + TC×w + RR×w + CR×w) ÷ Sprints` | Same structure — **NO CHANGE** |
```

---

## UI Changes Required

### 1. Vote Collection Interface (UV Only)

Add a voting modal/form **for User Value only**. The other factors (TC, RR, CR, Sprints) retain their existing single-slider input:

```typescript
// NEW: UV Vote form captures persona and service
interface UVVoteFormState {
  score: number;              // 1-5 slider
  persona: PersonaType | null; // Required dropdown
  service: ServiceType | null; // Required dropdown
}

// UNCHANGED: TC, RR, CR, Sprints remain single sliders
// No persona or service selection for these factors
```

**UI Layout Suggestion:**

| Factor | Input Type | Change |
|--------|-----------|--------|
| **User Value (UV)** | Multi-voter form with persona/service | **ENHANCED** |
| Time Criticality (TC) | Single slider (1-5) | No change |
| Risk Reduction (RR) | Single slider (1-5) | No change |
| Compliance (CR) | Single slider (1-5) | No change |
| Sprints | Single slider (1-6) | No change |
```

### 2. Display Signal Strength (Optional Enhancement)

Consider showing signal strength metadata in the initiative table:

| Column | Description |
|--------|-------------|
| UV (Raw) | Average of raw votes |
| UV (Adj) | Adjusted UV after signal strength |
| Signal | Signal strength multiplier (e.g., "1.45x") |
| Votes | Vote count with tooltip showing breakdown |

### 3. Tooltip/Hover Details

On hover over the adjusted UV or signal strength, show breakdown:
- Weighted UV Average: X.XX
- Volume Factor: X.XX (N voters)
- Service Spread: X.XX (N services)
- Persona Spread: X.XX (N personas)
- Consensus: X.XX
- **Signal Strength: X.XX**

---

## PDF Export Updates

Update the PDF export to include signal strength data:

```typescript
// Add columns to the PDF table
const columns = [
  'Rank',
  'Objective',
  'UV (Adj)',    // Changed from UV
  'Signal',      // New column
  'TC',
  'RR', 
  'CR',
  'Sprints',
  'CoD',
  'WSJF'
];
```

---

## Test Cases

### Test 1: Single Voter (Low Signal)

```typescript
const votes = [
  { score: 4, persona: 'Operator', service: 'ARCYBER', voterId: 'user1' }
];

// Expected:
// Weighted UV Average: 4.0
// Volume Factor: 0.85 (single voter penalty)
// Service Spread: 1.0 (single service)
// Persona Spread: 1.0 (single persona)
// Consensus: 1.0 (single vote)
// Signal Strength: 0.85
// Adjusted UV: 4.0 * 0.85 = 3.4
```

### Test 2: Cross-Service Agreement (High Signal)

```typescript
const votes = [
  { score: 4, persona: 'Operator', service: 'ARCYBER', voterId: 'user1' },
  { score: 5, persona: 'Trainer', service: 'FLTCYBER', voterId: 'user2' },
  { score: 4, persona: 'ContentAuthor', service: 'MARFORCYBER', voterId: 'user3' },
  { score: 4, persona: 'USCYBERCOM', service: 'USCYBERCOM', voterId: 'user4' },
  { score: 5, persona: 'Operator', service: 'AFCYBER', voterId: 'user5' },
];

// Expected:
// Weighted UV Average: ~4.25 (USCYBERCOM and Operators weighted higher)
// Volume Factor: ~1.03 (5 voters)
// Service Spread: 1.60 (5 services - max)
// Persona Spread: 1.30 (4 unique personas)
// Consensus: ~1.12 (low variance)
// Signal Strength: min(2.0, 1.03 * 1.60 * 1.30 * 1.12) = min(2.0, 2.40) = 2.0
// Adjusted UV: 4.25 * 2.0 = 8.5
```

### Test 3: High Disagreement

```typescript
const votes = [
  { score: 1, persona: 'Operator', service: 'ARCYBER', voterId: 'user1' },
  { score: 5, persona: 'Trainer', service: 'FLTCYBER', voterId: 'user2' },
  { score: 2, persona: 'Leadership', service: 'USCYBERCOM', voterId: 'user3' },
];

// Expected:
// Weighted UV Average: ~2.5
// Volume Factor: 0.96 (3 voters)
// Service Spread: 1.30 (3 services)
// Persona Spread: 1.20 (3 personas)
// Consensus: 1.0 (high variance - floor)
// Signal Strength: 0.96 * 1.30 * 1.20 * 1.0 = 1.50
// Adjusted UV: 2.5 * 1.50 = 3.75
```

---

## Migration Notes

### Backward Compatibility

For existing initiatives without vote metadata:
1. Treat the existing UV score as a single vote
2. Assign default persona: `'Operator'`
3. Assign default service: `'USCYBERCOM'`
4. Signal strength will be 0.85 (single voter penalty)

```typescript
function migrateOldInitiative(oldInit: OldInitiative): Initiative {
  return {
    ...oldInit,
    uvVotes: [{
      score: oldInit.uv,
      persona: 'Operator',
      service: 'USCYBERCOM',
      voterId: 'legacy',
      timestamp: new Date()
    }]
  };
}
```

### Database Schema

If using persistent storage, add a `uv_votes` table or collection:

```sql
CREATE TABLE uv_votes (
  id UUID PRIMARY KEY,
  initiative_id UUID REFERENCES initiatives(id),
  score INTEGER CHECK (score >= 1 AND score <= 5),
  persona VARCHAR(50) NOT NULL,
  service VARCHAR(50) NOT NULL,
  voter_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(initiative_id, voter_id)  -- One vote per user per initiative
);
```

---

## Configuration Constants

All tunable parameters in one place for easy adjustment:

```typescript
const SIGNAL_STRENGTH_CONFIG = {
  // Persona weights
  personaWeights: {
    USCYBERCOM: 1.4,
    Operator: 1.3,
    Trainer: 1.1,
    ContentAuthor: 1.0,
    Leadership: 0.9,
    PlatformMaintainer: 0.85
  },
  
  // Volume factor
  volumeMin: 0.85,
  volumeMax: 1.2,
  volumeBase: 0.8,
  volumeLogMultiplier: 0.1,
  
  // Service spread
  serviceSpreadBase: 1.0,
  serviceSpreadIncrement: 0.15,
  serviceSpreadMax: 1.6,
  
  // Persona spread
  personaSpreadBase: 1.0,
  personaSpreadIncrement: 0.1,
  personaSpreadMax: 1.5,
  
  // Consensus
  consensusBase: 1.0,
  consensusMaxBonus: 0.15,
  consensusFloor: 1.0,
  consensusCeiling: 1.15,
  
  // Overall cap
  signalStrengthCap: 2.0,
  
  // Default UV when no votes
  defaultUV: 3
};
```

---

## Summary

| Component | Range | Priority |
|-----------|-------|----------|
| Service Spread Bonus | 1.0 – 1.6 | **Highest** |
| Persona Spread Bonus | 1.0 – 1.5 | High |
| Consensus Bonus | 1.0 – 1.15 | Medium |
| Volume Factor | 0.85 – 1.2 | Low (sanity check) |
| **Signal Strength Cap** | **2.0x max** | — |

This algorithm ensures that features with broad cross-service and cross-persona support receive appropriately higher UV scores, while single-voter or contentious features are moderated.

---

## Questions for Implementation

1. Should voters be able to update their vote, or is it one-and-done?
2. Should vote history be preserved for audit purposes?
3. Do you want real-time recalculation as votes come in, or batch processing?
4. Should there be a "voting deadline" per PI/initiative?

---

*End of specification*
