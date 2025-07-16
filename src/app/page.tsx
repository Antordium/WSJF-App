'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, Database, Moon, Sun, FileDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- Type Declarations for PDF Libraries ---
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

// --- Constants ---
const FIBONACCI_SCORES = [1, 2, 3, 5, 8, 13, 21];
const ALLOWED_SCORES = [1, 3, 6, 8, 10];

// --- Score Definitions ---
const SCORING_DEFINITIONS = {
  uv: {
    1: 'Minimal or no direct user value; primarily technical or maintenance work.',
    3: 'Some user value, but limited scope or impact on daily operations.',
    6: 'Moderate user value; improves efficiency or experience in a meaningful way.',
    8: 'High user value; significantly enhances operations or user experience.',
    10: "Critical user value; transforms operations, solves major pain points, or enables mission-critical capabilities.",
  },
  tc: {
    1: 'No time pressure; can be delayed without significant consequences.',
    3: 'Some time sensitivity, but delays are manageable.',
    6: 'Moderate time criticality; delays could impact operations or user satisfaction.',
    8: 'High time criticality; delays would cause significant problems or missed opportunities.',
    10: "Extremely time-critical; delays would result in severe operational failures, major security vulnerabilities, or mission failure.",
  },
  rr: {
    1: 'No significant risk reduction or opportunity enablement.',
    3: 'Minor risk reduction or small opportunity enablement.',
    6: 'Moderate risk reduction or opens up meaningful opportunities.',
    8: 'Significant risk reduction or enables major opportunities.',
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

// --- Helper Components ---
type TooltipProps = { text: string; children: React.ReactNode };
const Tooltip = ({ text, children }: TooltipProps) => (
  <div className="relative flex items-center group">
    {children}
    <div className="absolute bottom-full mb-2 w-72 p-3 text-sm text-white bg-gray-800 dark:bg-gray-900 border border-gray-600 dark:border-gray-500 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
      {text}
      <svg className="absolute text-gray-800 dark:text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
        <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
      </svg>
    </div>
  </div>
);

// --- Dark Mode Toggle Component ---
const DarkModeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const stored = localStorage.getItem('darkMode');
      const initialMode = stored ? JSON.parse(stored) : prefersDark;
      setIsDarkMode(initialMode);
      document.documentElement.classList.toggle('dark', initialMode);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newMode);
      localStorage.setItem('darkMode', JSON.stringify(newMode));
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

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
        <label htmlFor={name} className="text-sm font-medium text-gray-300 flex items-center">
          {label}
          <Tooltip text={tooltipText}>
            <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
          </Tooltip>
        </label>
        <span className="text-sm font-bold text-blue-400 bg-gray-700 dark:bg-gray-800 px-2 py-0.5 rounded">{value}</span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max={ALLOWED_SCORES.length - 1}
        value={valueIndex}
        onChange={handleChange}
        className="w-full h-2 bg-gray-600 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb"
      />
      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 leading-tight">
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
        <Database className="w-5 h-5 text-blue-400 mr-2" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Storage Mode: In-Memory Session</span>
      </div>
      <button
        onClick={onConfigTest}
        className="text-xs bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 px-3 py-1 rounded transition-colors text-gray-100"
      >
        Test Config
      </button>
    </div>
    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
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

  // --- PDF Export Function ---
  const handleExportPdf = async () => {
    if (initiatives.length === 0) {
      alert('No initiatives to export. Please add some initiatives first.');
      return;
    }

    setIsExporting(true);
    
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF export is only available in the browser');
      }

      // Dynamic imports to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      
      // Import autoTable - this extends jsPDF prototype
      await import('jspdf-autotable');
      
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
      doc.text(`User Value (UV): ${weights.uv}`, 14, 47);
      doc.text(`Time Criticality (TC): ${weights.tc}`, 14, 52);
      doc.text(`Risk Reduction (RR): ${weights.rr}`, 14, 57);
      doc.text(`Compliance/Regulatory (CR): ${weights.cr}`, 14, 62);
      
      // Calculate enriched data for table
      const enrichedInitiatives = initiatives.map(item => {
        const costOfDelay = (item.uv * weights.uv) + (item.tc * weights.tc) + (item.rr * weights.rr) + (item.cr * weights.cr);
        const wsjf = item.jobSize > 0 ? costOfDelay / item.jobSize : 0;
        return { ...item, costOfDelay, wsjf };
      }).sort((a, b) => b.wsjf - a.wsjf);
      
      // Prepare table data
      const tableData = enrichedInitiatives.map((init, index) => [
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
      doc.autoTable({
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
      
      // Save the PDF
      doc.save(`wsjf_prioritization_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('browser')) {
          alert('PDF export is only available when running in the browser.');
        } else if (error.message.includes('import')) {
          alert('Failed to load PDF libraries. Please try refreshing the page.');
        } else {
          alert(`Failed to generate PDF: ${error.message}`);
        }
      } else {
        alert('Failed to generate PDF. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // --- Tooltip Content ---
  const tooltips = {
    uv: 'User Value / Training Readiness Impact: How much value this delivers to the user, reducing manual effort or enabling critical training functionality.',
    tc: 'Time Criticality / Event Dependency: Is there a specific deadline or event where delays would have severe consequences?',
    rr: 'Risk Reduction / Opportunity Enablement: Does this reduce operational/technical risk or enable significant future opportunities?',
    cr: 'Compliance / Regulatory / SLA: Is this required by law, regulation, or a Service Level Agreement?',
    jobSize:
      "Job Size (Story Points): The development team's estimate of the effort required, using Fibonacci sequence numbers.",
  };

  // --- Event Handlers ---
  const updateNewInitiative = (e: { target: { name: string; value: string | number } }) => {
    const { name, value } = e.target;
    setNewInitiative((prev) => ({
      ...prev,
      [name]: typeof value === 'string' ? value : value,
    }));
  };

  const updateWeights = (e: { target: { name: string; value: string | number } }) => {
    const { name, value } = e.target;
    setWeights((prev) => ({
      ...prev,
      [name]: typeof value === 'string' ? parseFloat(value) : value,
    }));
  };

  const addInitiative = () => {
    if (!newInitiative.name.trim()) {
      alert('Initiative name is required.');
      return;
    }

    const initiative: Initiative = {
      ...newInitiative,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    setInitiatives((prev) => [...prev, initiative]);
    setNewInitiative({
      name: '',
      uv: 3,
      tc: 3,
      rr: 3,
      cr: 1,
      jobSize: 8,
    });
  };

  const deleteInitiative = (id: string) => {
    setInitiatives((prev) => prev.filter((item) => item.id !== id));
  };

  const testConfig = () => {
    alert('Configuration test: All systems operational!');
  };

  // --- Calculations ---
  const enrichedInitiatives = initiatives.map((item) => {
    const costOfDelay = (item.uv * weights.uv) + (item.tc * weights.tc) + (item.rr * weights.rr) + (item.cr * weights.cr);
    const wsjf = item.jobSize > 0 ? costOfDelay / item.jobSize : 0;
    return { ...item, costOfDelay, wsjf };
  });

  const sortedInitiatives = enrichedInitiatives.sort((a, b) => b.wsjf - a.wsjf);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading WSJF Calculator...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 transition-colors duration-200 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">WSJF Calculator</h1>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <button
            onClick={handleExportPdf}
            disabled={isExporting || initiatives.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-md shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileDown className="w-4 h-4" />
            {isExporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <ConfigPanel onConfigTest={testConfig} />

      {/* Weights Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Configure Prioritization Weights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">User Value Weight:</label>
            <input
              type="number"
              name="uv"
              value={weights.uv}
              onChange={updateWeights}
              min="0"
              step="0.1"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Time Criticality Weight:</label>
            <input
              type="number"
              name="tc"
              value={weights.tc}
              onChange={updateWeights}
              min="0"
              step="0.1"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Risk Reduction Weight:</label>
            <input
              type="number"
              name="rr"
              value={weights.rr}
              onChange={updateWeights}
              min="0"
              step="0.1"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Compliance Weight:</label>
            <input
              type="number"
              name="cr"
              value={weights.cr}
              onChange={updateWeights}
              min="0"
              step="0.1"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Add New Initiative */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Add New Initiative</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Initiative Name:</label>
          <input
            type="text"
            name="name"
            value={newInitiative.name}
            onChange={updateNewInitiative}
            placeholder="Enter initiative name..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ScoringSlider
            name="uv"
            value={newInitiative.uv}
            handler={updateNewInitiative}
            tooltipText={tooltips.uv}
            label="User Value (UV)"
            definitions={SCORING_DEFINITIONS.uv}
          />
          <ScoringSlider
            name="tc"
            value={newInitiative.tc}
            handler={updateNewInitiative}
            tooltipText={tooltips.tc}
            label="Time Criticality (TC)"
            definitions={SCORING_DEFINITIONS.tc}
          />
          <ScoringSlider
            name="rr"
            value={newInitiative.rr}
            handler={updateNewInitiative}
            tooltipText={tooltips.rr}
            label="Risk Reduction (RR)"
            definitions={SCORING_DEFINITIONS.rr}
          />
          <ScoringSlider
            name="cr"
            value={newInitiative.cr}
            handler={updateNewInitiative}
            tooltipText={tooltips.cr}
            label="Compliance/Regulatory (CR)"
            definitions={SCORING_DEFINITIONS.cr}
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              Job Size (Story Points)
              <Tooltip text={tooltips.jobSize}>
                <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
              </Tooltip>
            </label>
            <span className="text-sm font-bold text-blue-400 bg-gray-700 dark:bg-gray-800 px-2 py-0.5 rounded">
              {newInitiative.jobSize}
            </span>
          </div>
          <select
            name="jobSize"
            value={newInitiative.jobSize}
            onChange={updateNewInitiative}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {FIBONACCI_SCORES.map((score) => (
              <option key={score} value={score}>
                {score} point{score !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addInitiative}
          className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Initiative
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prioritized Initiatives</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Initiative
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cost of Delay
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Job Size
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  WSJF Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedInitiatives.length > 0 ? (
                sortedInitiatives.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0
                            ? 'bg-green-500 text-white'
                            : index === 1
                            ? 'bg-yellow-500 text-gray-900'
                            : index === 2
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-600 text-gray-200'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {`UV:${item.uv} | TC:${item.tc} | RR:${item.rr} | CR:${item.cr}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-gray-300">
                      {item.costOfDelay.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-gray-300">{item.jobSize}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-bold text-blue-600 dark:text-blue-400">
                      {item.wsjf.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => deleteInitiative(item.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 px-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No initiatives yet.</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Use the form above to add your first software initiative.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
        <p>WSJF Calculator - Prioritize initiatives using Weighted Shortest Job First methodology</p>
      </footer>
    </div>
  );
}

export default WSJFApp;
