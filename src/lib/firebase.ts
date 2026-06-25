import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
  remove,
  onValue,
  off,
  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database';
import type {
  SessionMeta,
  Feature,
  VoterProfile,
  FeatureVote,
  FeatureResult,
  SessionStatus,
} from './types';

// ===========================
// FIREBASE CONFIGURATION
// ===========================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

function getDb() {
  return getDatabase(getFirebaseApp());
}

// ===========================
// ANONYMOUS AUTH
// ===========================
// All writes require an authenticated (anonymous) user so the database rules can
// gate writes on `auth != null`. Reads stay public per the rules. The sign-in
// promise is cached so we only authenticate once per session.

let authReady: Promise<void> | null = null;

export function ensureAuth(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!authReady) {
    const auth: Auth = getAuth(getFirebaseApp());
    authReady = auth.currentUser
      ? Promise.resolve()
      : signInAnonymously(auth)
          .then(() => {})
          .catch((e) => {
            // Allow a retry on the next call if sign-in failed (e.g. transient/offline).
            authReady = null;
            throw e;
          });
  }
  return authReady;
}

// ===========================
// SESSION MANAGEMENT
// ===========================

export async function createSession(
  title: string,
  features: Omit<Feature, 'id' | 'order' | 'votingOpen' | 'tc' | 'rr' | 'cr' | 'sprints'>[],
  adminPin: string,
): Promise<string> {
  await ensureAuth();
  const db = getDb();
  const sessionsRef = ref(db, 'sessions');
  const newSessionRef = push(sessionsRef);
  const sessionId = newSessionRef.key!;

  const meta: SessionMeta = {
    title,
    status: 'lobby',
    currentFeatureIndex: 0,
    createdAt: Date.now(),
    adminPin,
  };

  const featuresMap: Record<string, Feature> = {};
  features.forEach((f, index) => {
    const featureRef = push(ref(db, `sessions/${sessionId}/features`));
    const featureId = featureRef.key!;
    featuresMap[featureId] = {
      id: featureId,
      name: f.name,
      jiraNumber: f.jiraNumber,
      problemSolved: f.problemSolved,
      developerTeam: f.developerTeam,
      featureType: f.featureType || 'user',
      order: index,
      votingOpen: false,
      tc: null,
      rr: null,
      cr: null,
      sprints: null,
    };
  });

  await set(newSessionRef, {
    meta,
    features: featuresMap,
  });

  return sessionId;
}

export async function getSession(sessionId: string) {
  const db = getDb();
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const snapshot = await get(sessionRef);
  return snapshot.val();
}

export async function verifyAdminPin(sessionId: string, pin: string): Promise<boolean> {
  const db = getDb();
  const pinRef = ref(db, `sessions/${sessionId}/meta/adminPin`);
  const snapshot = await get(pinRef);
  return snapshot.val() === pin;
}

// ===========================
// SESSION STATUS
// ===========================

export async function setSessionStatus(sessionId: string, status: SessionStatus) {
  await ensureAuth();
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/meta`), { status });
}

export async function advanceFeature(sessionId: string, nextIndex: number) {
  await ensureAuth();
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/meta`), {
    currentFeatureIndex: nextIndex,
  });
}

export async function setFeatureVotingOpen(sessionId: string, featureId: string, open: boolean) {
  await ensureAuth();
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/features/${featureId}`), {
    votingOpen: open,
  });
}

// Persist the scoring configuration (weights + sprint alpha) used to produce the
// current results, so the ranking is reproducible/auditable.
export async function saveScoringConfig(
  sessionId: string,
  config: { weights: { bv: number; tc: number; rr: number; cr: number }; alpha: number },
) {
  await ensureAuth();
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/meta`), { scoringConfig: config });
}

// ===========================
// VOTER MANAGEMENT
// ===========================

