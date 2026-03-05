import type { FeatureResult } from './types';

// ===========================
// CSV EXPORT
// ===========================

export function exportResultsCSV(results: FeatureResult[], sessionTitle: string) {
  const headers = [
    'Rank', 'Feature', 'Jira #', 'Dev Team', 'Problem Solved',
    'Vote Count', 'Unique Services', 'Unique Personas',
    'Raw UV Avg', 'UV Signal', 'Adjusted UV',
    'Raw TC Avg', 'TC Signal', 'Adjusted TC',
    'RR', 'CR', 'Cost of Delay', 'Sprints', 'WSJF Score'
  ];

  const rows = results.map((r, i) => [
    i + 1,
    `"${r.featureName.replace(/"/g, '""')}"`,
    `"${r.jiraNumber.replace(/"/g, '""')}"`,
    `"${r.developerTeam.replace(/"/g, '""')}"`,
    `"${r.problemSolved.replace(/"/g, '""')}"`,
    r.voteCount,
    r.uniqueServices,
    r.uniquePersonas,
    r.rawUVAvg.toFixed(2),
    r.uvSignalStrength.toFixed(2),
    r.adjustedUV.toFixed(2),
    r.rawTCAvg.toFixed(2),
    r.tcSignalStrength.toFixed(2),
    r.adjustedTC.toFixed(2),
    r.rr,
    r.cr,
    r.costOfDelay.toFixed(2),
    r.sprints,
    r.wsjf.toFixed(2),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
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
  voterCount: number,
) {
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

  // Group by developer team
  const teams = [...new Set(results.map(r => r.developerTeam))].sort();
  let startY = 48;

  for (const team of teams) {
    const teamResults = results
      .filter(r => r.developerTeam === team)
      .sort((a, b) => b.wsjf - a.wsjf);

    // Check if we need a new page
    if (startY > 170) {
      doc.addPage();
      startY = 20;
    }

    // Team header
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, startY, 269, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Developer Team: ${team}`, 18, startY + 7);
    startY += 14;

    const tableData = teamResults.map((r, index) => [
      (index + 1).toString(),
      r.featureName,
      r.jiraNumber,
      r.voteCount.toString(),
      r.adjustedUV.toFixed(1),
      r.uvSignalStrength.toFixed(2) + 'x',
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
        head: [['#', 'Feature', 'Jira', 'Votes', 'UV(Adj)', 'UV Sig', 'TC(Adj)', 'TC Sig', 'RR', 'CR', 'CoD', 'Sprints', 'WSJF']],
        body: tableData,
        startY,
        styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 22 },
          3: { halign: 'center', cellWidth: 14 },
          4: { halign: 'center', cellWidth: 16 },
          5: { halign: 'center', cellWidth: 16 },
          6: { halign: 'center', cellWidth: 16 },
          7: { halign: 'center', cellWidth: 16 },
          8: { halign: 'center', cellWidth: 10 },
          9: { halign: 'center', cellWidth: 10 },
          10: { halign: 'center', cellWidth: 16 },
          11: { halign: 'center', cellWidth: 16 },
          12: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [59, 130, 246] },
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

      startY = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'WSJF = Cost of Delay / Sprints | UV & TC use Signal Strength (Volume x Svc Spread x Persona Spread x Consensus, cap 2.0) | Higher WSJF = Higher Priority',
    148,
    doc.internal.pageSize.height - 10,
    { align: 'center' },
  );

  doc.save(`${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_wsjf_results_${new Date().toISOString().split('T')[0]}.pdf`);
}
