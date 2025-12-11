/**
 * WSJF Calculator - v4.0
 *
 * Weighted Shortest Job First (WSJF) prioritization tool for SAFe/Agile teams.
 * Helps teams prioritize work based on Cost of Delay divided by effort (sprints).
 *
 * Formula: WSJF = Cost of Delay / Number of Sprints
 * Where Cost of Delay = (UV × weight) + (TC × weight) + (RR × weight) + (CR × weight)
 *
 * Changes in v4:
 * - Changed all factor sliders from Fibonacci (1,3,6,8,10) to simple 1-5 scale
 * - Changed Job Size to Number of Sprints (1-6 range) with no descriptions
 * - Fixed slider box sizing to prevent layout shifts
 * - Enhanced PDF export with better styling and visual design
 * - Added CSV export functionality
 * - Improved code documentation
 */

'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, Trash2, Database, Sun, Moon, FileDown, FileText } from 'lucide-react';

// ===========================
// CONSTANTS & SCORING SCALES
// ===========================

/**
 * Scoring scale for WSJF factors (User Value, Time Criticality, Risk Reduction, Compliance)
 * Changed from Fibonacci to simple 1-5 scale in v4
 */
const SIMPLE_SCORES = [1, 2, 3, 4, 5];

/**
 * Scoring scale for Number of Sprints (effort estimation)
 * Range: 1-6 sprints
 */
const SPRINT_SCORES = [1, 2, 3, 4, 5, 6];

// ===========================
// SCORING DEFINITIONS
// ===========================

/**
 * Human-readable descriptions for each score level across all WSJF factors
 * These help users understand what each numeric value represents
 */
const definitions = {
  uv: {
    1: 'Minimal user benefit; purely technical or internal.',
    2: 'Minor user convenience or slight improvement to workflow.',
    3: 'Moderate improvement to user efficiency or eliminates some manual work.',
    4: 'Significant user value or substantially improves a critical workflow.',
    5: 'Major user value: eliminates substantial manual effort, significantly enhances core functionality, or enables critical business capability.',
  },
  tc: {
    1: 'No time pressure; can be delivered anytime.',
    2: 'Minor preference for earlier delivery, no significant consequences.',
    3: 'Moderate time pressure: delayed delivery impacts some planned activities.',
    4: 'High time criticality: delayed delivery affects critical business events or releases.',
    5: 'Severe time criticality: missing the deadline has major business impact or blocks critical dependencies.',
  },
  rr: {
    1: 'No known risk mitigation or opportunity enablement.',
    2: 'Reduces minor operational inefficiencies or provides slight improvement in future capability.',
    3: 'Moderate risk reduction or enables valuable future opportunities.',
    4: 'Significantly reduces operational or technical risk, or enables high-value future opportunities.',
    5: 'Prevents high-impact development failure or delay, fundamentally improves user adoption, or enables a new, high-value operational paradigm.',
  },
  cr: {
    1: 'No current compliance or regulatory requirement.',
    2: 'Good to have for future compliance, but no immediate mandate.',
    3: 'Addresses an emerging compliance need or prepares for a likely SLA.',
    4: 'Required for an upcoming audit or to meet a critical, anticipated SLA.',
    5: 'Mandated by law, regulation, or existing critical SLA; non-compliance has severe consequences.',
  },
};

// ===========================
// THEME CONFIGURATION
// ===========================

/**
 * Returns theme colors based on dark/light mode preference
 * @param isDark - Whether dark mode is enabled
 * @returns Object containing all theme color values
 */
const getTheme = (isDark: boolean) => ({
  background: isDark ? '#111827' : '#f3f4f6',
  cardBackground: isDark ? '#1f2937' : '#ffffff',
  textPrimary: isDark ? '#f9fafb' : '#111827',
  textSecondary: isDark ? '#d1d5db' : '#4b5563',
  textMuted: isDark ? '#9ca3af' : '#6b7280',
  border: isDark ? '#374151' : '#e5e7eb',
  borderAccent: isDark ? '#4b5563' : '#d1d5db',
  toggleBg: isDark ? '#374151' : '#e5e7eb',
  toggleText: isDark ? '#e5e7eb' : '#1f2937',
  sliderBg: isDark ? '#4b5563' : '#d1d5db',
  sliderThumb: '#3b82f6',
  buttonPrimary: '#3b82f6',
  buttonSuccess: '#10b981',
  hoverOverlay: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
});

