import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
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
// SESSION MANAGEMENT
// ===========================

export async function createSession(
  title: string,
  features: Omit<Feature, 'id' | 'order' | 'votingOpen' | 'rr' | 'cr' | 'sprints'>[],
  adminPin: string,
): Promise<string> {
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
      order: index,
      votingOpen: false,
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
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/meta`), { status });
}

export async function advanceFeature(sessionId: string, nextIndex: number) {
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/meta`), {
    currentFeatureIndex: nextIndex,
  });
}

export async function setFeatureVotingOpen(sessionId: string, featureId: string, open: boolean) {
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/features/${featureId}`), {
    votingOpen: open,
  });
}

// ===========================
// VOTER MANAGEMENT
// ===========================

export async function joinSession(
  sessionId: string,
  profile: Omit<VoterProfile, 'id' | 'joinedAt'>,
): Promise<string> {
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
  uv: number,
  tc: number,
) {
  const db = getDb();
  const voteRef = ref(db, `sessions/${sessionId}/votes/${featureId}/${voterId}`);
  const featureVote: FeatureVote = {
    uv,
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
) {
  const db = getDb();
  await update(ref(db, `sessions/${sessionId}/features/${featureId}`), {
    rr,
    cr,
    sprints,
  });
}

// ===========================
// RESULTS
// ===========================

export async function saveResults(
  sessionId: string,
  results: Record<string, FeatureResult>,
) {
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
