'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, Trash2, Database, Sun, Moon, FileDown } from 'lucide-react';

// --- Constants ---
const FIBONACCI_SCORES = [1, 3, 6, 8, 10, 13, 20, 40, 100];
const ALLOWED_SCORES = [1, 3, 6, 8, 10, 13, 20, 40, 100];

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

// --- Dark Mode Toggle Component ---
const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedMode = localStorage.getItem('darkMode');
      const shouldUseDark = savedMode ? savedMode === 'true' : prefersDark;
      
      setIsDarkMode(shouldUseDark);
      document.documentElement.classList.toggle('dark', shouldUseDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', newMode);
      localStorage.setItem('darkMode', newMode.toString());
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <>
          <Sun className="w-5 h-5" />
          <span className="text-sm">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5" />
          <span className="text-sm">Dark Mode</span>
        </>
      )}
    </button>
  );
};

// --- Helper Components ---
type TooltipProps = { text: string; children: React.ReactNode };
const Tooltip = ({ text, children }: TooltipProps) => (
  <div className="relative flex items-center group">
    {children}
    <div className="absolute bottom-full mb-2 w-72 p-3 text-sm text-white dark:text-gray-100 bg-gray-800 dark:bg-gray-700 border border-gray-600 dark:border-gray-500 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
      {text}
      <svg className="absolute text-gray-800 dark:text-gray-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
        <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
      </svg>
    </div>
  </div>
);

interface ScoringSliderProps {
  name: string;
  value: number;
  handler: (e: { target: { name: string; value: number } }) => void;
  tooltipText: string;
  label: string;
  definitions: Record<number, string>;
}
const ScoringSlider = ({
  name,
  value,
  handler,
  tooltipText,
  label,
  definitions,
}: ScoringSliderProps): React.JSX.Element => {
  const valueIndex = ALLOWED_SCORES.indexOf(value);
  const handleChange = (e: { target: { value: string } }) => {
    const newIndex = parseInt(e.target.value, 10);
    const newValue = ALLOWED_SCORES[newIndex];
    handler({ target: { name: name, value: newValue } });
  };
  const currentDefinition = definitions[value];
  return (
    <div className="flex-1 min-w-[200px] flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-300 dark:text-gray-400 flex items-center">
          {label}
          <Tooltip text={tooltipText}>
            <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
          </Tooltip>
        </label>
        <span className="text-sm font-bold text-blue-400 dark:text-blue-300 bg-gray-700 dark:bg-gray-600 px-2 py-0.5 rounded">{value}</span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max={FIBONACCI_SCORES.length - 1}
        value={valueIndex}
        onChange={handleChange}
        className="w-full h-2 bg-gray-600 dark:bg-gray-500 rounded-lg appearance-none cursor-pointer range-thumb"
      />
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-tight">
        {currentDefinition}
      </div>
    </div>
  );
};