// ===========================
// UI COMPONENTS
// ===========================

/**
 * Dark Mode Toggle Button Component
 * Allows users to switch between light and dark themes
 */
const DarkModeToggle = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => {
  const theme = getTheme(isDark);
  
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '24px',
        backgroundColor: theme.toggleBg,
        color: theme.toggleText,
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 150ms ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <>
          <Sun style={{ width: '20px', height: '20px' }} />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon style={{ width: '20px', height: '20px' }} />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};

/**
 * Tooltip Component
 * Displays helpful information when hovering over the help icon
 * @param text - The tooltip text to display
 * @param children - The element that triggers the tooltip (usually HelpCircle icon)
 */
type TooltipProps = { text: string; children: React.ReactNode; theme: any };
const Tooltip = ({ text, children, theme }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            width: '288px',
            padding: '12px',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#1f2937',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            lineHeight: '1.4'
          }}
        >
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1f2937'
          }} />
        </div>
      )}
    </div>
  );
};

/**
 * Scoring Slider Component
 * Interactive slider for setting WSJF factor scores and sprint estimates
 *
 * Features:
 * - Maps discrete score values to slider positions
 * - Displays current value with color highlight
 * - Shows contextual descriptions for each score
 * - Fixed height container prevents layout shifts
 *
 * @param name - Field name (uv, tc, rr, cr, jobSize)
 * @param value - Current numeric value
 * @param handler - Callback function when value changes
 * @param tooltipText - Help text for the tooltip
 * @param label - Display label for the slider
 * @param definitions - Score descriptions for each value
 * @param theme - Theme object for styling
 * @param isJobSize - Whether this is the sprint estimation slider (uses SPRINT_SCORES vs SIMPLE_SCORES)
 */
interface ScoringSliderProps {
  name: string;
  value: number;
  handler: (e: { target: { name: string; value: number } }) => void;
  tooltipText: string;
  label: string;
  definitions: Record<number, string>;
  theme: any;
  isJobSize?: boolean;
}

const ScoringSlider = ({
  name,
  value,
  handler,
  tooltipText,
  label,
  definitions,
  theme,
  isJobSize = false
}: ScoringSliderProps): React.JSX.Element => {
  // Select appropriate scoring scale based on slider type
  const allowedScores = isJobSize ? SPRINT_SCORES : SIMPLE_SCORES;

  // Find current value's index in the allowed scores array
  const valueIndex = allowedScores.indexOf(value);

  // Handle slider changes by mapping index back to actual score value
  const handleChange = (e: { target: { value: string } }) => {
    const newIndex = parseInt(e.target.value, 10);
    const newValue = allowedScores[newIndex];
    handler({ target: { name: name, value: newValue } });
  };

  // Get the description text for the current score
  const currentDefinition = definitions[value];

  return (
    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label htmlFor={name} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: theme.textSecondary }}>
          {label}
          <Tooltip text={tooltipText} theme={theme}>
            <HelpCircle style={{ width: '16px', height: '16px', marginLeft: '6px', color: theme.textMuted, cursor: 'help' }} />
          </Tooltip>
        </label>
        <span style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#60a5fa',
          backgroundColor: theme.sliderBg,
          padding: '4px 8px',
          borderRadius: '4px'
        }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max={allowedScores.length - 1}
        value={valueIndex}
        onChange={handleChange}
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.sliderBg,
          borderRadius: '8px',
          appearance: 'none',
          cursor: 'pointer',
          outline: 'none'
        }}
      />
      {/* Fixed height container to prevent layout shifts when descriptions change */}
      <div style={{
        fontSize: '12px',
        color: theme.textMuted,
        marginTop: '8px',
        lineHeight: '1.4',
        minHeight: '56px', // 4 lines at 1.4 line-height (approximately)
        display: 'flex',
        alignItems: 'flex-start'
      }}>
        {currentDefinition}
      </div>
    </div>
  );
};

/**
 * Configuration Panel Component
 * Displays storage mode information and testing functionality
 */
