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
export const DEFAULT_SCORE = 3;

// ===========================
// WSJF SCORING TUNABLES
// ===========================

// Sprint dampening exponent for WSJF = CoD / sprints^alpha.
// 1 = classic WSJF (linear), 0.5 = square-root dampening (recommended — a vendor
// claiming 1 vs 4 sprints gets a 2x edge instead of 4x), 0 = ignore sprints entirely.
export const DEFAULT_SPRINT_ALPHA = 0.5;

// Architecture features have no voter Business Value; they get this fixed mid-scale
// BV (instead of the 1.0 floor) so risk/architecture work isn't auto-bottomed vs.
// voted user-facing features.
export const ARCHITECTURE_BV_FLOOR = 3;

// Default Cost-of-Delay weights. BV stays highest, but RR is raised toward it
// (and CR kept low) to reduce the Business-Value vs. Risk-Reduction disparity.
export const DEFAULT_WEIGHTS = { bv: 3, tc: 2, rr: 2.5, cr: 1 };

// ===========================
// SCORING DEFINITIONS
// ===========================

export const definitions = {
  bv: {
    1: 'Minimal user benefit; purely technical or internal.',
    2: 'Small improvement; affects a limited group or edge case.',
    3: 'Moderate value; addresses a common user need.',
    4: 'High value; significant impact on mission readiness.',
    5: 'Major value; transforms user capability or removes critical blocker.'
  } as Record<number, string>,
  tc: {
    1: 'No time pressure; do anytime.',
    2: 'Some urgency; within the next few PIs.',
    3: 'Moderate criticality; within 1-2 PIs.',
    4: 'Urgent; must deliver this PI or face impact.',
    5: 'Severe criticality; miss this PI = mission failure or penalty.'
  } as Record<number, string>,
  rr: {
    1: 'No risk mitigation; does not affect reliability.',
    2: 'Minor risk reduction; addresses low-probability issues.',
    3: 'Moderate risk reduction; improves system stability.',
    4: 'High risk reduction; prevents major outage scenario.',
    5: 'Prevents high-impact failure; eliminates existential risk.'
  } as Record<number, string>,
  cr: {
    1: 'No compliance requirement.',
    2: 'Internal policy alignment; nice to have.',
    3: 'Recommended by audit; should address.',
    4: 'Required by regulation or SLA within defined timeline.',
    5: 'Mandated by law, DoD directive, or immediate SLA breach risk.'
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
