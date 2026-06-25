import type { PersonaType, ServiceType } from './types';

// ===========================
// PERSONA & SERVICE CONSTANTS
// ===========================

export const PERSONA_WEIGHTS: Record<PersonaType, number> = {
  USCYBERCOM: 1.4,
  Operator: 1.3,
  Trainer: 1.1,
  ContentAuthor: 1.0,
  Leadership: 0.9,
  PlatformMaintainer: 0.85,
};

export const PERSONA_LABELS: Record<PersonaType, string> = {
  USCYBERCOM: 'USCYBERCOM',
  Operator: 'Operator',
  Trainer: 'Trainer',
  ContentAuthor: 'Content Author / Range Engineer',
  Leadership: 'Leadership',
  PlatformMaintainer: 'Platform Maintainer',
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  USCYBERCOM: 'USCYBERCOM',
  ARCYBER: 'ARCYBER',
  FLTCYBER: 'FLTCYBER',
  MARFORCYBER: 'MARFORCYBER',
  AFCYBER: 'AFCYBER',
  CGCYBER: 'CGCYBER',
  CNMF: 'CNMF',
  DCDC: 'DCDC',
  Other: 'Other',
};

export const ALL_PERSONAS: PersonaType[] = [
  'USCYBERCOM', 'Operator', 'Trainer', 'ContentAuthor', 'Leadership', 'PlatformMaintainer'
];

export const ALL_SERVICES: ServiceType[] = [
  'USCYBERCOM', 'ARCYBER', 'FLTCYBER', 'MARFORCYBER', 'AFCYBER', 'CGCYBER', 'CNMF', 'DCDC', 'Other'
];

export const SIGNAL_STRENGTH_CAP = 2.0;
// Neutral mid-scale default (no-vote fallback / initial slider position) on the 1-10 scale.
export const DEFAULT_SCORE = 5;
// Max value of the BV/TC/RR/CR scoring scale (sprints are separate, 1-20).
export const SCORE_MAX = 10;

// ===========================
// WSJF SCORING TUNABLES
// ===========================

// Sprint dampening exponent for WSJF = CoD / sprints^alpha.
// 1 = classic WSJF (linear), 0.5 = square-root dampening (recommended — a vendor
// claiming 1 vs 4 sprints gets a 2x edge instead of 4x), 0 = ignore sprints entirely.
export const DEFAULT_SPRINT_ALPHA = 0.5;

// Architecture features have no voter Business Value; they get this fixed mid-high
// BV on the 1-10 scale (instead of the floor) so risk/architecture work isn't
// auto-bottomed vs. voted user-facing features.
export const ARCHITECTURE_BV_FLOOR = 6;

// Default Cost-of-Delay weights. BV stays highest, but RR is raised toward it
// (and CR kept low) to reduce the Business-Value vs. Risk-Reduction disparity.
export const DEFAULT_WEIGHTS = { bv: 3, tc: 2, rr: 2.5, cr: 1 };

// ===========================
// SCORING DEFINITIONS
// ===========================

// 1-10 scoring scale. Descriptions ramp from negligible (1) to transformational/
// critical (10) for each dimension.
export const definitions = {
  bv: {
    1: 'Negligible user benefit; purely internal or technical.',
    2: 'Very small benefit; rare edge case.',
    3: 'Minor benefit; affects a limited group.',
    4: 'Modest benefit; helps some users.',
    5: 'Moderate value; addresses a common user need.',
    6: 'Solid value; clear improvement for many users.',
    7: 'High value; significant impact on mission readiness.',
    8: 'Very high value; major capability improvement.',
    9: 'Critical value; removes a major blocker.',
    10: 'Transformational; redefines user capability.'
  } as Record<number, string>,
  tc: {
    1: 'No time pressure; do anytime.',
    2: 'Minimal urgency.',
    3: 'Low urgency; within the next few PIs.',
    4: 'Some urgency.',
    5: 'Moderate criticality; within 1-2 PIs.',
    6: 'Elevated; this or next PI preferred.',
    7: 'Urgent; should deliver this PI.',
    8: 'Very urgent; notable impact if delayed.',
    9: 'Severe; major impact if missed.',
    10: 'Critical; miss this PI = mission failure or penalty.'
  } as Record<number, string>,
  rr: {
    1: 'No risk mitigation; does not affect reliability.',
    2: 'Negligible risk reduction.',
    3: 'Minor risk reduction; low-probability issues.',
    4: 'Some stability improvement.',
    5: 'Moderate risk reduction; improves system stability.',
    6: 'Notable risk reduction.',
    7: 'High risk reduction; prevents significant issues.',
    8: 'Very high; prevents a major outage scenario.',
    9: 'Mitigates severe risk.',
    10: 'Eliminates existential / high-impact failure.'
  } as Record<number, string>,
  cr: {
    1: 'No compliance requirement.',
    2: 'Minimal internal interest.',
    3: 'Internal policy alignment; nice to have.',
    4: 'Recommended internally.',
    5: 'Recommended by audit; should address.',
    6: 'Expected by audit or policy.',
    7: 'Required by regulation or SLA (future timeline).',
    8: 'Required soon; defined timeline.',
    9: 'Near-term mandate or SLA breach risk.',
    10: 'Mandated by law, DoD directive, or immediate SLA breach risk.'
  } as Record<number, string>,
};

// ===========================
// STORAGE KEYS
// ===========================

export const STORAGE_KEYS = {
  INITIATIVES: 'wsjf_initiatives',
  WEIGHTS: 'wsjf_weights',
  DARK_MODE: 'darkMode',
};

// ===========================
// RANK OPTIONS
// ===========================

export const RANK_OPTIONS = [
  'E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9',
  'W-1', 'W-2', 'W-3', 'W-4', 'W-5',
  'O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10',
  'GS-7', 'GS-9', 'GS-11', 'GS-12', 'GS-13', 'GS-14', 'GS-15',
  'CIV',
];
