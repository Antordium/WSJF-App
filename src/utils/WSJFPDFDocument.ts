import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts for better PDF rendering
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyuMZhrib2Bg-4.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.woff2',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  weightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weightItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  weightLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  weightValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1f2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 30,
  },
  tableRowOdd: {
    backgroundColor: '#f9fafb',
  },
  rankCell: {
    width: '8%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCell: {
    width: '40%',
    paddingRight: 8,
  },
  codCell: {
    width: '13%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobSizeCell: {
    width: '13%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wsjfCell: {
    width: '13%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoresCell: {
    width: '13%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 9,
    color: '#1f2937',
  },
  cellTextBold: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1f2937',
  },
  nameText: {
    fontSize: 9,
    color: '#1f2937',
    lineHeight: 1.3,
  },
  scoresText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.2,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeGold: {
    backgroundColor: '#10b981',
  },
  rankBadgeSilver: {
    backgroundColor: '#f59e0b',
  },
  rankBadgeBronze: {
    backgroundColor: '#f97316',
  },
  rankBadgeDefault: {
    backgroundColor: '#6b7280',
  },
  rankText: {
    fontSize: 8,
    fontWeight: 600,
    color: '#ffffff',
  },
  summarySection: {
    marginTop: 20,
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  chart: {
    marginTop: 15,
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  chartBar: {
    width: 30,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  chartLabel: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    width: 30,
  },
});

export interface RankedInitiative {
  id: string;
  createdAt: string;
  name: string;
  uv: number;
  tc: number;
  rr: number;
  cr: number;
  jobSize: number;
  costOfDelay: number;
  wsjf: number;
}

export interface WeightSettings {
  uv: number;
  tc: number;
  rr: number;
  cr: number;
}

interface WSJFPDFDocumentProps {
  initiatives: RankedInitiative[];
  weights: WeightSettings;
  timestamp: string;
}

const WSJFPDFDocument: React.FC<WSJFPDFDocumentProps> = ({
  initiatives,
  weights,
  timestamp,
}) => {
  const getRankBadgeStyle = (index: number) => {
    if (index === 0) return styles.rankBadgeGold;
    if (index === 1) return styles.rankBadgeSilver;
    if (index === 2) return styles.rankBadgeBronze;
    return styles.rankBadgeDefault;
  };

  const maxWsjf = Math.max(...initiatives.map(i => i.wsjf));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>WSJF Prioritization Report</Text>
          <Text style={styles.subtitle}>
            Weighted Shortest Job First Analysis
          </Text>
          <Text style={styles.timestamp}>Generated: {timestamp}</Text>
        </View>

        {/* Weight Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost of Delay Weights</Text>
          <View style={styles.weightsContainer}>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>User Value</Text>
              <Text style={styles.weightValue}>{weights.uv}</Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Time Criticality</Text>
              <Text style={styles.weightValue}>{weights.tc}</Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Risk Reduction</Text>
              <Text style={styles.weightValue}>{weights.rr}</Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Compliance</Text>
              <Text style={styles.weightValue}>{weights.cr}</Text>
            </View>
          </View>
        </View>

        {/* Prioritized Initiatives Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Prioritized Initiatives ({initiatives.length} total)
          </Text>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.rankCell}>
                <Text style={styles.headerText}>Rank</Text>
              </View>
              <View style={styles.nameCell}>
                <Text style={styles.headerText}>Initiative</Text>
              </View>
              <View style={styles.scoresCell}>
                <Text style={styles.headerText}>Scores</Text>
              </View>
              <View style={styles.codCell}>
                <Text style={styles.headerText}>CoD</Text>
              </View>
              <View style={styles.jobSizeCell}>
                <Text style={styles.headerText}>Size</Text>
              </View>
              <View style={styles.wsjfCell}>
                <Text style={styles.headerText}>WSJF</Text>
              </View>
            </View>

            {/* Table Rows */}
            {initiatives.map((initiative, index) => (
              <View
                key={initiative.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowOdd : {},
                ]}
              >
                <View style={styles.rankCell}>
                  <View style={[styles.rankBadge, getRankBadgeStyle(index)]}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                </View>
                <View style={styles.nameCell}>
                  <Text style={styles.nameText}>{initiative.name}</Text>
                </View>
                <View style={styles.scoresCell}>
                  <Text style={styles.scoresText}>
                    UV:{initiative.uv} TC:{initiative.tc}
                  </Text>
                  <Text style={styles.scoresText}>
                    RR:{initiative.rr} CR:{initiative.cr}
                  </Text>
                </View>
                <View style={styles.codCell}>
                  <Text style={styles.cellText}>
                    {initiative.costOfDelay.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.jobSizeCell}>
                  <Text style={styles.cellText}>{initiative.jobSize}</Text>
                </View>
                <View style={styles.wsjfCell}>
                  <Text style={styles.cellTextBold}>
                    {initiative.wsjf.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* WSJF Visualization Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WSJF Score Visualization</Text>
          <View style={styles.chart}>
            {initiatives.slice(0, 10).map((initiative, index) => {
              const barHeight = (initiative.wsjf / maxWsjf) * 100;
              return (
                <View key={initiative.id}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: barHeight },
                    ]}
                  />
                  <Text style={styles.chartLabel}>
                    #{index + 1}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>
            This report shows {initiatives.length} initiatives prioritized using the WSJF (Weighted Shortest Job First) methodology. 
            {initiatives.length > 0 && (
              <>The highest priority initiative is "{initiatives[0]?.name}" with a WSJF score of {initiatives[0]?.wsjf.toFixed(2)}. </>
            )}
            Cost of Delay weights were set to: User Value ({weights.uv}), Time Criticality ({weights.tc}), 
            Risk Reduction ({weights.rr}), and Compliance ({weights.cr}).
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default WSJFPDFDocument;