interface ConfigPanelProps {
  onConfigTest: () => void;
  theme: any;
}
const ConfigPanel = ({ onConfigTest, theme }: ConfigPanelProps) => (
  <div style={{
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    border: `1px solid #fbbf24`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Database style={{ width: '20px', height: '20px', color: '#60a5fa', marginRight: '8px' }} />
        <span style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary }}>Storage Mode: In-Memory Session</span>
      </div>
      <button
        onClick={onConfigTest}
        style={{
          fontSize: '12px',
          backgroundColor: theme.sliderBg,
          color: theme.textPrimary,
          padding: '6px 12px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 150ms ease'
        }}
      >
        Test Config
      </button>
    </div>
    <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '8px' }}>
      Data is stored in memory during this session. Refresh will reset all data.
    </p>
  </div>
);

// ===========================
// MAIN APPLICATION
// ===========================

/**
 * Initiative/Objective Data Structure
 * Represents a single work item to be prioritized
 */
interface Initiative {
  id: string;
  createdAt: string;
  name: string;
  uv: number;        // User Value (1-5)
  tc: number;        // Time Criticality (1-5)
  rr: number;        // Risk Reduction (1-5)
  cr: number;        // Compliance/Regulatory (1-5)
  jobSize: number;   // Number of Sprints (1-6)
}

/**
 * Main WSJF Calculator Application Component
 *
 * Manages the entire prioritization workflow:
 * 1. Configure Cost of Delay weights
 * 2. Add objectives with WSJF factor scores
 * 3. View auto-ranked list by WSJF score
 * 4. Export results to PDF or CSV
 */
