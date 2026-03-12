import type { FeatureResult, FeatureVote, VoterProfile, PersonaType, ServiceType } from './types';
import { PERSONA_LABELS, SERVICE_LABELS, PERSONA_WEIGHTS } from './constants';

// ===========================
// VOTER DEMOGRAPHICS HELPERS
// ===========================

function getServiceCounts(voters: Record<string, VoterProfile>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of Object.values(voters)) {
    const label = SERVICE_LABELS[v.service as ServiceType] || v.service;
    counts[label] = (counts[label] || 0) + 1;
  }
  return counts;
}

function getPersonaCounts(voters: Record<string, VoterProfile>): Record<string, { count: number; weight: number }> {
  const counts: Record<string, { count: number; weight: number }> = {};
  for (const v of Object.values(voters)) {
    const label = PERSONA_LABELS[v.persona as PersonaType] || v.persona;
    const weight = PERSONA_WEIGHTS[v.persona as PersonaType] || 1.0;
    if (!counts[label]) counts[label] = { count: 0, weight };
    counts[label].count += 1;
  }
  return counts;
}

// Per-feature voter breakdown: which personas and services voted on each feature
function getFeatureVoterBreakdown(
  featureId: string,
  allVotes: Record<string, Record<string, FeatureVote>>,
  voters: Record<string, VoterProfile>,
): { personas: string[]; services: string[]; voteCount: number } {
  const featureVotes = allVotes[featureId] || {};
  const voterIds = Object.keys(featureVotes);
  const personaSet = new Set<string>();
  const serviceSet = new Set<string>();

  for (const voterId of voterIds) {
    const voter = voters[voterId];
    if (voter) {
      personaSet.add(PERSONA_LABELS[voter.persona as PersonaType] || voter.persona);
      serviceSet.add(SERVICE_LABELS[voter.service as ServiceType] || voter.service);
    }
  }

  return {
    personas: [...personaSet].sort(),
    services: [...serviceSet].sort(),
    voteCount: voterIds.length,
  };
}

// ===========================
// CSV EXPORT
// ===========================

