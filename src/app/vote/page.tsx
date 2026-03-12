'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sun, Moon, CheckCircle, Clock, Vote } from 'lucide-react';
import { getTheme } from '../../lib/theme';
import { ALL_PERSONAS, ALL_SERVICES, PERSONA_LABELS, SERVICE_LABELS, definitions, RANK_OPTIONS } from '../../lib/constants';
import type { PersonaType, ServiceType, SessionMeta, Feature, VoterProfile, FeatureVote } from '../../lib/types';
import {
  joinSession,
  submitVote,
  listenToSessionMeta,
  listenToFeatures,
  listenToVoters,
  listenToVotes,
} from '../../lib/firebase';

// ===========================
// VOTER PAGE (wrapped in Suspense)
// ===========================

function VotePageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('s');

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(saved ? saved === 'true' : prefersDark);
    }
  }, []);
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', next.toString());
      return next;
    });
  };
  const theme = getTheme(isDarkMode);

  // Voter state
  const [voterId, setVoterId] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [features, setFeatures] = useState<Record<string, Feature>>({});
  const [voterCount, setVoterCount] = useState(0);

  // Sign-in form
  const [persona, setPersona] = useState<PersonaType>('Operator');
  const [service, setService] = useState<ServiceType>('USCYBERCOM');
  const [rank, setRank] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');

  // Voting state
  const [uvScore, setUvScore] = useState(3);
  const [tcScore, setTcScore] = useState(3);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentFeatureVotes, setCurrentFeatureVotes] = useState<Record<string, FeatureVote>>({});

  // ===========================
  // SORTED FEATURES
  // ===========================

  const sortedFeatures = useMemo(() => {
    return Object.values(features).sort((a, b) => a.order - b.order);
  }, [features]);

  const currentFeature = useMemo(() => {
    if (!sessionMeta) return null;
    return sortedFeatures[sessionMeta.currentFeatureIndex] || null;
  }, [sortedFeatures, sessionMeta]);

  // ===========================
  // REAL-TIME LISTENERS
  // ===========================

  useEffect(() => {
    if (!sessionId) return;
    const unsubs = [
      listenToSessionMeta(sessionId, setSessionMeta),
      listenToFeatures(sessionId, (f) => setFeatures(f || {})),
      listenToVoters(sessionId, (v) => setVoterCount(v ? Object.keys(v).length : 0)),
    ];
    return () => unsubs.forEach(u => u());
  }, [sessionId]);

  // Listen for votes on current feature to detect if we've already voted
  useEffect(() => {
    if (!sessionId || !currentFeature) return;
    const unsub = listenToVotes(sessionId, currentFeature.id, (votes) => {
      setCurrentFeatureVotes(votes || {});
      // Check if this voter has already voted
      if (voterId && votes && votes[voterId]) {
        setHasVoted(true);
      } else {
        setHasVoted(false);
        setUvScore(3);
        setTcScore(3);
      }
    });
    return () => unsub();
  }, [sessionId, currentFeature, voterId]);

  // ===========================
  // HANDLERS
  // ===========================

  const handleJoin = async () => {
    if (!sessionId) return;
    if (!lastName.trim() || !firstName.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!rank.trim()) {
      alert('Please enter your rank.');
      return;
    }
    try {
      const id = await joinSession(sessionId, { persona, service, rank: rank.trim(), lastName: lastName.trim(), firstName: firstName.trim() });
      setVoterId(id);
      // Save to localStorage so they can reconnect
      localStorage.setItem(`voter_${sessionId}`, id);
    } catch (e) {
      console.error('Join error:', e);
      alert('Failed to join session. Please try again.');
    }
  };

  const handleSubmitVote = async () => {
    if (!sessionId || !currentFeature || !voterId) return;
    try {
      // Architecture features: UV is always 1 (not voted on)
      const finalUv = currentFeature.featureType === 'architecture' ? 1 : uvScore;
      await submitVote(sessionId, currentFeature.id, voterId, finalUv, tcScore);
      setHasVoted(true);
    } catch (e) {
      console.error('Vote error:', e);
      alert('Failed to submit vote. Please try again.');
    }
  };

  // Restore voter ID from localStorage
  useEffect(() => {
    if (sessionId && !voterId) {
      const saved = localStorage.getItem(`voter_${sessionId}`);
      if (saved) setVoterId(saved);
    }
  }, [sessionId, voterId]);

  // ===========================
  // SHARED STYLES
  // ===========================

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: theme.background,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.textPrimary,
    fontSize: '16px',
    outline: 'none',
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
  };

  // ===========================
  // RENDER: NO SESSION
  // ===========================

  if (!sessionId) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: theme.textPrimary, padding: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '16px' }}>No Session Found</h1>
          <p style={{ color: theme.textSecondary }}>Please scan the QR code provided by your session admin.</p>
        </div>
      </div>
    );
  }

  // ===========================
  // RENDER: SIGN IN
  // ===========================

  if (!voterId) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
              Join Voting Session
            </h1>
            <button onClick={toggleDarkMode} style={{ padding: '6px 10px', borderRadius: '20px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {sessionMeta && (
            <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px', backgroundColor: theme.cardBackground, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: theme.textPrimary, marginBottom: '4px' }}>{sessionMeta.title}</h2>
              <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0 }}>{voterCount} voter{voterCount !== 1 ? 's' : ''} joined</p>
            </div>
          )}

          <div style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Persona</label>
              <select value={persona} onChange={e => setPersona(e.target.value as PersonaType)} style={selectStyle}>
                {ALL_PERSONAS.map(p => <option key={p} value={p}>{PERSONA_LABELS[p]}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Service/Sub-Unified</label>
              <select value={service} onChange={e => setService(e.target.value as ServiceType)} style={selectStyle}>
                {ALL_SERVICES.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Rank</label>
              <select value={rank} onChange={e => setRank(e.target.value)} style={selectStyle}>
                <option value="">Select rank...</option>
                {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" style={inputStyle} />
              </div>
            </div>

            <button onClick={handleJoin} style={{
              width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white',
              fontWeight: '700', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <CheckCircle size={20} /> Join Session
            </button>
          </div>
        </div>

        <style>{`select option { background-color: #1f2937; color: #f9fafb; }`}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: LOBBY (waiting for admin)
  // ===========================

  if (sessionMeta?.status === 'lobby') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '24px', maxWidth: '400px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <Clock size={40} style={{ color: '#60a5fa' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>
            Waiting for Admin
          </h2>
          <p style={{ color: theme.textSecondary, fontSize: '15px', marginBottom: '16px' }}>
            {sessionMeta.title}
          </p>
          <p style={{ color: theme.textMuted, fontSize: '14px' }}>
            {voterCount} voter{voterCount !== 1 ? 's' : ''} ready
          </p>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }`}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: VOTING
  // ===========================

  if (sessionMeta?.status === 'voting' && currentFeature) {
    const progress = `${sessionMeta.currentFeatureIndex + 1} / ${sortedFeatures.length}`;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
          {/* Progress */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: theme.textMuted, marginBottom: '6px' }}>
              <span>Feature {progress}</span>
              <button onClick={toggleDarkMode} style={{ padding: '4px 8px', borderRadius: '16px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
            <div style={{ height: '6px', backgroundColor: theme.sliderBg, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((sessionMeta.currentFeatureIndex + 1) / sortedFeatures.length) * 100}%`,
                backgroundColor: '#3b82f6',
                borderRadius: '3px',
                transition: 'width 300ms ease',
              }} />
            </div>
          </div>

          {/* Feature info */}
          <div style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.textPrimary, margin: 0 }}>{currentFeature.name}</h2>
              <span style={{
                padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '600',
                backgroundColor: currentFeature.featureType === 'architecture' ? '#7c3aed' : '#3b82f6',
                color: 'white',
              }}>
                {currentFeature.featureType === 'architecture' ? 'ARCH' : 'USER'}
              </span>
            </div>
            {currentFeature.jiraNumber && <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '500' }}>{currentFeature.jiraNumber}</span>}
            {currentFeature.problemSolved && (
              <p style={{ color: theme.textSecondary, fontSize: '14px', marginTop: '10px', padding: '10px', backgroundColor: theme.background, borderRadius: '8px', margin: '10px 0 0 0' }}>
                {currentFeature.problemSolved}
              </p>
            )}
          </div>

          {hasVoted ? (
            /* Already voted - waiting */
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.textPrimary, marginBottom: '8px' }}>Vote Submitted!</h3>
              <p style={{ color: theme.textSecondary, fontSize: '14px' }}>Waiting for admin to advance to the next feature...</p>
            </div>
          ) : (
            /* Vote form */
            <div style={{ backgroundColor: theme.cardBackground, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}` }}>
              {/* Business Value — hidden for architecture features */}
              {currentFeature.featureType === 'architecture' ? (
                <div style={{ marginBottom: '24px', padding: '14px', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: '10px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Business Value (UV) = 1</span>
                  </div>
                  <p style={{ fontSize: '12px', color: theme.textMuted, margin: '6px 0 0 0' }}>
                    Architecture items have a fixed UV of 1. Vote on Time Criticality below.
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, margin: 0 }}>Business Value (UV)</h3>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{uvScore}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => setUvScore(score)}
                        style={{
                          flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
                          fontSize: '18px', fontWeight: '700', transition: 'all 150ms ease',
                          backgroundColor: uvScore === score ? '#3b82f6' : theme.sliderBg,
                          color: uvScore === score ? 'white' : theme.textPrimary,
                          transform: uvScore === score ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0 }}>
                    {definitions.uv[uvScore]}
                  </p>
                </div>
              )}

              {/* Time Criticality */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, margin: 0 }}>Time Criticality (TC)</h3>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{tcScore}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      onClick={() => setTcScore(score)}
                      style={{
                        flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontSize: '18px', fontWeight: '700', transition: 'all 150ms ease',
                        backgroundColor: tcScore === score ? '#f59e0b' : theme.sliderBg,
                        color: tcScore === score ? 'white' : theme.textPrimary,
                        transform: tcScore === score ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0 }}>
                  {definitions.tc[tcScore]}
                </p>
              </div>

              {/* Submit */}
              <button onClick={handleSubmitVote} style={{
                width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white',
                fontWeight: '700', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <Vote size={20} /> Lock In Vote
              </button>
            </div>
          )}
        </div>

        <style>{`select option { background-color: #1f2937; color: #f9fafb; }`}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: SCORING / RESULTS (waiting)
  // ===========================

  if (sessionMeta?.status === 'scoring') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Clock size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>Voting Complete!</h2>
          <p style={{ color: theme.textSecondary, fontSize: '15px' }}>Admin is entering final scores. Results coming soon...</p>
        </div>
      </div>
    );
  }

  if (sessionMeta?.status === 'results') {
    const resultsUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname.replace('/vote/', '/results/')}?s=${sessionId}`
      : '';

    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: theme.textPrimary, marginBottom: '8px' }}>Results Are In!</h2>
          <p style={{ color: theme.textSecondary, fontSize: '15px', marginBottom: '20px' }}>Thank you for voting.</p>
          <a
            href={resultsUrl}
            style={{
              display: 'inline-block', padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white',
              fontWeight: '600', borderRadius: '8px', textDecoration: 'none', fontSize: '14px',
            }}
          >
            View Results
          </a>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: theme.textPrimary }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #60a5fa', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p>Connecting...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#f9fafb' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #60a5fa', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <VotePageInner />
    </Suspense>
  );
}