function WSJFApp() {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  // List of all initiatives/objectives
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);

  // Cost of Delay factor weights (multipliers for UV, TC, RR, CR)
  const [weights, setWeights] = useState({ uv: 1, tc: 1, rr: 1, cr: 1 });

  // UI state flags
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form data for adding new initiatives
  // Default values: mid-range (3) for factors, 1 sprint for effort
  const [newInitiative, setNewInitiative] = useState({
    name: '',
    uv: 3,
    tc: 3,
    rr: 3,
    cr: 1,
    jobSize: 1,
  });

  const theme = getTheme(isDarkMode);

  // ===========================
  // TOOLTIP CONTENT
  // ===========================
  const tooltips = {
    uv: 'User Value / Training Readiness Impact: How much value this delivers to the user, reducing manual effort or enabling critical training functionality.',
    tc: 'Time Criticality / Event Dependency: Is there a specific deadline or event where delays would have severe consequences?',
    rr: 'Risk Reduction / Opportunity Enablement: Does this reduce operational/technical risk or enable significant future opportunities?',
    cr: 'Compliance / Regulatory / SLA: Is this required by law, regulation, or a Service Level Agreement?',
    jobSize:
      'Number of Sprints: Estimated number of sprints required to complete this objective (1-6 sprints).',
  };

  // ===========================
  // EVENT HANDLERS
  // ===========================

  /**
   * Toggle dark mode and persist preference to localStorage
   */
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newMode.toString());
    }
  };

  // ===========================
  // EXPORT FUNCTIONS
  // ===========================

  /**
   * Export prioritized objectives to CSV file
   * Creates a downloadable CSV with all WSJF calculations
   */
  const handleExportCsv = () => {
    if (initiatives.length === 0) {
      alert('Please add some objectives first.');
      return;
    }

    try {
      // Prepare CSV header
      const headers = ['Rank', 'Objective', 'UV', 'TC', 'RR', 'CR', 'Sprints', 'Cost of Delay', 'WSJF Score'];

      // Prepare CSV rows
      const rows = rankedInitiatives.map((init, index) => [
        index + 1,
        `"${init.name.replace(/"/g, '""')}"`, // Escape quotes in names
        init.uv,
        init.tc,
        init.rr,
        init.cr,
        init.jobSize,
        init.costOfDelay.toFixed(2),
        init.wsjf.toFixed(2)
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `wsjf_prioritization_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV. Please try again.');
    }
  };

  /**
   * Export prioritized objectives to styled PDF report
   * Includes:
   * - Branded header with timestamp
   * - Cost of Delay weights summary
   * - Formatted table with color-coded top 3 items
   * - Enhanced visual design for professional reports
   */
  const handleExportPdf = async () => {
    if (initiatives.length === 0) {
      alert('Please add some objectives first.');
      return;
    }

    setIsExporting(true);

    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF export is only available in the browser');
      }

      // Dynamic imports to avoid SSR issues
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

      // Import autoTable plugin
      await import('jspdf-autotable');

      // Create new PDF instance with better margins
      const doc = new jsPDF();

      // Add decorative header with gradient-like effect
      doc.setFillColor(59, 130, 246); // Blue color
      doc.rect(0, 0, 210, 35, 'F');

      // Add title with white text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('WSJF Prioritization Report', 105, 18, { align: 'center' });

      // Add timestamp
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

      // Reset text color for body
      doc.setTextColor(0, 0, 0);

      // Add weights section with styled box
      doc.setFillColor(249, 250, 251); // Light gray background
      doc.roundedRect(14, 42, 182, 28, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cost of Delay Weights', 14, 50);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`User Value (UV): ${weights.uv}x  |  Time Criticality (TC): ${weights.tc}x  |  Risk Reduction (RR): ${weights.rr}x  |  Compliance (CR): ${weights.cr}x`, 14, 58);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total Objectives: ${rankedInitiatives.length}`, 14, 65);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Calculate values for each initiative
      const initiativesWithCalcs = rankedInitiatives;

      // Prepare table data with better formatting
      const tableData = initiativesWithCalcs.map((init, index) => [
        (index + 1).toString(),
        init.name,
        init.uv.toString(),
        init.tc.toString(),
        init.rr.toString(),
        init.cr.toString(),
        init.jobSize.toString(),
        init.costOfDelay.toFixed(1),
        init.wsjf.toFixed(2)
      ]);

      // Add table using autoTable with enhanced styling
      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable({
          head: [['Rank', 'Objective', 'UV', 'TC', 'RR', 'CR', 'Sprints', 'CoD', 'WSJF']],
          body: tableData,
          startY: 75,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.5
          },
          headStyles: {
            fillColor: [59, 130, 246], // Match header color
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
            1: { cellWidth: 55 },
            2: { halign: 'center', cellWidth: 12 },
            3: { halign: 'center', cellWidth: 12 },
            4: { halign: 'center', cellWidth: 12 },
            5: { halign: 'center', cellWidth: 12 },
            6: { halign: 'center', cellWidth: 18 },
            7: { halign: 'center', cellWidth: 18 },
            8: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [59, 130, 246] }
          },
          // Highlight top 3 rows
          didParseCell: function(data: any) {
            if (data.row.index < 3 && data.section === 'body' && data.column.index === 0) {
              const colors = [
                [16, 185, 129],  // Green for #1
                [245, 158, 11],  // Orange for #2
                [249, 115, 22]   // Darker orange for #3
              ];
              data.cell.styles.fillColor = colors[data.row.index];
              data.cell.styles.textColor = [255, 255, 255];
            }
          },
          margin: { top: 75, left: 14, right: 14 }
        });

        // Add footer
        const finalY = (doc as any).lastAutoTable.finalY || 200;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('WSJF = Cost of Delay ÷ Number of Sprints | Higher WSJF = Higher Priority', 105, finalY + 10, { align: 'center' });
      } else {
        // Fallback: add table data as text if autoTable fails
        let yPosition = 75;
        doc.setFontSize(9);
        doc.text('Rank | Objective | UV | TC | RR | CR | Sprints | CoD | WSJF', 14, yPosition);
        yPosition += 5;

        tableData.forEach((row) => {
          const rowText = row.join(' | ');
          doc.text(rowText, 14, yPosition);
          yPosition += 5;
          if (yPosition > 280) { // Add new page if needed
            doc.addPage();
            yPosition = 20;
          }
        });
      }

      // Save the PDF
      doc.save(`wsjf_prioritization_report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Update Cost of Delay weight for a specific factor
   */
  const handleWeightChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setWeights((prev) => ({ ...prev, [name]: Number(value) }));
  };

  /**
   * Update new initiative form field values
   */
  const handleInitiativeChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setNewInitiative((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };

  /**
   * Add new initiative to the list
   * Generates unique ID and timestamp, then resets the form
   */
  const addInitiative = () => {
    if (!newInitiative.name.trim()) return;
    const initiative: Initiative = {
      ...newInitiative,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setInitiatives((prev) => [...prev, initiative]);
    // Reset form to default values
    setNewInitiative({ name: '', uv: 3, tc: 3, rr: 3, cr: 1, jobSize: 1 });
  };

  /**
   * Remove an initiative from the list by ID
   */
  const deleteInitiative = (id: string) => {
    setInitiatives((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Display current configuration in an alert (for testing)
   */
  const testConfiguration = () => {
    const config = {
      storageMode: 'in-memory',
      dataCount: initiatives.length,
      weights: weights,
    };
    alert(`Configuration Test:\n${JSON.stringify(config, null, 2)}`);
  };

  // ===========================
  // INITIALIZATION & EFFECTS
  // ===========================

  /**
   * Initialize app on mount:
   * - Load dark mode preference from localStorage
   * - Simulate loading state
   */
  useEffect(() => {
    // Initialize dark mode from localStorage
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = savedMode ? savedMode === 'true' : prefersDark;
      setIsDarkMode(shouldUseDark);
    }
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ===========================
  // WSJF CALCULATION
  // ===========================

  /**
   * Calculate WSJF scores for all initiatives and rank them
   * Formula: WSJF = Cost of Delay / Number of Sprints
   * Where Cost of Delay = (UV × weight) + (TC × weight) + (RR × weight) + (CR × weight)
   * Results are automatically sorted from highest to lowest WSJF score
   */
  const rankedInitiatives = useMemo(() => {
    return initiatives
      .map((initiative) => {
        const { uv, tc, rr, cr, jobSize } = initiative;
        const costOfDelay = uv * weights.uv + tc * weights.tc + rr * weights.rr + cr * weights.cr;
        const effectiveJobSize = jobSize > 0 ? jobSize : 1;
        const wsjf = costOfDelay / effectiveJobSize;
        return { ...initiative, costOfDelay, wsjf };
      })
      .sort((a, b) => b.wsjf - a.wsjf);
  }, [initiatives, weights]);

  // ===========================
  // UI HELPER FUNCTIONS
  // ===========================

  /**
   * Render a weight configuration slider (1-10 scale)
   * Used for adjusting the Cost of Delay factor weights
   */
  const renderWeightSlider = (
    name: string,
    value: number,
    handler: React.ChangeEventHandler<HTMLInputElement>,
    tooltipText: string,
    label: string,
  ) => (
    <div style={{ flex: 1, minWidth: '150px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label htmlFor={name} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500', color: theme.textSecondary }}>
          {label}
          <Tooltip text={tooltipText} theme={theme}>
            <HelpCircle style={{ width: '16px', height: '16px', marginLeft: '6px', color: theme.textMuted, cursor: 'help' }} />
          </Tooltip>
        </label>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', backgroundColor: theme.sliderBg, padding: '4px 8px', borderRadius: '4px' }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={handler}
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.sliderBg,
          borderRadius: '8px',
          appearance: 'none',
          cursor: 'pointer',
          outline: 'none'
        }}
      />
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: theme.background,
        color: theme.textPrimary,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #60a5fa',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '18px' }}>Loading Prioritization Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.background,
      color: theme.textPrimary,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      transition: 'all 200ms ease'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Header with Dark Mode Toggle */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          gap: '16px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#60a5fa',
            margin: 0,
            textAlign: 'center'
          }}>
            WSJF Calculator
          </h1>
          <DarkModeToggle isDark={isDarkMode} onToggle={toggleDarkMode} />
        </div>

        {/* Configuration Panel */}
        <ConfigPanel onConfigTest={testConfiguration} theme={theme} />

        {/* Weights Configuration */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: theme.textPrimary,
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '8px',
            margin: '0 0 16px 0'
          }}>
            Define Cost of Delay Weights
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {renderWeightSlider('uv', weights.uv, handleWeightChange, tooltips.uv, 'User Value (UV)')}
            {renderWeightSlider('tc', weights.tc, handleWeightChange, tooltips.tc, 'Time Criticality (TC)')}
            {renderWeightSlider('rr', weights.rr, handleWeightChange, tooltips.rr, 'Risk Reduction (RR)')}
            {renderWeightSlider('cr', weights.cr, handleWeightChange, tooltips.cr, 'Compliance/Regulatory (CR)')}
          </div>
        </div>

        {/* Objective Input Form */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: theme.textPrimary,
            borderBottom: `1px solid ${theme.border}`,
            paddingBottom: '8px',
            margin: '0 0 16px 0'
          }}>
            Add New Objective
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.textSecondary,
              marginBottom: '8px'
            }}>
              Objective Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={newInitiative.name}
              onChange={handleInitiativeChange}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: theme.background,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.textPrimary,
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter objective name..."
            />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <ScoringSlider
              name="uv"
              value={newInitiative.uv}
              handler={handleInitiativeChange}
              tooltipText={tooltips.uv}
              label="User Value (UV)"
              definitions={definitions.uv}
              theme={theme}
            />
            <ScoringSlider
              name="tc"
              value={newInitiative.tc}
              handler={handleInitiativeChange}
              tooltipText={tooltips.tc}
              label="Time Criticality (TC)"
              definitions={definitions.tc}
              theme={theme}
            />
            <ScoringSlider
              name="rr"
              value={newInitiative.rr}
              handler={handleInitiativeChange}
              tooltipText={tooltips.rr}
              label="Risk Reduction (RR)"
              definitions={definitions.rr}
              theme={theme}
            />
            <ScoringSlider
              name="cr"
              value={newInitiative.cr}
              handler={handleInitiativeChange}
              tooltipText={tooltips.cr}
              label="Compliance/Regulatory (CR)"
              definitions={definitions.cr}
              theme={theme}
            />
            <ScoringSlider
              name="jobSize"
              value={newInitiative.jobSize}
              handler={handleInitiativeChange}
              tooltipText={tooltips.jobSize}
              label="Number of Sprints"
              definitions={{
                1: '',
                2: '',
                3: '',
                4: '',
                5: '',
                6: ''
              }}
              theme={theme}
              isJobSize={true}
            />
          </div>
          <button
            onClick={addInitiative}
            style={{
              backgroundColor: theme.buttonPrimary,
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background-color 150ms ease'
            }}
          >
            Add Objective
          </button>
        </div>

        {/* Results Table */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: `1px solid ${theme.border}`
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.textPrimary,
              margin: 0
            }}>
              Prioritized Objectives ({rankedInitiatives.length})
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleExportCsv}
                disabled={initiatives.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: initiatives.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: initiatives.length === 0 ? 0.5 : 1,
                  transition: 'all 150ms ease'
                }}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                Export to CSV
              </button>
              <button
                onClick={handleExportPdf}
                disabled={isExporting || initiatives.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: theme.buttonSuccess,
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: isExporting || initiatives.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: isExporting || initiatives.length === 0 ? 0.5 : 1,
                  transition: 'all 150ms ease'
                }}
              >
                <FileDown style={{ width: '16px', height: '16px' }} />
                {isExporting ? 'Generating PDF...' : 'Export to PDF'}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: theme.background }}>
                <tr>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Rank
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Objective
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cost of Delay
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sprints
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    WSJF Score
                  </th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: theme.cardBackground }}>
                {rankedInitiatives.length > 0 ? (
                  rankedInitiatives.map((item, index) => (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderTop: `1px solid ${theme.border}`,
                        transition: 'background-color 150ms ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.hoverOverlay;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            backgroundColor:
                              index === 0 ? '#10b981' :
                              index === 1 ? '#f59e0b' :
                              index === 2 ? '#f97316' : theme.sliderBg,
                            color:
                              index === 0 ? 'white' :
                              index === 1 ? '#1f2937' :
                              index === 2 ? 'white' : theme.textPrimary
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td style={{ padding: '16px 0px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '500', color: theme.textPrimary }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
                          {`UV:${item.uv} | TC:${item.tc} | RR:${item.rr} | CR:${item.cr}`}
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px', whiteSpace: 'nowrap', textAlign: 'center', color: theme.textSecondary }}>
                        {item.costOfDelay.toFixed(0)}
                      </td>
                      <td style={{ padding: '16px 16px', whiteSpace: 'nowrap', textAlign: 'center', color: theme.textSecondary }}>
                        {item.jobSize}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>
                        {item.wsjf.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button
                          onClick={() => deleteInitiative(item.id)}
                          style={{
                            color: theme.textMuted,
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            transition: 'all 150ms ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = theme.textMuted;
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Trash2 style={{ width: '20px', height: '20px' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '64px 24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '500', color: theme.textPrimary, margin: '0 0 8px 0' }}>No objectives yet.</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted }}>
                        Use the form above to add your first objective.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}

export default WSJFApp;