export function exportResultsCSV(
  results: FeatureResult[],
  sessionTitle: string,
  voters: Record<string, VoterProfile> = {},
  allVotes: Record<string, Record<string, FeatureVote>> = {},
) {
  const headers = [
    'Rank', 'Feature', 'Type', 'Jira #', 'Dev Team', 'Description',
    'Vote Count', 'Unique Services', 'Unique Personas',
    'Raw BV Avg', 'BV Signal', 'Adjusted BV',
    'Raw TC Avg', 'TC Signal', 'Adjusted TC',
    'RR', 'CR', 'Cost of Delay', 'Sprints', 'WSJF Score'
  ];

  const rows = results.map((r, i) => [
    i + 1,
    `"${r.featureName.replace(/"/g, '""')}"`,
    r.featureType === 'architecture' ? 'Architecture' : 'User-Facing',
    `"${r.jiraNumber.replace(/"/g, '""')}"`,
    `"${r.developerTeam.replace(/"/g, '""')}"`,
    `"${r.problemSolved.replace(/"/g, '""')}"`,
    r.voteCount,
    r.uniqueServices,
    r.uniquePersonas,
    r.rawBVAvg.toFixed(2),
    r.bvSignalStrength.toFixed(2),
    r.adjustedBV.toFixed(2),
    r.rawTCAvg.toFixed(2),
    r.tcSignalStrength.toFixed(2),
    r.adjustedTC.toFixed(2),
    r.rr,
    r.cr,
    r.costOfDelay.toFixed(2),
    r.sprints,
    r.wsjf.toFixed(2),
  ]);

  // Voting demographics section
  const voterCount = Object.keys(voters).length;
  const serviceCounts = getServiceCounts(voters);
  const personaCounts = getPersonaCounts(voters);

  const demographicsRows: string[] = [
    '',
    '',
    'Voting Session Demographics',
    '',
    `Total Voters,${voterCount}`,
    `Unique Services,${Object.keys(serviceCounts).length}`,
    `Unique Personas,${Object.keys(personaCounts).length}`,
    '',
    'Service,Count',
    ...Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([svc, count]) => `${svc},${count}`),
    '',
    'Persona,Count,Weight',
    ...Object.entries(personaCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([persona, { count, weight }]) => `${persona},${count},${weight}`),
  ];

  // Feature Voting Analytics section (admin only — when allVotes is provided)
  const hasAllVotes = Object.keys(allVotes).length > 0;
  const analyticsRows: string[] = [];

  if (hasAllVotes && voterCount > 0) {
    const analyticsSorted = [...results].sort((a, b) => {
      const bvDiff = b.adjustedBV - a.adjustedBV;
      if (Math.abs(bvDiff) > 0.01) return bvDiff;
      return b.voteCount - a.voteCount;
    });

    analyticsRows.push(
      '',
      '',
      'Feature Voting Analytics',
      '',
      'Rank,Feature,Dev Team,Adjusted BV,Votes,Personas,Services',
    );

    analyticsSorted.forEach((r, i) => {
      const breakdown = getFeatureVoterBreakdown(r.featureId, allVotes, voters);
      analyticsRows.push(
        [
          i + 1,
          `"${r.featureName.replace(/"/g, '""')}"`,
          `"${r.developerTeam.replace(/"/g, '""')}"`,
          r.adjustedBV.toFixed(2),
          breakdown.voteCount,
          `"${breakdown.personas.join(', ')}"`,
          `"${breakdown.services.join(', ')}"`,
        ].join(','),
      );
    });
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    ...(voterCount > 0 ? demographicsRows : []),
    ...analyticsRows,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_wsjf_results_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===========================
// PDF EXPORT
// ===========================

export async function exportResultsPDF(
  results: FeatureResult[],
  sessionTitle: string,
  voters: Record<string, VoterProfile> = {},
  allVotes: Record<string, Record<string, FeatureVote>> = {},
  voterCountOverride?: number,
) {
  const voterCount = voterCountOverride ?? Object.keys(voters).length;
  const hasVoterDetails = Object.keys(voters).length > 0;
  const hasAllVotes = Object.keys(allVotes).length > 0;
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 297, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PCTE Business Value Voting Results', 148, 16, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(sessionTitle, 148, 26, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()} | Voters: ${voterCount} | Features: ${results.length}`, 148, 34, { align: 'center' });

  doc.setTextColor(0, 0, 0);

  // ===========================
  // Group by developer team — each team on its own page
  // ===========================
  const teams = [...new Set(results.map(r => r.developerTeam))].sort();
  let isFirstTeam = true;

  for (const team of teams) {
    const teamResults = results
      .filter(r => r.developerTeam === team)
      .sort((a, b) => b.wsjf - a.wsjf);

    // First team starts on the title page; subsequent teams get new pages
    let startY: number;
    if (isFirstTeam) {
      startY = 48;
      isFirstTeam = false;
    } else {
      doc.addPage();
      startY = 20;
    }

    // Team header
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, startY, 269, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Developer Team: ${team} (${teamResults.length} features)`, 18, startY + 7);
    startY += 14;

    const tableData = teamResults.map((r, index) => [
      (index + 1).toString(),
      r.featureName,
      r.featureType === 'architecture' ? 'Arch' : 'User',
      r.jiraNumber,
      r.voteCount.toString(),
      r.adjustedBV.toFixed(1),
      r.bvSignalStrength.toFixed(2) + 'x',
      r.adjustedTC.toFixed(1),
      r.tcSignalStrength.toFixed(2) + 'x',
      r.rr.toString(),
      r.cr.toString(),
      r.costOfDelay.toFixed(1),
      r.sprints.toString(),
      r.wsjf.toFixed(2),
    ]);

    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable({
        head: [['#', 'Feature', 'Type', 'Jira', 'Votes', 'BV(Adj)', 'BV Sig', 'TC(Adj)', 'TC Sig', 'RR', 'CR', 'CoD', 'Sprints', 'WSJF']],
        body: tableData,
        startY,
        styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
          1: { cellWidth: 44 },
          2: { halign: 'center', cellWidth: 14 },
          3: { cellWidth: 20 },
          4: { halign: 'center', cellWidth: 14 },
          5: { halign: 'center', cellWidth: 16 },
          6: { halign: 'center', cellWidth: 16 },
          7: { halign: 'center', cellWidth: 16 },
          8: { halign: 'center', cellWidth: 16 },
          9: { halign: 'center', cellWidth: 10 },
          10: { halign: 'center', cellWidth: 10 },
          11: { halign: 'center', cellWidth: 16 },
          12: { halign: 'center', cellWidth: 16 },
          13: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [59, 130, 246] },
        },
        didParseCell: function(data: any) {
          if (data.row.index < 3 && data.section === 'body' && data.column.index === 0) {
            const colors = [[16, 185, 129], [245, 158, 11], [249, 115, 22]];
            data.cell.styles.fillColor = colors[data.row.index];
            data.cell.styles.textColor = [255, 255, 255];
          }
        },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // ===========================
  // Voting Session Demographics page (admin only)
  // ===========================
  if (hasVoterDetails) {
    doc.addPage();

    // Section header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Voting Session Demographics', 148, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Voters: ${voterCount} | Features Scored: ${results.length}`, 148, 24, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    const pdfServiceCounts = getServiceCounts(voters);
    const pdfPersonaCounts = getPersonaCounts(voters);
    const uniqueServices = Object.keys(pdfServiceCounts).length;
    const uniquePersonas = Object.keys(pdfPersonaCounts).length;

    let demoY = 40;

    // Service Representation table
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, demoY, 269, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Service Representation (${uniqueServices} unique)`, 18, demoY + 7);
    demoY += 14;

    const serviceData = Object.entries(pdfServiceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([svc, count]) => [svc, count.toString(), `${((count / voterCount) * 100).toFixed(0)}%`]);

    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable({
        head: [['Service / Sub-Unified Command', 'Voters', '% of Total']],
        body: serviceData,
        startY: demoY,
        styles: { fontSize: 9, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'center', cellWidth: 40 },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 200,
      });
      demoY = (doc as any).lastAutoTable.finalY + 16;
    }

    // Persona Representation table
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, demoY, 269, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Persona Representation (${uniquePersonas} unique)`, 18, demoY + 7);
    demoY += 14;

    const personaData = Object.entries(pdfPersonaCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([persona, { count, weight }]) => [
        persona,
        count.toString(),
        `${((count / voterCount) * 100).toFixed(0)}%`,
        `${weight}x`,
      ]);

    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable({
        head: [['Persona', 'Voters', '% of Total', 'Weight']],
        body: personaData,
        startY: demoY,
        styles: { fontSize: 9, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'center', cellWidth: 40 },
          3: { halign: 'center', cellWidth: 40, fontStyle: 'bold', textColor: [59, 130, 246] },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 240,
      });
    }
  }

  // ===========================
  // Feature Voting Analytics page (admin only — when allVotes is provided)
  // ===========================
  if (hasAllVotes && hasVoterDetails) {
    doc.addPage();

    // Section header
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Feature Voting Analytics', 148, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`All features sorted by Business Value & Vote Count | ${results.length} features`, 148, 24, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    // Sort by adjusted BV descending, then vote count descending
    const analyticsSorted = [...results].sort((a, b) => {
      const bvDiff = b.adjustedBV - a.adjustedBV;
      if (Math.abs(bvDiff) > 0.01) return bvDiff;
      return b.voteCount - a.voteCount;
    });

    const analyticsData = analyticsSorted.map((r, index) => {
      const breakdown = getFeatureVoterBreakdown(r.featureId, allVotes, voters);
      return [
        (index + 1).toString(),
        r.featureName,
        r.developerTeam,
        r.featureType === 'architecture' ? 'Arch' : 'User',
        r.adjustedBV.toFixed(1),
        breakdown.voteCount.toString(),
        breakdown.personas.join(', ') || 'Admin Only',
        breakdown.services.join(', ') || 'N/A',
      ];
    });

    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable({
        head: [['#', 'Feature', 'Dev Team', 'Type', 'BV(Adj)', 'Votes', 'Voter Personas', 'Voter Services']],
        body: analyticsData,
        startY: 38,
        styles: { fontSize: 7.5, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.5, overflow: 'linebreak' },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
          1: { cellWidth: 40 },
          2: { cellWidth: 28 },
          3: { halign: 'center', cellWidth: 14 },
          4: { halign: 'center', cellWidth: 16, fontStyle: 'bold', textColor: [59, 130, 246] },
          5: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
          6: { cellWidth: 68 },
          7: { cellWidth: 78 },
        },
        didParseCell: function(data: any) {
          // Highlight top 3 rows by BV
          if (data.row.index < 3 && data.section === 'body' && data.column.index === 0) {
            const colors = [[16, 185, 129], [245, 158, 11], [249, 115, 22]];
            data.cell.styles.fillColor = colors[data.row.index];
            data.cell.styles.textColor = [255, 255, 255];
          }
        },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // Footer on last page
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'WSJF = Cost of Delay / Sprints | BV & TC use Signal Strength (Volume x Svc Spread x Persona Spread x Consensus, cap 2.0) | Higher WSJF = Higher Priority',
    148,
    doc.internal.pageSize.height - 10,
    { align: 'center' },
  );

  doc.save(`${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_wsjf_results_${new Date().toISOString().split('T')[0]}.pdf`);
}
