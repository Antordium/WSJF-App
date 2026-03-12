'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sun, Moon, FileDown, FileText, BarChart3, Users } from 'lucide-react';
import { getTheme } from '../../lib/theme';
import { exportResultsCSV, exportResultsPDF } from '../../lib/export-utils';
import type { SessionMeta, Feature, VoterProfile, FeatureVote, FeatureResult } from '../../lib/types';
import {
  listenToSessionMeta,
  listenToFeatures,
  listenToVoters,
  listenToResults,
} from '../../lib/firebase';

// ===========================
// RESULTS PAGE (wrapped in Suspense)
// ===========================

function ResultsPageInner() {
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

  // State
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [voters, setVoters] = useState<Record<string, VoterProfile>>({});
  const [rawResults, setRawResults] = useState<Record<string, FeatureResult> | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<string>('');

  // Real-time listeners
  useEffect(() => {
    if (!sessionId) return;
    const unsubs = [
      listenToSessionMeta(sessionId, setSessionMeta),
      listenToVoters(sessionId, (v) => setVoters(v || {})),
      listenToResults(sessionId, setRawResults),
    ];
    return () => unsubs.forEach(u => u());
  }, [sessionId]);

  // Sorted results
  const results = useMemo(() => {
    if (!rawResults) return [];
    return Object.values(rawResults).sort((a, b) => b.wsjf - a.wsjf);
  }, [rawResults]);

  const teams = useMemo(() => {
    return [...new Set(results.map(r => r.developerTeam))].sort();
  }, [results]);

  const allTabs = ['All', ...teams];
  const currentTeam = activeTeamTab || 'All';
  const teamResults = currentTeam === 'All'
    ? [...results].sort((a, b) => b.wsjf - a.wsjf)
    : results.filter(r => r.developerTeam === currentTeam).sort((a, b) => b.wsjf - a.wsjf);

  // Exports
  const handleExportCSV = () => {
    if (results.length === 0) return;
    exportResultsCSV(results, sessionMeta?.title || 'WSJF Results');
  };

  const handleExportPDF = async () => {
    if (results.length === 0) return;
    setIsExporting(true);
    try {
      await exportResultsPDF(results, sessionMeta?.title || 'WSJF Results', {}, Object.keys(voters).length);
    } finally {
      setIsExporting(false);
    }
  };

  // ===========================
  // RENDER: NO SESSION
  // ===========================

  if (!sessionId) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: theme.textPrimary, padding: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '16px' }}>No Session Found</h1>
          <p style={{ color: theme.textSecondary }}>Please use a valid results link.</p>
        </div>
      </div>
    );
  }

  // ===========================
  // RENDER: LOADING / NOT READY
  // ===========================

  if (!sessionMeta || !rawResults) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: theme.textPrimary }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #60a5fa', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px' }}>Loading results...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ===========================
  // RENDER: RESULTS
  // ===========================

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.border}`,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.textPrimary, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#60a5fa', margin: '0 0 4px 0' }}>
              {sessionMeta.title}
            </h1>
            <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0 }}>WSJF Prioritization Results</p>
          </div>
          <button onClick={toggleDarkMode} style={{ padding: '8px 12px', borderRadius: '24px', backgroundColor: theme.toggleBg, color: theme.toggleText, border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isDarkMode ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
          </button>
        </div>

        {/* Summary */}
        <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa' }}>{results.length}</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>Features Scored</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{Object.keys(voters).length}</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>Voters</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{teams.length}</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>Dev Teams</div>
          </div>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} style={{
            padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', fontWeight: '600',
            borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}>
            <FileText size={16} /> Export CSV
          </button>
          <button onClick={handleExportPDF} disabled={isExporting} style={{
            padding: '10px 20px', backgroundColor: '#10b981', color: 'white', fontWeight: '600',
            borderRadius: '8px', border: 'none', cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '14px',
            display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: isExporting ? 0.5 : 1,
          }}>
            <FileDown size={16} /> {isExporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>

        {/* Team tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {allTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTeamTab(tab)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px 8px 0 0',
                border: `1px solid ${theme.border}`,
                borderBottom: currentTeam === tab ? '2px solid #3b82f6' : `1px solid ${theme.border}`,
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
                    <th key={h} style={{
                      padding: '12px', textAlign: h === 'Feature' ? 'left' : 'center',
                      fontSize: '11px', fontWeight: '600', color: theme.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamResults.map((r, i) => (
                  <tr key={r.featureId} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '30px', height: '30px', borderRadius: '50%', fontSize: '13px', fontWeight: 'bold',
                        backgroundColor: i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : i === 2 ? '#f97316' : theme.sliderBg,
                        color: i < 3 ? 'white' : theme.textPrimary,
                      }}>{i + 1}</span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: '500', color: theme.textPrimary }}>{r.featureName}</div>
                      {r.problemSolved && <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>{r.problemSolved}</div>}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                        backgroundColor: r.featureType === 'architecture' ? '#7c3aed' : '#3b82f6',
                        color: 'white',
                      }}>
                        {r.featureType === 'architecture' ? 'ARCH' : 'USER'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.jiraNumber}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.voteCount}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.adjustedBV.toFixed(1)}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: '#60a5fa', fontSize: '13px', fontWeight: '500' }}>{r.bvSignalStrength.toFixed(2)}x</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.adjustedTC.toFixed(1)}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: '#f59e0b', fontSize: '13px', fontWeight: '500' }}>{r.tcSignalStrength.toFixed(2)}x</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.rr}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.cr}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.costOfDelay.toFixed(1)}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', color: theme.textSecondary, fontSize: '13px' }}>{r.sprints}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>{r.wsjf.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: theme.textMuted }}>
          WSJF = Cost of Delay / Sprints | BV & TC use Signal Strength algorithm | Higher WSJF = Higher Priority
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#f9fafb' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #60a5fa', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p>Loading results...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResultsPageInner />
    </Suspense>
  );
}
