'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, Trash2, Database, Sun, Moon, FileDown } from 'lucide-react';

// --- Constants ---
const FIBONACCI_SCORES_LIMITED = [1, 3, 6, 8, 10]; // For UV, TC, RR, CR
const FIBONACCI_SCORES_FULL = [1, 3, 6, 8, 10, 13, 20, 40, 100]; // For Job Size

// --- Definitions ---
const definitions = {
  uv: {
    1: 'No direct user benefit; purely technical or internal.',
    3: 'Minor user convenience or minor improvement to workflow.',
    6: 'Moderate improvement to user efficiency or eliminates some manual work.',
    8: 'Significant user value or substantially improves a critical workflow.',
    10: "Major user value: eliminates substantial manual effort, significantly enhances core functionality, or enables critical business capability.",
  },
  tc: {
    1: 'No time pressure; can be delivered anytime.',
    3: 'Minor preference for earlier delivery, no significant consequences.',
    6: 'Moderate time pressure: delayed delivery impacts some planned activities.',
    8: 'High time criticality: delayed delivery affects critical business events or releases.',
    10: 'Severe time criticality: missing the deadline has major business impact or blocks critical dependencies.',
  },
  rr: {
    1: 'No known risk mitigation or opportunity enablement.',
    3: 'Reduces minor operational inefficiencies or provides slight improvement in future capability.',
    6: 'Moderate risk reduction or enables valuable future opportunities.',
    8: 'Significantly reduces operational or technical risk, or enables high-value future opportunities.',
    10: "Prevents a high-impact 'development failure or delay,' fundamentally improves user adoption, or enables a new, high-value operational paradigm.",
  },
  cr: {
    1: 'No current compliance or regulatory requirement.',
    3: 'Good to have for future compliance, but no immediate mandate.',
    6: 'Addresses an emerging compliance need or prepares for a likely SLA.',
    8: 'Required for an upcoming audit or to meet a critical, anticipated SLA.',
    10: 'Mandated by law, regulation, or existing critical SLA; non-compliance has severe consequences.',
  },
};

// --- Dark Mode Theme ---
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

// --- Dark Mode Toggle Component ---
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

// --- Helper Components ---
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
  const allowedScores = isJobSize ? FIBONACCI_SCORES_FULL : FIBONACCI_SCORES_LIMITED;
  const valueIndex = allowedScores.indexOf(value);
  
  const handleChange = (e: { target: { value: string } }) => {
    const newIndex = parseInt(e.target.value, 10);
    const newValue = allowedScores[newIndex];
    handler({ target: { name: name, value: newValue } });
  };
  
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
      <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '8px', lineHeight: '1.4' }}>
        {currentDefinition}
      </div>
    </div>
  );
};

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

// --- Main App Component ---
interface Initiative {
  id: string;
  createdAt: string;
  name: string;
  uv: number;
  tc: number;
  rr: number;
  cr: number;
  jobSize: number;
}

function WSJFApp() {
  // --- State Management ---
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [weights, setWeights] = useState({ uv: 1, tc: 1, rr: 1, cr: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newInitiative, setNewInitiative] = useState({
    name: '',
    uv: 3,
    tc: 3,
    rr: 3,
    cr: 1,
    jobSize: 8,
  });

  const theme = getTheme(isDarkMode);

  // --- Tooltip Content ---
  const tooltips = {
    uv: 'User Value / Training Readiness Impact: How much value this delivers to the user, reducing manual effort or enabling critical training functionality.',
    tc: 'Time Criticality / Event Dependency: Is there a specific deadline or event where delays would have severe consequences?',
    rr: 'Risk Reduction / Opportunity Enablement: Does this reduce operational/technical risk or enable significant future opportunities?',
    cr: 'Compliance / Regulatory / SLA: Is this required by law, regulation, or a Service Level Agreement?',
    jobSize:
      "Job Size (Story Points): The development team's estimate of the effort required, using Fibonacci sequence numbers.",
  };

  // --- Dark Mode Handler ---
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newMode.toString());
    }
  };

  // --- PDF Export Function ---
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
      
      // Create new PDF instance
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('WSJF Prioritization Report', 14, 22);
      
      // Add timestamp
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Add weights section
      doc.setFontSize(12);
      doc.text('Configured Weights:', 14, 40);
      doc.setFontSize(10);
      doc.text(`User Value / Training Readiness Impact (UV): ${weights.uv}`, 14, 47);
      doc.text(`Time Criticality / Event Dependency (TC): ${weights.tc}`, 14, 52);
      doc.text(`Risk Reduction / Opportunity Enablement (RR): ${weights.rr}`, 14, 57);
      doc.text(`Compliance / Regulatory / SLA (CR): ${weights.cr}`, 14, 62);
      
      // Calculate values for each initiative
      const initiativesWithCalcs = rankedInitiatives;
      
      // Prepare table data
      const tableData = initiativesWithCalcs.map((init, index) => [
        (index + 1).toString(),
        init.name,
        init.uv.toString(),
        init.tc.toString(),
        init.rr.toString(),
        init.cr.toString(),
        init.jobSize.toString(),
        init.costOfDelay.toFixed(2),
        init.wsjf.toFixed(2)
      ]);
      
      // Add table using autoTable
      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable({
          head: [['Rank', 'Objective', 'UV', 'TC', 'RR', 'CR', 'Job Size', 'CoD', 'WSJF']],
          body: tableData,
          startY: 70,
          styles: { 
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: { 
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: { 
            fillColor: [245, 245, 245] 
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 40 },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 15 },
            5: { halign: 'center', cellWidth: 15 },
            6: { halign: 'center', cellWidth: 20 },
            7: { halign: 'center', cellWidth: 20 },
            8: { halign: 'center', cellWidth: 20 }
          }
        });
      } else {
        // Fallback: add table data as text if autoTable fails
        let yPosition = 70;
        doc.setFontSize(8);
        doc.text('Rank | Objective | UV | TC | RR | CR | Job Size | CoD | WSJF', 14, yPosition);
        yPosition += 5;
        
        tableData.forEach((row) => {
          const rowText = row.join(' | ');
          doc.text(rowText, 14, yPosition);
          yPosition += 4;
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

  // --- Initialization ---
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

  // --- Handlers ---
  const handleWeightChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setWeights((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleInitiativeChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setNewInitiative((prev) => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };

  const addInitiative = () => {
    if (!newInitiative.name.trim()) return;
    const initiative: Initiative = {
      ...newInitiative,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setInitiatives((prev) => [...prev, initiative]);
    setNewInitiative({ name: '', uv: 3, tc: 3, rr: 3, cr: 1, jobSize: 8 });
  };

  const deleteInitiative = (id: string) => {
    setInitiatives((prev) => prev.filter((item) => item.id !== id));
  };

  const testConfiguration = () => {
    const config = {
      storageMode: 'in-memory',
      dataCount: initiatives.length,
      weights: weights,
    };
    alert(`Configuration Test:\n${JSON.stringify(config, null, 2)}`);
  };

  // --- WSJF Calculation ---
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

  // --- UI Rendering ---
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
              label="Job Size"
              definitions={{
                1: 'Trivial change (1-2 hours)',
                3: 'Small change (half day)',
                6: 'Medium change (1-2 days)',
                8: 'Large change (3-5 days)',
                10: 'Very large change (1-2 weeks)',
                13: 'Major change (2-3 weeks)',
                20: 'Epic change (1 month)',
                40: 'Large epic (2 months)',
                100: 'Major initiative (3+ months)'
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
                    Job Size
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