export async function joinSession(
  sessionId: string,
  profile: Omit<VoterProfile, 'id' | 'joinedAt'>,
): Promise<string> {
  await ensureAuth();
  const db = getDb();
  const votersRef = ref(db, `sessions/${sessionId}/voters`);
  const newVoterRef = push(votersRef);
  const voterId = newVoterRef.key!;

  const voterProfile: VoterProfile = {
    ...profile,
    id: voterId,
    joinedAt: Date.now(),
  };

  await set(newVoterRef, voterProfile);
  return voterId;
}

// ===========================
// VOTING
// ===========================

export async function submitVote(
  sessionId: string,
  featureId: string,
  voterId: string,
  bv: number,
  tc: number,
) {
  await ensureAuth();
  const db = getDb();
  const voteRef = ref(db, `sessions/${sessionId}/votes/${featureId}/${voterId}`);
  const featureVote: FeatureVote = {
    bv,
    tc,
    timestamp: Date.now(),
  };
  await set(voteRef, featureVote);
}

// ===========================
// ADMIN SCORE ENTRY
// ===========================

export async function updateFeatureScores(
  sessionId: string,
  featureId: string,
  rr: number,
  cr: number,
  sprints: number,
  tc?: number,
) {
  await ensureAuth();
  const db = getDb();
  const updates: Record<string, number> = { rr, cr, sprints };
  if (tc !== undefined) updates.tc = tc;
  await update(ref(db, `sessions/${sessionId}/features/${featureId}`), updates);
}

// ===========================
// SESSION RESET (preserve architecture votes)
// ===========================

export async function resetUserFeatureVoting(
  sessionId: string,
  userFeatureIds: string[],
  firstUserFeatureIndex: number,
) {
  await ensureAuth();
  const db = getDb();

  // Remove votes for user-facing features only
  for (const fId of userFeatureIds) {
    await remove(ref(db, `sessions/${sessionId}/votes/${fId}`));
  }

  // Reset user-facing feature scores back to null
  for (const fId of userFeatureIds) {
    await update(ref(db, `sessions/${sessionId}/features/${fId}`), {
      votingOpen: false,
      tc: null,
      rr: null,
      cr: null,
      sprints: null,
    });
  }

  // Clear results
  await remove(ref(db, `sessions/${sessionId}/results`));

  // Reset session to voting at the first user feature
  await update(ref(db, `sessions/${sessionId}/meta`), {
    status: 'voting',
    currentFeatureIndex: firstUserFeatureIndex,
  });

  // Open voting on the first user feature
  if (userFeatureIds.length > 0) {
    const firstUserFeatureId = userFeatureIds[0];
    await update(ref(db, `sessions/${sessionId}/features/${firstUserFeatureId}`), {
      votingOpen: true,
    });
  }
}

// ===========================
// SESSION MERGE
// ===========================

