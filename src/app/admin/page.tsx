'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Sun, Moon, Plus, Trash2, ChevronRight, ChevronDown, ChevronUp, Lock, Unlock, FileDown, FileText, Users, CheckCircle, ArrowRight, BarChart3, Eye, EyeOff, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getTheme } from '../../lib/theme';
import { ALL_PERSONAS, ALL_SERVICES, PERSONA_LABELS, SERVICE_LABELS, definitions, RANK_OPTIONS } from '../../lib/constants';
import { calculateFeatureWSJF } from '../../lib/algorithm';
import { exportResultsCSV, exportResultsPDF } from '../../lib/export-utils';
import type { Feature, FeatureType, VoterProfile, FeatureVote, FeatureResult, SessionMeta, SessionStatus, Weights } from '../../lib/types';
import {
  createSession,
  verifyAdminPin,
  setSessionStatus,
  advanceFeature,
  setFeatureVotingOpen,
  updateFeatureScores,
  saveResults,
  resetUserFeatureVoting,
  listenToSessionMeta,
  listenToFeatures,
  listenToVoters,
  listenToVotes,
  listenToAllVotes,
} from '../../lib/firebase';

// ===========================
// ADMIN PAGE (wrapped in Suspense)
// ===========================

function AdminPageInner() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('s');

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

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam);
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [features, setFeatures] = useState<Record<string, Feature>>({});
  const [voters, setVoters] = useState<Record<string, VoterProfile>>({});
  const [allVotes, setAllVotes] = useState<Record<string, Record<string, FeatureVote>>>({});
  const [results, setResults] = useState<FeatureResult[]>([]);
  const [weights, setWeights] = useState<Weights>({ bv: 1, tc: 1, rr: 1, cr: 1 });
  const [isExporting, setIsExporting] = useState(false);

  // Creation form state
  const [sessionTitle, setSessionTitle] = useState('');
  const [newPin, setNewPin] = useState('');
  const [featureInputs, setFeatureInputs] = useState<Array<{
    name: string; jiraNumber: string; problemSolved: string; developerTeam: string; featureType: FeatureType;
  }>>([{ name: '', jiraNumber: '', problemSolved: '', developerTeam: '', featureType: 'user' }]);

  // Admin score entry state — tc included for architecture features
  const [featureScores, setFeatureScores] = useState<Record<string, { tc: number; rr: number; cr: number; sprints: number }>>({});
  // Inline scoring: after locking votes, admin scores RR/CR/Sprints before advancing
  const [inlineScoring, setInlineScoring] = useState<string | null>(null); // featureId being scored, or null

  // Results tab state
  const [activeTeamTab, setActiveTeamTab] = useState<string>('');
  const [showVoterDetails, setShowVoterDetails] = useState(false);
  const [showVoterList, setShowVoterList] = useState(false);

  // ===========================
  // SORTED FEATURES
  // ===========================

  const sortedFeatures = useMemo(() => {
    // Architecture features first, then user-facing, preserving original order within each group
    return Object.values(features).sort((a, b) => {
      const typeOrder = (f: Feature) => (f.featureType || 'user') === 'architecture' ? 0 : 1;
      const typeDiff = typeOrder(a) - typeOrder(b);
      if (typeDiff !== 0) return typeDiff;
      return a.order - b.order;
    });
  }, [features]);

  const currentFeature = useMemo(() => {
    if (!sessionMeta) return null;
    return sortedFeatures[sessionMeta.currentFeatureIndex] || null;
  }, [sortedFeatures, sessionMeta]);

  // Initialize architecture feature scores when current feature changes
  useEffect(() => {
    if (currentFeature && (currentFeature.featureType || 'user') === 'architecture' && !featureScores[currentFeature.id]) {
      setFeatureScores(prev => ({
        ...prev,
        [currentFeature.id]: { tc: 3, rr: 3, cr: 1, sprints: 1 },
      }));
    }
  }, [currentFeature]);

  // ===========================
  // REAL-TIME LISTENERS
  // ===========================

  useEffect(() => {
    if (!sessionId || !isAuthenticated) return;
    const unsubs = [
      listenToSessionMeta(sessionId, setSessionMeta),
      listenToFeatures(sessionId, (f) => setFeatures(f || {})),
      listenToVoters(sessionId, (v) => setVoters(v || {})),
      listenToAllVotes(sessionId, (v) => setAllVotes(v || {})),
    ];
    return () => unsubs.forEach(u => u());
  }, [sessionId, isAuthenticated]);

  // ===========================
  // QR CODE URL
  // ===========================

  const voteUrl = useMemo(() => {
    if (typeof window === 'undefined' || !sessionId) return '';
    const base = window.location.origin;
    const basePath = window.location.pathname.includes('/WSJF-App') ? '/WSJF-App' : '';
    return `${base}${basePath}/vote/?s=${sessionId}`;
  }, [sessionId]);

  // ===========================
  // HANDLERS
  // ===========================

  const handleCreateSession = async () => {
    if (!sessionTitle.trim()) { alert('Please enter a session title.'); return; }
    if (!newPin.trim() || newPin.length < 4) { alert('Please enter a 4+ digit admin PIN.'); return; }
    const validFeatures = featureInputs.filter(f => f.name.trim()).map(f => ({ ...f, featureType: f.featureType || 'user' as const }));
    if (validFeatures.length === 0) { alert('Please add at least one feature.'); return; }

    try {
      const id = await createSession(sessionTitle.trim(), validFeatures, newPin);
      setSessionId(id);
      setAdminPin(newPin);
      setIsAuthenticated(true);
      // Update URL without reload
      window.history.replaceState({}, '', `${window.location.pathname}?s=${id}`);
    } catch (e) {
      console.error('Failed to create session:', e);
      alert('Failed to create session. Check your Firebase configuration.');
    }
  };

  const handleLogin = async () => {
    if (!sessionId || !adminPin) return;
    try {
      const valid = await verifyAdminPin(sessionId, adminPin);
      if (valid) {
        setIsAuthenticated(true);
      } else {
        alert('Invalid PIN.');
      }
    } catch (e) {
      console.error('Login error:', e);
      alert('Failed to verify PIN. Check your connection.');
    }
  };

  const handleStartVoting = async () => {
    if (!sessionId) return;
    await setSessionStatus(sessionId, 'voting');
    // Open first feature for voting (architecture features don't need votingOpen but set it for consistency)
    if (sortedFeatures[0]) {
      await setFeatureVotingOpen(sessionId, sortedFeatures[0].id, true);
    }
  };

  // --- Architecture feature: admin saves all scores and advances ---
  const handleArchitectureSave = async () => {
    if (!sessionId || !sessionMeta || !currentFeature) return;
    const scores = featureScores[currentFeature.id] || { tc: 3, rr: 3, cr: 1, sprints: 1 };

    // Close feature and save scores (including admin TC)
    await setFeatureVotingOpen(sessionId, currentFeature.id, false);
    await updateFeatureScores(sessionId, currentFeature.id, scores.rr, scores.cr, scores.sprints, scores.tc);

    const nextIndex = sessionMeta.currentFeatureIndex + 1;
    if (nextIndex < sortedFeatures.length) {
      await advanceFeature(sessionId, nextIndex);
      await setFeatureVotingOpen(sessionId, sortedFeatures[nextIndex].id, true);
    } else {
      // All features done — calculate and show results
      await finalizeResults();
    }
  };

  // --- User-facing feature: lock votes, show inline scoring ---
  const handleLockAndAdvance = async () => {
    if (!sessionId || !sessionMeta || !currentFeature) return;
    // Close current feature voting
    await setFeatureVotingOpen(sessionId, currentFeature.id, false);

    // Initialize default scores for this feature if not already set
    setFeatureScores(prev => ({
      ...prev,
      [currentFeature.id]: prev[currentFeature.id] || { tc: 3, rr: currentFeature.rr ?? 3, cr: currentFeature.cr ?? 1, sprints: currentFeature.sprints ?? 1 },
    }));

    // Show inline scoring form — admin enters RR/CR/Sprints while voters wait
    setInlineScoring(currentFeature.id);
  };

  // After admin finishes inline scoring, save and advance to next feature (or results)
  const handleInlineScoringDone = async () => {
    if (!sessionId || !sessionMeta || !inlineScoring) return;
    const scores = featureScores[inlineScoring] || { tc: 3, rr: 3, cr: 1, sprints: 1 };

    // Save this feature's scores to Firebase immediately
    await updateFeatureScores(sessionId, inlineScoring, scores.rr, scores.cr, scores.sprints);

    setInlineScoring(null);

    const nextIndex = sessionMeta.currentFeatureIndex + 1;
    if (nextIndex < sortedFeatures.length) {
      // Advance to next feature
      await advanceFeature(sessionId, nextIndex);
      await setFeatureVotingOpen(sessionId, sortedFeatures[nextIndex].id, true);
    } else {
      // All features voted AND scored — go straight to results
      await finalizeResults();
    }
  };

  // Shared: calculate WSJF for all features and transition to results
  const finalizeResults = async () => {
    if (!sessionId) return;

    // Ensure all features have scores saved
    for (const feature of sortedFeatures) {
      const fScores = featureScores[feature.id] || { tc: 3, rr: 3, cr: 1, sprints: 1 };
      if ((feature.featureType || 'user') === 'architecture') {
        await updateFeatureScores(sessionId, feature.id, fScores.rr, fScores.cr, fScores.sprints, fScores.tc);
      } else {
        await updateFeatureScores(sessionId, feature.id, fScores.rr, fScores.cr, fScores.sprints);
      }
    }

    // Calculate WSJF for all features
    const resultsMap: Record<string, FeatureResult> = {};
    const resultsList: FeatureResult[] = [];

    for (const feature of sortedFeatures) {
      const fVotes = allVotes[feature.id] || {};
      const fScores = featureScores[feature.id] || { tc: 3, rr: 3, cr: 1, sprints: 1 };
      const featureWithScores = {
        ...feature,
        tc: (feature.featureType || 'user') === 'architecture' ? fScores.tc : feature.tc,
        rr: fScores.rr,
        cr: fScores.cr,
        sprints: fScores.sprints,
      };
      const result = calculateFeatureWSJF(featureWithScores, fVotes, voters, weights);
      resultsMap[feature.id] = result;
      resultsList.push(result);
    }

    resultsList.sort((a, b) => b.wsjf - a.wsjf);
    setResults(resultsList);

    await saveResults(sessionId, resultsMap);
    await setSessionStatus(sessionId, 'results');

    setActiveTeamTab('All');
  };

  const handleResetUserFeatures = async () => {
    if (!sessionId) return;
    const confirmed = window.confirm(
      'Reset voting for all user-facing features? Architecture scores will be preserved.'
    );
    if (!confirmed) return;

    const userFeatureIds = sortedFeatures
      .filter(f => (f.featureType || 'user') === 'user')
      .map(f => f.id);
    const firstUserIndex = sortedFeatures.findIndex(f => (f.featureType || 'user') === 'user');

    if (firstUserIndex === -1 || userFeatureIds.length === 0) {
      alert('No user-facing features found.');
      return;
    }

    // Clear local score state for user features
    setFeatureScores(prev => {
      const next = { ...prev };
      for (const fId of userFeatureIds) {
        delete next[fId];
      }
      return next;
    });
    setInlineScoring(null);
    setResults([]);

    await resetUserFeatureVoting(sessionId, userFeatureIds, firstUserIndex);
  };

  const handleSaveScoresAndCalculate = async () => {
    if (!sessionId) return;

    // Save all admin scores to Firebase
    for (const [fId, scores] of Object.entries(featureScores)) {
      const feature = sortedFeatures.find(f => f.id === fId);
      if (feature?.featureType === 'architecture') {
        await updateFeatureScores(sessionId, fId, scores.rr, scores.cr, scores.sprints, scores.tc);
      } else {
        await updateFeatureScores(sessionId, fId, scores.rr, scores.cr, scores.sprints);
      }
    }

    // Calculate WSJF for all features
    const resultsMap: Record<string, FeatureResult> = {};
    const resultsList: FeatureResult[] = [];

    for (const feature of sortedFeatures) {
      const fVotes = allVotes[feature.id] || {};
      const scores = featureScores[feature.id] || { tc: 3, rr: 3, cr: 1, sprints: 1 };
      const featureWithScores = {
        ...feature,
        tc: (feature.featureType || 'user') === 'architecture' ? scores.tc : feature.tc,
        rr: scores.rr,
        cr: scores.cr,
        sprints: scores.sprints,
      };
      const result = calculateFeatureWSJF(featureWithScores, fVotes, voters, weights);
      resultsMap[feature.id] = result;
      resultsList.push(result);
    }

    resultsList.sort((a, b) => b.wsjf - a.wsjf);
    setResults(resultsList);

    // Save to Firebase and transition to results
    await saveResults(sessionId, resultsMap);
    await setSessionStatus(sessionId, 'results');

    setActiveTeamTab('All');
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    exportResultsCSV(results, sessionMeta?.title || 'WSJF Results', voters, allVotes);
  };

  const handleExportPDF = async () => {
    if (results.length === 0) return;
    setIsExporting(true);
    try {
      await exportResultsPDF(results, sessionMeta?.title || 'WSJF Results', voters, allVotes);
    } finally {
      setIsExporting(false);
    }
  };

  // Feature form helpers
  const addFeatureRow = () => {
    setFeatureInputs(prev => [...prev, { name: '', jiraNumber: '', problemSolved: '', developerTeam: '', featureType: 'user' }]);
  };

  const removeFeatureRow = (index: number) => {
    setFeatureInputs(prev => prev.filter((_, i) => i !== index));
  };

  const updateFeatureInput = (index: number, field: string, value: string) => {
    setFeatureInputs(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  // CSV/Excel file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          alert('No data found in file. Ensure your file has at least one row of data.');
          return;
        }

        // Map columns flexibly — match by header name (case-insensitive, partial match)
        // Each column can only be claimed once; order matters (most specific first)
        const headers = Object.keys(rows[0]);
        const claimed = new Set<string>();
        const findCol = (keywords: string[]) => {
          const match = headers.find(h => !claimed.has(h) && keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));
          if (match) claimed.add(match);
          return match;
        };

        // Match type first (most specific) so "Feature Type" doesn't get grabbed by name
        const typeCol = findCol(['type', 'category', 'arch', 'kind']);
        const jiraCol = findCol(['jira', 'ticket', 'issue', 'key']);
        const teamCol = findCol(['team', 'developer', 'dev', 'squad', 'group']);
        const problemCol = findCol(['description', 'desc', 'problem', 'summary', 'detail']);
        const nameCol = findCol(['feature', 'name', 'title', 'capability', 'epic', 'story']);

        if (!nameCol) {
          alert(`Could not find a "Feature Name" column.\n\nDetected columns: ${headers.join(', ')}\n\nExpected a column header containing one of: feature, name, title, capability, epic, story`);
          return;
        }

        // Show column mapping so user can verify
        const mapping = [
          `Feature Name ← "${nameCol}"`,
          typeCol ? `Type ← "${typeCol}"` : 'Type ← (not detected)',
          jiraCol ? `Jira ← "${jiraCol}"` : 'Jira ← (not detected)',
          teamCol ? `Dev Team ← "${teamCol}"` : 'Dev Team ← (not detected)',
          problemCol ? `Description ← "${problemCol}"` : 'Description ← (not detected)',
        ].join('\n');

        const parsed = rows
          .map(row => {
            const typeVal = typeCol ? String(row[typeCol] || '').trim().toLowerCase() : '';
            const isArch = ['arch', 'architecture', 'infra', 'infrastructure', 'platform', 'technical'].some(k => typeVal.includes(k));
            return {
              name: String(row[nameCol] || '').trim(),
              jiraNumber: jiraCol ? String(row[jiraCol] || '').trim() : '',
              developerTeam: teamCol ? String(row[teamCol] || '').trim() : '',
              problemSolved: problemCol ? String(row[problemCol] || '').trim() : '',
              featureType: (isArch ? 'architecture' : 'user') as FeatureType,
            };
          })
          .filter(f => f.name); // Skip empty rows

        if (parsed.length === 0) {
          alert('No features with names found in the file.');
          return;
        }

        // Append to existing features (remove empty placeholder rows first)
        setFeatureInputs(prev => {
          const existing = prev.filter(f => f.name.trim() || f.jiraNumber.trim() || f.developerTeam.trim());
          return [...existing, ...parsed];
        });

        const archCount = parsed.filter(f => (f.featureType || 'user') === 'architecture').length;
        alert(`Imported ${parsed.length} features from "${file.name}"${archCount > 0 ? `\n(${archCount} architecture, ${parsed.length - archCount} user-facing)` : ''}\n\nColumn mapping:\n${mapping}\n\nAll columns in file: ${headers.join(', ')}`);
      } catch (err) {
        console.error('File parse error:', err);
        alert('Failed to parse file. Ensure it is a valid CSV or Excel file.');
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be re-uploaded
    e.target.value = '';
  };

  // ===========================
  // SHARED STYLES
  // ===========================

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.border}`,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: theme.background,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.textPrimary,
    fontSize: '14px',
    outline: 'none',
  };

  const buttonPrimary: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 150ms ease',
  };

  const buttonSuccess: React.CSSProperties = {
    ...buttonPrimary,
    backgroundColor: '#10b981',
  };

  const buttonDanger: React.CSSProperties = {
    ...buttonPrimary,
    backgroundColor: '#ef4444',
  };

  // ===========================
  // RENDER: CREATE SESSION
  // ===========================

  if (!sessionId || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
              PCTE Business Value Voting Tool
            </h1>
            <button onClick={toggleDarkMode} style={{ padding: '8px 12px', borderRadius: '24px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isDarkMode ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
            </button>
          </div>

          {/* Rejoin existing session */}
          {sessionIdParam && !isAuthenticated && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: theme.textPrimary }}>Admin Login</h2>
              <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>Session: <code style={{ color: '#60a5fa' }}>{sessionIdParam}</code></p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Admin PIN</label>
                  <input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Enter PIN..." style={inputStyle} />
                </div>
                <button onClick={handleLogin} style={buttonPrimary}><Lock size={16} /> Login</button>
              </div>
            </div>
          )}

          {/* Create new session */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: theme.textPrimary }}>Create New Voting Session</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Session Title</label>
              <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="e.g., PI 25.2 Feature Prioritization" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: theme.textSecondary, marginBottom: '6px' }}>Admin PIN (4+ digits)</label>
              <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="e.g., 1234" style={{ ...inputStyle, maxWidth: '200px' }} />
            </div>

            {/* Feature list */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, margin: 0 }}>Features ({featureInputs.filter(f => f.name.trim()).length})</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ ...buttonPrimary, padding: '6px 14px', fontSize: '13px', backgroundColor: '#8b5cf6' }}>
                    <Upload size={14} /> Import CSV/Excel
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button onClick={addFeatureRow} style={{ ...buttonPrimary, padding: '6px 14px', fontSize: '13px' }}><Plus size={14} /> Add Feature</button>
                </div>
              </div>

              {featureInputs.map((fi, index) => (
                <div key={index} style={{
                  padding: '16px',
                  backgroundColor: theme.background,
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: `1px solid ${theme.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>Feature #{index + 1}</span>
                      <button
                        onClick={() => updateFeatureInput(index, 'featureType', fi.featureType === 'user' ? 'architecture' : 'user')}
                        style={{
                          padding: '3px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                          fontSize: '11px', fontWeight: '600', letterSpacing: '0.03em',
                          backgroundColor: (fi.featureType || 'user') === 'architecture' ? '#7c3aed' : '#3b82f6',
                          color: 'white',
                        }}
                      >
                        {(fi.featureType || 'user') === 'architecture' ? 'ARCH' : 'USER'}
                      </button>
                    </div>
                    {featureInputs.length > 1 && (
                      <button onClick={() => removeFeatureRow(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Feature Name *</label>
                      <input value={fi.name} onChange={e => updateFeatureInput(index, 'name', e.target.value)} placeholder="Feature name..." style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Jira Number</label>
                      <input value={fi.jiraNumber} onChange={e => updateFeatureInput(index, 'jiraNumber', e.target.value)} placeholder="PCTE-1234" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Developer Team *</label>
                      <input value={fi.developerTeam} onChange={e => updateFeatureInput(index, 'developerTeam', e.target.value)} placeholder="Team Alpha" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Description</label>
                      <input value={fi.problemSolved} onChange={e => updateFeatureInput(index, 'problemSolved', e.target.value)} placeholder="Describe what this feature does..." style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleCreateSession} style={{ ...buttonSuccess, fontSize: '16px', padding: '12px 28px' }}>
              <CheckCircle size={18} /> Create Session
            </button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: LOBBY
  // ===========================

  if (sessionMeta?.status === 'lobby') {
    const hasUserFeatures = sortedFeatures.some(f => f.featureType !== 'architecture');

    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
              {sessionMeta.title}
            </h1>
            <button onClick={toggleDarkMode} style={{ padding: '8px 12px', borderRadius: '24px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isDarkMode ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
            </button>
          </div>

          {/* QR Code */}
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: theme.textPrimary }}>Scan to Join</h2>
            <div style={{ display: 'inline-block', padding: '16px', backgroundColor: 'white', borderRadius: '12px', marginBottom: '16px' }}>
              <QRCodeSVG value={voteUrl} size={220} />
            </div>
            <p style={{ fontSize: '13px', color: theme.textMuted, wordBreak: 'break-all', marginBottom: '8px' }}>{voteUrl}</p>
            <button onClick={() => navigator.clipboard.writeText(voteUrl)} style={{ ...buttonPrimary, padding: '6px 16px', fontSize: '13px' }}>
              Copy Link
            </button>
          </div>

          {/* Voters joined */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.textPrimary, margin: 0 }}>
                <Users size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Voters Joined: {Object.keys(voters).length}
              </h2>
              <button onClick={handleStartVoting} disabled={!hasUserFeatures && Object.keys(voters).length === 0} style={{ ...buttonSuccess, opacity: (!hasUserFeatures && Object.keys(voters).length === 0) ? 0.5 : 1, cursor: (!hasUserFeatures && Object.keys(voters).length === 0) ? 'not-allowed' : 'pointer' }}>
                <ArrowRight size={16} /> Start Voting
              </button>
            </div>

            {Object.values(voters).length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Name</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Paygrade</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Persona</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Service/Sub-Unified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(voters).map(v => (
                      <tr key={v.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '8px', color: theme.textPrimary }}>{v.rank} {v.lastName}, {v.firstName}</td>
                        <td style={{ padding: '8px', color: theme.textSecondary }}>{v.rank}</td>
                        <td style={{ padding: '8px', color: theme.textSecondary }}>{PERSONA_LABELS[v.persona]}</td>
                        <td style={{ padding: '8px', color: theme.textSecondary }}>{SERVICE_LABELS[v.service]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Feature list preview */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: theme.textPrimary }}>Features to Vote On ({sortedFeatures.length})</h2>
            {sortedFeatures.map((f, i) => (
              <div key={f.id} style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: '600', minWidth: '24px' }}>{i + 1}.</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                    backgroundColor: (f.featureType || 'user') === 'architecture' ? '#7c3aed' : '#3b82f6',
                    color: 'white',
                  }}>
                    {(f.featureType || 'user') === 'architecture' ? 'ARCH' : 'USER'}
                  </span>
                  <span style={{ color: theme.textPrimary, fontWeight: '500' }}>{f.name}</span>
                  {f.jiraNumber && <span style={{ color: theme.textMuted, fontSize: '12px' }}>({f.jiraNumber})</span>}
                  <span style={{ color: '#60a5fa', fontSize: '12px' }}>{f.developerTeam}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===========================
  // RENDER: VOTING
  // ===========================

  if (sessionMeta?.status === 'voting') {
    const voterCount = Object.keys(voters).length;
    const currentVotes = currentFeature ? (allVotes[currentFeature.id] || {}) : {};
    const votedCount = Object.keys(currentVotes).length;
    const progress = sessionMeta ? `${sessionMeta.currentFeatureIndex + 1} / ${sortedFeatures.length}` : '';
    const isArchFeature = (currentFeature?.featureType || 'user') === 'architecture';

    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>{sessionMeta.title}</h1>
            <button onClick={toggleDarkMode} style={{ padding: '8px 12px', borderRadius: '24px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isDarkMode ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: theme.textMuted, marginBottom: '6px' }}>
              <span>Feature {progress}</span>
              {!isArchFeature && <span>{votedCount} / {voterCount} voted</span>}
              {isArchFeature && <span style={{ color: '#a78bfa' }}>Admin Scoring (Architecture)</span>}
            </div>
            <div style={{ height: '8px', backgroundColor: theme.sliderBg, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((sessionMeta.currentFeatureIndex) / sortedFeatures.length) * 100}%`,
                backgroundColor: isArchFeature ? '#7c3aed' : '#3b82f6',
                borderRadius: '4px',
                transition: 'width 300ms ease',
              }} />
            </div>
          </div>

          {/* ============ ARCHITECTURE FEATURE: Admin sliders (no voters) ============ */}
          {currentFeature && isArchFeature && !inlineScoring && (() => {
            const scores = featureScores[currentFeature.id] || { tc: 3, rr: 3, cr: 1, sprints: 1 };
            return (
              <div style={{ ...cardStyle, border: '2px solid #7c3aed' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                    backgroundColor: '#7c3aed', color: 'white',
                  }}>ARCHITECTURE</span>
                  <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '600' }}>Admin-Only Scoring — No Voter Participation</span>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 4px 0' }}>{currentFeature.name}</h2>
                {currentFeature.jiraNumber && <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '500' }}>{currentFeature.jiraNumber}</span>}
                <span style={{ color: theme.textMuted, fontSize: '13px', marginLeft: '12px' }}>{currentFeature.developerTeam}</span>

                {currentFeature.problemSolved && (
                  <p style={{ color: theme.textSecondary, fontSize: '14px', padding: '12px', backgroundColor: theme.background, borderRadius: '8px', margin: '12px 0 0 0' }}>
                    {currentFeature.problemSolved}
                  </p>
                )}

                {/* BV fixed at 1 */}
                <div style={{ marginTop: '20px', marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#a78bfa' }}>Business Value (BV)</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>1</span>
                  </div>
                  <p style={{ fontSize: '12px', color: theme.textMuted, margin: '4px 0 0 0' }}>Architecture items have a fixed BV of 1.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {/* TC */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Time Criticality (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.tc}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [currentFeature.id]: { ...prev[currentFeature.id], tc: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.tc[scores.tc]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b' }}>{scores.tc}</span>
                    </div>
                  </div>
                  {/* RR */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Risk Reduction (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.rr}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [currentFeature.id]: { ...prev[currentFeature.id], rr: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.rr[scores.rr]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.rr}</span>
                    </div>
                  </div>
                  {/* CR */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Compliance/Regulatory (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.cr}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [currentFeature.id]: { ...prev[currentFeature.id], cr: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.cr[scores.cr]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.cr}</span>
                    </div>
                  </div>
                  {/* Sprints */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Sprints (1-20)</label>
                    <input
                      type="range" min="1" max="20" value={scores.sprints}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [currentFeature.id]: { ...prev[currentFeature.id], sprints: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.sprints}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={handleArchitectureSave} style={{ ...buttonSuccess, backgroundColor: '#7c3aed' }}>
                    {sessionMeta.currentFeatureIndex + 1 >= sortedFeatures.length ? (
                      <><BarChart3 size={16} /> Save & Show Results</>
                    ) : (
                      <><ArrowRight size={16} /> Save & Next Feature</>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ============ USER-FACING FEATURE: QR + voter participation ============ */}
          {currentFeature && !isArchFeature && !inlineScoring && (
            <>
              {/* QR Code for user-facing features */}
              <div style={{ ...cardStyle, textAlign: 'center', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-block', padding: '12px', backgroundColor: 'white', borderRadius: '10px' }}>
                    <QRCodeSVG value={voteUrl} size={140} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: theme.textPrimary, margin: '0 0 4px 0' }}>Scan to Vote</p>
                    <p style={{ fontSize: '12px', color: theme.textMuted, margin: '0 0 8px 0', wordBreak: 'break-all', maxWidth: '300px' }}>{voteUrl}</p>
                    <button onClick={() => navigator.clipboard.writeText(voteUrl)} style={{ ...buttonPrimary, padding: '4px 12px', fontSize: '12px' }}>
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Collapsible voter list */}
                <div style={{ marginTop: '12px', borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                  <button
                    onClick={() => setShowVoterList(prev => !prev)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
                  >
                    <Users size={16} />
                    Voters Joined: {voterCount}
                    {showVoterList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showVoterList && Object.values(voters).length > 0 && (
                    <div style={{ marginTop: '10px', overflowX: 'auto', textAlign: 'left' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Name</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Paygrade</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Persona</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', color: theme.textMuted, fontWeight: '500' }}>Service</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(voters).map(v => (
                            <tr key={v.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                              <td style={{ padding: '6px 8px', color: theme.textPrimary }}>{v.rank} {v.lastName}, {v.firstName}</td>
                              <td style={{ padding: '6px 8px', color: theme.textSecondary }}>{v.rank}</td>
                              <td style={{ padding: '6px 8px', color: theme.textSecondary }}>{PERSONA_LABELS[v.persona]}</td>
                              <td style={{ padding: '6px 8px', color: theme.textSecondary }}>{SERVICE_LABELS[v.service]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.textPrimary, margin: 0 }}>{currentFeature.name}</h2>
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        backgroundColor: '#3b82f6', color: 'white',
                      }}>USER-FACING</span>
                    </div>
                    {currentFeature.jiraNumber && <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '500' }}>{currentFeature.jiraNumber}</span>}
                    <span style={{ color: theme.textMuted, fontSize: '13px', marginLeft: '12px' }}>{currentFeature.developerTeam}</span>
                  </div>
                </div>
                {currentFeature.problemSolved && (
                  <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '16px', padding: '12px', backgroundColor: theme.background, borderRadius: '8px', margin: '0 0 16px 0' }}>
                    {currentFeature.problemSolved}
                  </p>
                )}

                {/* Vote count indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: theme.background, borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: votedCount === voterCount ? '#10b981' : '#f59e0b' }}>{votedCount}</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>of {voterCount} voted</div>
                  </div>
                  <div style={{ height: '60px', width: '1px', backgroundColor: theme.border }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#60a5fa' }}>{voterCount - votedCount}</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>waiting</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={handleResetUserFeatures} style={{ ...buttonDanger, fontSize: '12px', padding: '8px 12px' }}>
                    Reset User Features
                  </button>
                  <button onClick={handleLockAndAdvance} style={buttonSuccess}>
                    <Lock size={16} /> Lock Votes & Score
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Inline admin scoring — shown after votes are locked for user-facing features */}
          {inlineScoring && (() => {
            const scoringFeature = sortedFeatures.find(f => f.id === inlineScoring);
            const scores = featureScores[inlineScoring] || { tc: 3, rr: 3, cr: 1, sprints: 1 };
            const isLastFeature = sessionMeta.currentFeatureIndex + 1 >= sortedFeatures.length;

            return scoringFeature ? (
              <div style={{ ...cardStyle, border: '2px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Voters are waiting — enter scores for this feature
                  </span>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 4px 0' }}>{scoringFeature.name}</h2>
                {scoringFeature.jiraNumber && <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '500' }}>{scoringFeature.jiraNumber}</span>}
                <span style={{ color: theme.textMuted, fontSize: '13px', marginLeft: '12px' }}>{scoringFeature.developerTeam}</span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
                  {/* RR */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Risk Reduction (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.rr}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [inlineScoring]: { ...prev[inlineScoring], rr: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.rr[scores.rr]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.rr}</span>
                    </div>
                  </div>
                  {/* CR */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Compliance/Regulatory (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.cr}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [inlineScoring]: { ...prev[inlineScoring], cr: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.cr[scores.cr]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.cr}</span>
                    </div>
                  </div>
                  {/* Sprints */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Sprints (1-20)</label>
                    <input
                      type="range" min="1" max="20" value={scores.sprints}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [inlineScoring]: { ...prev[inlineScoring], sprints: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.sprints}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={handleInlineScoringDone} style={buttonSuccess}>
                    {isLastFeature ? (
                      <><BarChart3 size={16} /> Save & Show Results</>
                    ) : (
                      <><ArrowRight size={16} /> Save & Next Feature</>
                    )}
                  </button>
                </div>
              </div>
            ) : null;
          })()}

          {/* Scoring legend */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, marginBottom: '12px' }}>Scoring Legend</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>Business Value (BV)</h4>
                {Object.entries(definitions.bv).map(([score, desc]) => (
                  <div key={score} style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                    <strong style={{ color: theme.textPrimary }}>{score}:</strong> {desc}
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>Time Criticality (TC)</h4>
                {Object.entries(definitions.tc).map(([score, desc]) => (
                  <div key={score} style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                    <strong style={{ color: theme.textPrimary }}>{score}:</strong> {desc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          input[type="range"]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; cursor: pointer; }
          input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: none; }
        `}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: SCORING (Admin enters RR, CR, Sprints)
  // ===========================

  if (sessionMeta?.status === 'scoring') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>{sessionMeta.title} — Admin Scoring</h1>
            <button onClick={toggleDarkMode} style={{ padding: '8px 12px', borderRadius: '24px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isDarkMode ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
            </button>
          </div>

          <p style={{ color: theme.textSecondary, marginBottom: '24px' }}>
            Voting is complete. Enter Risk Reduction, Compliance/Regulatory, and Sprint estimates for each feature.
          </p>

          {/* Weights */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, marginBottom: '12px' }}>Cost of Delay Weights</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {(['bv', 'tc', 'rr', 'cr'] as const).map(key => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>{key.toUpperCase()} Weight</label>
                  <input
                    type="range" min="1" max="10" value={weights[key]}
                    onChange={e => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#60a5fa' }}>{weights[key]}</span>
                </div>
              ))}
            </div>
          </div>

          {sortedFeatures.map((feature, i) => {
            const scores = featureScores[feature.id] || { tc: 3, rr: 3, cr: 1, sprints: 1 };
            const fVotes = allVotes[feature.id] || {};
            const voteCount = Object.keys(fVotes).length;

            return (
              <div key={feature.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.textPrimary, margin: '0 0 2px 0' }}>
                      {i + 1}. {feature.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: theme.textMuted }}>
                      {feature.jiraNumber && `${feature.jiraNumber} | `}{feature.developerTeam} | {voteCount} votes
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {/* RR */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Risk Reduction (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.rr}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [feature.id]: { ...prev[feature.id], rr: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.rr[scores.rr]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.rr}</span>
                    </div>
                  </div>
                  {/* CR */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Compliance/Regulatory (1-5)</label>
                    <input
                      type="range" min="1" max="5" value={scores.cr}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [feature.id]: { ...prev[feature.id], cr: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{definitions.cr[scores.cr]}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.cr}</span>
                    </div>
                  </div>
                  {/* Sprints */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>Number of Sprints (1-20)</label>
                    <input
                      type="range" min="1" max="20" value={scores.sprints}
                      onChange={e => setFeatureScores(prev => ({ ...prev, [feature.id]: { ...prev[feature.id], sprints: parseInt(e.target.value) } }))}
                      style={{ width: '100%', height: '6px', backgroundColor: theme.sliderBg, borderRadius: '4px', appearance: 'none', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa' }}>{scores.sprints}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button onClick={handleSaveScoresAndCalculate} style={{ ...buttonSuccess, fontSize: '16px', padding: '14px 32px' }}>
              <BarChart3 size={18} /> Calculate WSJF & Show Results
            </button>
          </div>
        </div>

        <style>{`input[type="range"]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; cursor: pointer; } input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: none; }`}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: RESULTS
  // ===========================

  if (sessionMeta?.status === 'results') {
    const teams = [...new Set(results.map(r => r.developerTeam))].sort();
    const allTabs = ['All', ...teams];
    const currentTeam = activeTeamTab || 'All';
    const teamResults = currentTeam === 'All'
      ? [...results].sort((a, b) => b.wsjf - a.wsjf)
      : results.filter(r => r.developerTeam === currentTeam).sort((a, b) => b.wsjf - a.wsjf);
    const resultsUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname.replace('/admin/', '/results/')}?s=${sessionId}` : '';

    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>{sessionMeta.title} — Results</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={toggleDarkMode} style={{ padding: '8px 12px', borderRadius: '24px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isDarkMode ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa' }}>{results.length}</div>
              <div style={{ fontSize: '13px', color: theme.textMuted }}>Features</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{Object.keys(voters).length}</div>
              <div style={{ fontSize: '13px', color: theme.textMuted }}>Voters</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{teams.length}</div>
              <div style={{ fontSize: '13px', color: theme.textMuted }}>Dev Teams</div>
            </div>
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} style={buttonPrimary}><FileText size={16} /> Export CSV</button>
            <button onClick={handleExportPDF} disabled={isExporting} style={{ ...buttonSuccess, opacity: isExporting ? 0.5 : 1 }}>
              <FileDown size={16} /> {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
            <button onClick={() => navigator.clipboard.writeText(resultsUrl)} style={{ ...buttonPrimary, backgroundColor: '#8b5cf6' }}>
              Copy Results Link
            </button>
            <button onClick={handleResetUserFeatures} style={buttonDanger}>
              Reset User Features
            </button>
          </div>

          {/* Team tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {allTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTeamTab(tab)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px 8px 0 0',
                  border: `1px solid ${theme.border}`,
                  borderBottom: currentTeam === tab ? `2px solid #3b82f6` : `1px solid ${theme.border}`,
                  backgroundColor: currentTeam === tab ? theme.cardBackground : theme.background,
                  color: currentTeam === tab ? '#60a5fa' : theme.textMuted,
                  fontWeight: currentTeam === tab ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {tab === 'All' ? `All (${results.length})` : tab}
              </button>
            ))}
          </div>

          {/* Results table */}
          <div style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: theme.background }}>
                  <tr>
                    {['#', 'Feature', 'Type', 'Jira', 'Votes', 'BV(Adj)', 'BV Sig', 'TC(Adj)', 'TC Sig', 'RR', 'CR', 'CoD', 'Sprints', 'WSJF'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Feature' ? 'left' : 'center', fontSize: '11px', fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamResults.map((r, i) => (
                    <tr key={r.featureId} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold',
                          backgroundColor: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : i === 2 ? '#f97316' : theme.sliderBg,
                          color: i < 3 ? 'white' : theme.textPrimary,
                        }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: '500', color: theme.textPrimary }}>{r.featureName}</div>
                        {r.problemSolved && <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>{r.problemSolved}</div>}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                          backgroundColor: (r.featureType || 'user') === 'architecture' ? '#7c3aed' : '#3b82f6',
                          color: 'white',
                        }}>
                          {(r.featureType || 'user') === 'architecture' ? 'ARCH' : 'USER'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.jiraNumber}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.voteCount}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.adjustedBV.toFixed(1)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#60a5fa', fontSize: '13px', fontWeight: '500' }}>{r.bvSignalStrength.toFixed(2)}x</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.adjustedTC.toFixed(1)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#60a5fa', fontSize: '13px', fontWeight: '500' }}>{r.tcSignalStrength.toFixed(2)}x</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.rr}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.cr}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.costOfDelay.toFixed(1)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.sprints}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{r.wsjf.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <style>{`input[type="range"]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; cursor: pointer; } input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: none; }`}</style>
      </div>
    );
  }

  // Fallback loading
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: theme.textPrimary }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #60a5fa', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p>Loading session...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AdminPage() {
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
      <AdminPageInner />
    </Suspense>
  );
}