interface ConfigPanelProps {
  onConfigTest: () => void;
}
const ConfigPanel = ({ onConfigTest }: ConfigPanelProps) => (
  <div className="bg-yellow-900/20 dark:bg-yellow-800/20 border border-yellow-600 dark:border-yellow-500 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Database className="w-5 h-5 text-blue-400 dark:text-blue-300 mr-2" />
        <span className="text-sm font-medium text-gray-100 dark:text-gray-200">Storage Mode: In-Memory Session</span>
      </div>
      <button
        onClick={onConfigTest}
        className="text-xs bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 px-3 py-1 rounded transition-colors text-gray-100 dark:text-gray-200"
      >
        Test Config
      </button>
    </div>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
  const [newInitiative, setNewInitiative] = useState({
    name: '',
    uv: 3,
    tc: 3,
    rr: 3,
    cr: 1,
    jobSize: 8,
  });

  // --- Tooltip Content ---
  const tooltips = {
    uv: 'User Value / Training Readiness Impact: How much value this delivers to the user, reducing manual effort or enabling critical training functionality.',
    tc: 'Time Criticality / Event Dependency: Is there a specific deadline or event where delays would have severe consequences?',
    rr: 'Risk Reduction / Opportunity Enablement: Does this reduce operational/technical risk or enable significant future opportunities?',
    cr: 'Compliance / Regulatory / SLA: Is this required by law, regulation, or a Service Level Agreement?',
    jobSize:
      "Job Size (Story Points): The development team's estimate of the effort required, using Fibonacci sequence numbers.",
  };

  // --- PDF Export Function ---
  const handleExportPdf = async () => {
    if (initiatives.length === 0) {
      alert('Please add some initiatives first.');
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
          head: [['Rank', 'Initiative', 'UV', 'TC', 'RR', 'CR', 'Job Size', 'CoD', 'WSJF']],
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
        doc.text('Rank | Initiative | UV | TC | RR | CR | Job Size | CoD | WSJF', 14, yPosition);
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
      
      // Provide more specific error messaging
      if (error instanceof Error) {
        if (error.message.includes('browser')) {
          alert('PDF export is only available when running in the browser.');
        } else if (error.message.includes('import') || error.message.includes('module')) {
          alert('Failed to load PDF libraries. Please try refreshing the page.');
        } else {
          alert(`Failed to generate PDF: ${error.message}`);
        }
      } else {
        alert('Failed to generate PDF. Please try again or check the browser console for details.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // --- Initialization ---
  useEffect(() => {
    // Simulate loading time and initialization
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
    <div className="flex-1 min-w-[150px]">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-300 dark:text-gray-400 flex items-center">
          {label}
          <Tooltip text={tooltipText}>
            <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
          </Tooltip>
        </label>
        <span className="text-sm font-bold text-blue-400 dark:text-blue-300 bg-gray-700 dark:bg-gray-600 px-2 py-0.5 rounded">{value}</span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={handler}
        className="w-full h-2 bg-gray-600 dark:bg-gray-500 rounded-lg appearance-none cursor-pointer range-thumb"
      />
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 transition-colors duration-200">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg">Loading Prioritization Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-sans transition-colors duration-200">
      <div className="!container mx-auto p-6">
        {/* Header with Dark Mode Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-blue-400 dark:text-blue-600">WSJF Calculator</h1>
          <DarkModeToggle />
        </div>

        {/* Configuration Panel */}
        <ConfigPanel onConfigTest={testConfiguration} />

        {/* Weights Configuration */}
        <div className="bg-gray-800 dark:bg-white rounded-lg p-6 mb-6 shadow-lg border border-gray-700 dark:border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-white dark:text-gray-900 border-b border-gray-700 dark:border-gray-300 pb-2">
            Define Cost of Delay Weights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderWeightSlider('uv', weights.uv, handleWeightChange, tooltips.uv, 'User Value (UV)')}
            {renderWeightSlider('tc', weights.tc, handleWeightChange, tooltips.tc, 'Time Criticality (TC)')}
            {renderWeightSlider('rr', weights.rr, handleWeightChange, tooltips.rr, 'Risk Reduction (RR)')}
            {renderWeightSlider('cr', weights.cr, handleWeightChange, tooltips.cr, 'Compliance/Regulatory (CR)')}
          </div>
        </div>

        {/* Initiative Input Form */}
        <div className="bg-gray-800 dark:bg-white rounded-lg p-6 mb-6 shadow-lg border border-gray-700 dark:border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-white dark:text-gray-900 border-b border-gray-700 dark:border-gray-300 pb-2">
            Add New Initiative
          </h2>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-2">
              Initiative Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={newInitiative.name}
              onChange={handleInitiativeChange}
              className="w-full p-3 bg-gray-700 dark:bg-gray-50 border border-gray-600 dark:border-gray-300 rounded-lg text-white dark:text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter initiative name..."
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
            <ScoringSlider
              name="uv"
              value={newInitiative.uv}
              handler={handleInitiativeChange}
              tooltipText={tooltips.uv}
              label="User Value (UV)"
              definitions={definitions.uv}
            />
            <ScoringSlider
              name="tc"
              value={newInitiative.tc}
              handler={handleInitiativeChange}
              tooltipText={tooltips.tc}
              label="Time Criticality (TC)"
              definitions={definitions.tc}
            />
            <ScoringSlider
              name="rr"
              value={newInitiative.rr}
              handler={handleInitiativeChange}
              tooltipText={tooltips.rr}
              label="Risk Reduction (RR)"
              definitions={definitions.rr}
            />
            <ScoringSlider
              name="cr"
              value={newInitiative.cr}
              handler={handleInitiativeChange}
              tooltipText={tooltips.cr}
              label="Compliance/Regulatory (CR)"
              definitions={definitions.cr}
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
            />
          </div>
          <button
            onClick={addInitiative}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Initiative
          </button>
        </div>

        {/* Results Table */}
        <div className="bg-gray-800 dark:bg-white rounded-lg shadow-lg border border-gray-700 dark:border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-700 dark:border-gray-300">
            <h2 className="text-2xl font-semibold text-white dark:text-gray-900">
              Prioritized Initiatives ({rankedInitiatives.length})
            </h2>
            <button
              onClick={handleExportPdf}
              disabled={isExporting || initiatives.length === 0}
              className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white font-semibold rounded-md shadow-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? 'Generating PDF...' : 'Export to PDF'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 dark:bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                    Initiative
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                    Cost of Delay
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                    Job Size
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                    WSJF Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 dark:text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600 dark:divide-gray-200">
                {rankedInitiatives.length > 0 ? (
                  rankedInitiatives.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-700/50 dark:hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-green-500 text-white'
                              : index === 1
                              ? 'bg-yellow-500 text-gray-900'
                              : index === 2
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-600 dark:bg-gray-400 text-gray-200 dark:text-gray-800'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <div className="font-medium text-white dark:text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                          {`UV:${item.uv} | TC:${item.tc} | RR:${item.rr} | CR:${item.cr}`}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-gray-300 dark:text-gray-700">
                        {item.costOfDelay.toFixed(0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-gray-300 dark:text-gray-700">{item.jobSize}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-bold text-blue-400 dark:text-blue-600">
                        {item.wsjf.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => deleteInitiative(item.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-500/10 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 px-6">
                      <h3 className="text-lg font-medium text-white dark:text-gray-900">No initiatives yet.</h3>
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-600">
                        Use the form above to add your first software initiative.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WSJFApp;