export async function mergeSessions(
  archSessionId: string,
  userSessionId: string,
  title: string,
  adminPin: string,
): Promise<string> {
  await ensureAuth();
  const db = getDb();

  // Read both sessions
  const archSession = await getSession(archSessionId);
  const userSession = await getSession(userSessionId);

  if (!archSession || !userSession) {
    throw new Error('One or both sessions not found.');
  }

  const archFeatures: Record<string, Feature> = archSession.features || {};
  const userFeatures: Record<string, Feature> = userSession.features || {};

  // Filter: architecture features from session 1, user features from session 2
  const archOnly = Object.entries(archFeatures)
    .filter(([, f]) => (f.featureType || 'user') === 'architecture');
  const userOnly = Object.entries(userFeatures)
    .filter(([, f]) => (f.featureType || 'user') === 'user');

  // Build merged features with new IDs and re-ordered (arch first, then user)
  const sessionsRef = ref(db, 'sessions');
  const newSessionRef = push(sessionsRef);
  const newSessionId = newSessionRef.key!;

  const mergedFeatures: Record<string, Feature> = {};
  const oldToNewFeatureId: Record<string, string> = {};
  let order = 0;

  // Architecture features first
  for (const [oldId, f] of archOnly) {
    const newFeatureRef = push(ref(db, `sessions/${newSessionId}/features`));
    const newId = newFeatureRef.key!;
    oldToNewFeatureId[oldId] = newId;
    mergedFeatures[newId] = {
      ...f,
      id: newId,
      order: order++,
      votingOpen: false,
    };
  }

  // User features next
  for (const [oldId, f] of userOnly) {
    const newFeatureRef = push(ref(db, `sessions/${newSessionId}/features`));
    const newId = newFeatureRef.key!;
    oldToNewFeatureId[oldId] = newId;
    mergedFeatures[newId] = {
      ...f,
      id: newId,
      order: order++,
      votingOpen: false,
    };
  }

  // Voters from user session only
  const mergedVoters: Record<string, VoterProfile> = userSession.voters || {};

  // Votes: only user-feature votes from user session (architecture has no voter votes)
  const userVotes: Record<string, Record<string, FeatureVote>> = userSession.votes || {};
  const mergedVotes: Record<string, Record<string, FeatureVote>> = {};
  for (const [oldFeatureId, votes] of Object.entries(userVotes)) {
    const newFeatureId = oldToNewFeatureId[oldFeatureId];
    if (newFeatureId) {
      mergedVotes[newFeatureId] = votes as Record<string, FeatureVote>;
    }
  }

  const meta: SessionMeta = {
    title,
    status: 'results',
    currentFeatureIndex: order - 1,
    createdAt: Date.now(),
    adminPin,
  };

  await set(newSessionRef, {
    meta,
    features: mergedFeatures,
    voters: mergedVoters,
    votes: mergedVotes,
  });

  return newSessionId;
}

// ===========================
// RESULTS
// ===========================

export async function saveResults(
  sessionId: string,
  results: Record<string, FeatureResult>,
) {
  await ensureAuth();
  const db = getDb();
  await set(ref(db, `sessions/${sessionId}/results`), results);
}

// ===========================
// REAL-TIME LISTENERS
// ===========================

export function listenToSessionMeta(
  sessionId: string,
  callback: (meta: SessionMeta | null) => void,
): Unsubscribe {
  const db = getDb();
  const metaRef = ref(db, `sessions/${sessionId}/meta`);
  const unsub = onValue(metaRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(metaRef);
}

export function listenToFeatures(
  sessionId: string,
  callback: (features: Record<string, Feature> | null) => void,
): Unsubscribe {
  const db = getDb();
  const featuresRef = ref(db, `sessions/${sessionId}/features`);
  const unsub = onValue(featuresRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(featuresRef);
}

export function listenToVoters(
  sessionId: string,
  callback: (voters: Record<string, VoterProfile> | null) => void,
): Unsubscribe {
  const db = getDb();
  const votersRef = ref(db, `sessions/${sessionId}/voters`);
  const unsub = onValue(votersRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(votersRef);
}

export function listenToVotes(
  sessionId: string,
  featureId: string,
  callback: (votes: Record<string, FeatureVote> | null) => void,
): Unsubscribe {
  const db = getDb();
  const votesRef = ref(db, `sessions/${sessionId}/votes/${featureId}`);
  const unsub = onValue(votesRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(votesRef);
}

export function listenToAllVotes(
  sessionId: string,
  callback: (votes: Record<string, Record<string, FeatureVote>> | null) => void,
): Unsubscribe {
  const db = getDb();
  const votesRef = ref(db, `sessions/${sessionId}/votes`);
  const unsub = onValue(votesRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(votesRef);
}

export function listenToResults(
  sessionId: string,
  callback: (results: Record<string, FeatureResult> | null) => void,
): Unsubscribe {
  const db = getDb();
  const resultsRef = ref(db, `sessions/${sessionId}/results`);
  const unsub = onValue(resultsRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(resultsRef);
}

export { ref, getDb };
