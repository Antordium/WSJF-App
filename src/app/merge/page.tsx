'use client';

import React, { useState, useEffect } from 'react';
import { getSession } from '../../lib/firebase';
import { calculateFeatureWSJF } from '../../lib/algorithm';
import type { Feature, VoterProfile, FeatureVote, FeatureResult, Weights } from '../../lib/types';

const ARCH_SESSION = '-OnX0HOeU6CGaCQEWvgZ';
const USER_SESSION = '-OnXSdaBtcKIUUZK02a7';

export default function MergeReportPage() {
  const [results, setResults] = useState<FeatureResult[]>([]);
  const [status, setStatus] = useState('Loading sessions...');
  const [loading, setLoading] = useState(true);
  const [voterCount, setVoterCount] = useState(0);
  const [teams, setTeams] = useState<string[]>([]);

  useEffect(() => {
    loadAndCalculate();
  }, []);

  const loadAndCalculate = async () => {
    try {
      const archSession = await getSession(ARCH_SESSION);
      const userSession = await getSession(USER_SESSION);

      if (!archSession || !userSession) {
        setStatus('Error: One or both sessions not found.');
        setLoading(false);
        return;
      }

      const archFeatures: Record<string, Feature> = archSession.features || {};
      const userFeatures: Record<string, Feature> = userSession.features || {};
      const voters: Record<string, VoterProfile> = userSession.voters || {};
      const userVotes: Record<string, Record<string, FeatureVote>> = userSession.votes || {};
      const weights: Weights = { bv: 1, tc: 1, rr: 1, cr: 1 };

      const archOnly = Object.values(archFeatures)
        .filter(f => (f.featureType || 'user') === 'architecture');
      const userOnly = Object.values(userFeatures)
        .filter(f => (f.featureType || 'user') === 'user');

      const allFeatures = [...archOnly, ...userOnly];

      const resultsList: FeatureResult[] = [];
      for (const feature of allFeatures) {
        const fVotes = userVotes[feature.id] || {};
        const result = calculateFeatureWSJF(feature, fVotes, voters, weights);
        resultsList.push(result);
      }

      resultsList.sort((a, b) => b.wsjf - a.wsjf);
      const uniqueTeams = [...new Set(resultsList.map(r => r.developerTeam))].sort();

      setResults(resultsList);
      setVoterCount(Object.keys(voters).length);
      setTeams(uniqueTeams);
      setStatus(`Loaded ${archOnly.length} architecture + ${userOnly.length} user features. ${Object.keys(voters).length} voters.`);
      setLoading(false);
    } catch (e) {
      console.error('Failed to load:', e);
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const exportCSV = (team?: string) => {
    const data = team ? results.filter(r => r.developerTeam === team) : results;
    const sorted = [...data].sort((a, b) => b.wsjf - a.wsjf);
    const headers = ['Rank', 'Feature', 'Type', 'Jira', 'Dev Team', 'Description', 'Votes', 'BV(Adj)', 'BV Sig', 'TC(Adj)', 'TC Sig', 'RR', 'CR', 'CoD', 'Sprints', 'WSJF'];
    const rows = sorted.map((r, i) => [
      i + 1,
      `"${r.featureName}"`,
      r.featureType,
      r.jiraNumber,
      `"${r.developerTeam}"`,
      `"${r.problemSolved || ''}"`,
      r.voteCount,
      r.adjustedBV.toFixed(2),
      r.bvSignalStrength.toFixed(2),
      r.adjustedTC.toFixed(2),
      r.tcSignalStrength.toFixed(2),
      r.rr,
      r.cr,
      r.costOfDelay.toFixed(2),
      r.sprints,
      r.wsjf.toFixed(2),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WSJF-Report-${team || 'All-Teams'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllVendorCSVs = () => {
    exportCSV(); // All teams
    teams.forEach(team => exportCSV(team)); // Individual vendor CSVs
  };

  const cellStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid #1e293b', fontSize: '13px', whiteSpace: 'nowrap' };
  const headerCell: React.CSSProperties = { ...cellStyle, fontWeight: '600', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #334155' };

  const renderTable = (data: FeatureResult[], showTeam: boolean) => (
    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #1e293b' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerCell}>#</th>
            <th style={{ ...headerCell, textAlign: 'left' }}>Feature</th>
            <th style={headerCell}>Type</th>
            <th style={headerCell}>Jira</th>
            {showTeam && <th style={headerCell}>Team</th>}
            <th style={headerCell}>Votes</th>
            <th style={headerCell}>BV(Adj)</th>
            <th style={headerCell}>TC(Adj)</th>
            <th style={headerCell}>RR</th>
            <th style={headerCell}>CR</th>
            <th style={headerCell}>CoD</th>
            <th style={headerCell}>Sprints</th>
            <th style={{ ...headerCell, color: '#60a5fa' }}>WSJF</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.featureId} style={{ backgroundColor: i % 2 === 0 ? '#0f172a' : '#131c2e' }}>
              <td style={{ ...cellStyle, textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{i + 1}</td>
              <td style={{ ...cellStyle, fontWeight: '500', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.featureName}
                {r.problemSolved && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', whiteSpace: 'normal' }}>{r.problemSolved}</div>
                )}
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                  backgroundColor: r.featureType === 'architecture' ? '#7c3aed' : '#3b82f6', color: 'white',
                }}>
                  {r.featureType === 'architecture' ? 'ARCH' : 'USER'}
                </span>
              </td>
              <td style={{ ...cellStyle, color: '#60a5fa', textAlign: 'center' }}>{r.jiraNumber}</td>
              {showTeam && <td style={{ ...cellStyle, textAlign: 'center', color: '#94a3b8' }}>{r.developerTeam}</td>}
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.voteCount}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.adjustedBV.toFixed(2)}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.adjustedTC.toFixed(2)}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.rr}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.cr}</td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: '500', color: '#f59e0b' }}>{r.costOfDelay.toFixed(2)}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.sprints}</td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: '700', fontSize: '15px', color: '#60a5fa' }}>{r.wsjf.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'ui-sans-serif, system-ui, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '4px' }}>
              PI 25.2 WSJF Priority Report
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              Architecture + User Features Combined | Generated {new Date().toLocaleDateString()}
            </p>
          </div>
          {!loading && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => exportCSV()} style={{
                padding: '8px 16px', backgroundColor: '#10b981', color: 'white', fontWeight: '600',
                borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
              }}>
                Export All CSV
              </button>
              <button onClick={exportAllVendorCSVs} style={{
                padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', fontWeight: '600',
                borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
              }}>
                Export Per-Vendor CSVs
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>{status}</div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <div style={{ padding: '14px 20px', backgroundColor: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{results.length}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Features</div>
              </div>
              <div style={{ padding: '14px 20px', backgroundColor: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{voterCount}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Voters</div>
              </div>
              <div style={{ padding: '14px 20px', backgroundColor: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{teams.length}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vendors</div>
              </div>
              <div style={{ padding: '14px 20px', backgroundColor: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a78bfa' }}>
                  {results.filter(r => r.featureType === 'architecture').length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Architecture</div>
              </div>
              <div style={{ padding: '14px 20px', backgroundColor: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8' }}>
                  {results.filter(r => r.featureType === 'user').length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>User-Facing</div>
              </div>
            </div>

            {/* Per-Vendor Sections */}
            {teams.map(team => {
              const teamResults = results.filter(r => r.developerTeam === team).sort((a, b) => b.wsjf - a.wsjf);
              const archCount = teamResults.filter(r => r.featureType === 'architecture').length;
              const userCount = teamResults.filter(r => r.featureType === 'user').length;

              return (
                <div key={team} style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#e2e8f0', margin: '0 0 4px 0' }}>{team}</h2>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        {teamResults.length} features ({archCount} arch, {userCount} user)
                      </p>
                    </div>
                    <button onClick={() => exportCSV(team)} style={{
                      padding: '6px 14px', backgroundColor: '#1e293b', color: '#94a3b8', fontWeight: '500',
                      borderRadius: '6px', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px',
                    }}>
                      Export {team} CSV
                    </button>
                  </div>
                  {renderTable(teamResults, false)}
                </div>
              );
            })}

            {/* Combined Ranking */}
            <div style={{ marginTop: '48px', borderTop: '2px solid #334155', paddingTop: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa', marginBottom: '12px' }}>
                Combined WSJF Ranking (All Vendors)
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                All {results.length} features ranked by WSJF score across all vendors
              </p>
              {renderTable(results, true)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
