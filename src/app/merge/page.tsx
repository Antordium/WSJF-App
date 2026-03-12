'use client';

import React, { useState } from 'react';
import { getSession, mergeSessions, saveResults } from '../../lib/firebase';
import { calculateFeatureWSJF } from '../../lib/algorithm';
import type { Feature, VoterProfile, FeatureVote, FeatureResult, Weights } from '../../lib/types';

export default function MergePage() {
  const [archSessionId, setArchSessionId] = useState('-OnX0HOeU6CGaCQEWvgZ');
  const [userSessionId, setUserSessionId] = useState('-OnXSdaBtcKIUUZK02a7');
  const [title, setTitle] = useState('PI 25.2 Merged - Architecture + User Features');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('');
  const [newSessionUrl, setNewSessionUrl] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const extractId = (input: string) => {
    const match = input.match(/[?&]s=([^&]+)/);
    return match ? match[1] : input.trim();
  };

  const handleMerge = async () => {
    if (!pin.trim() || pin.length < 4) {
      alert('Please enter a 4+ digit admin PIN.');
      return;
    }

    setIsMerging(true);
    setStatus('Creating merged session...');

    try {
      const archId = extractId(archSessionId);
      const userId = extractId(userSessionId);

      const newId = await mergeSessions(archId, userId, title.trim(), pin.trim());
      setStatus('Merged session created. Calculating WSJF...');

      // Load the merged session and calculate WSJF
      const merged = await getSession(newId);
      if (!merged) throw new Error('Failed to read merged session');

      const mergedFeatures: Record<string, Feature> = merged.features || {};
      const mergedVoters: Record<string, VoterProfile> = merged.voters || {};
      const mergedVotes: Record<string, Record<string, FeatureVote>> = merged.votes || {};
      const weights: Weights = { bv: 1, tc: 1, rr: 1, cr: 1 };

      const sorted = Object.values(mergedFeatures).sort((a: Feature, b: Feature) => {
        const typeOrder = (f: Feature) => (f.featureType || 'user') === 'architecture' ? 0 : 1;
        const typeDiff = typeOrder(a) - typeOrder(b);
        if (typeDiff !== 0) return typeDiff;
        return a.order - b.order;
      });

      const resultsMap: Record<string, FeatureResult> = {};
      for (const feature of sorted) {
        const fVotes = mergedVotes[feature.id] || {};
        const result = calculateFeatureWSJF(feature, fVotes, mergedVoters, weights);
        resultsMap[feature.id] = result;
      }

      await saveResults(newId, resultsMap);

      const basePath = window.location.pathname.includes('/WSJF-App') ? '/WSJF-App' : '';
      const adminUrl = `${window.location.origin}${basePath}/admin/?s=${newId}`;
      setNewSessionUrl(adminUrl);
      setStatus(`Merge complete! ${sorted.length} features (${sorted.filter(f => (f.featureType || 'user') === 'architecture').length} arch + ${sorted.filter(f => (f.featureType || 'user') === 'user').length} user). WSJF calculated.`);
    } catch (e) {
      console.error('Merge failed:', e);
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'ui-sans-serif, system-ui, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px' }}>Merge Sessions</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>
          Combine architecture features from one session with user features from another, then calculate WSJF across all.
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Architecture Session ID</label>
            <input value={archSessionId} onChange={e => setArchSessionId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>User Features Session ID</label>
            <input value={userSessionId} onChange={e => setUserSessionId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Merged Session Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Admin PIN (for new session)</label>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="4+ digits"
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', boxSizing: 'border-box', maxWidth: '200px' }} />
          </div>

          <button onClick={handleMerge} disabled={isMerging}
            style={{ padding: '12px 24px', backgroundColor: isMerging ? '#374151' : '#10b981', color: 'white', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: isMerging ? 'not-allowed' : 'pointer', fontSize: '16px', marginTop: '8px' }}>
            {isMerging ? 'Merging...' : 'Merge & Calculate WSJF'}
          </button>
        </div>

        {status && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
            <p style={{ color: status.startsWith('Error') ? '#f87171' : '#10b981', fontSize: '14px', margin: 0 }}>{status}</p>
          </div>
        )}

        {newSessionUrl && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #10b981' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>New merged session:</p>
            <a href={newSessionUrl} style={{ color: '#60a5fa', fontSize: '14px', wordBreak: 'break-all' }}>{newSessionUrl}</a>
          </div>
        )}
      </div>
    </div>
  );
}
