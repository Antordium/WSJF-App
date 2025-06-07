'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, PlusCircle, HelpCircle, Database } from 'lucide-react';

// --- Constants for Scoring ---
const ALLOWED_SCORES = [1, 3, 6, 8, 10];
const FIBONACCI_SCORES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
const SCORE_DEFINITIONS = {
  uv: {
    1: 'Minor quality-of-life improvement, no direct impact on training effectiveness or time savings.',
    3: 'Moderate reduction in manual effort, slight performance improvement, or adds minor training utility.',
    6: 'Significant reduction in manual data entry/time spent, noticeable performance improvement, or enables important training functionality.',
    8: 'Eliminates a major time-sink, critical performance fix, or enables a new, essential training capability.',
    10: 'Directly prevents a major training/exercise failure, ensures accurate and timely training readiness reporting, or drastically improves service member efficiency.',
  },
  tc: {
    1: 'No specific deadline or event dependency.',
    3: 'Desired for an upcoming event, but delay is manageable.',
    6: 'Important for a planned event; delay would cause significant inconvenience or rework.',
    8: 'Critical for an upcoming exercise, collective, or individual training, potential for hours of delay if not delivered.',
    10: 'Absolutely critical for an imminent mission rehearsal, large-scale exercise, or individual training where failure/delay is unacceptable.',
  },
  rr: {
    1: 'No significant risk reduction or opportunity enablement.',
    3: 'Addresses minor technical debt, enables a small future enhancement.',
    6: 'Mitigates a moderate risk (e.g., recurring data inaccuracy issue), enables a significant future capability.',
    8: 'Addresses a high-priority risk (e.g., widespread data inaccuracy), unlocks a critical strategic opportunity.',
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
    <div className="absolute bottom-full mb-2 w-72 p-3 text-sm text-white bg-gray-800 border border-gray-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
      {text}
      <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
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
        <label htmlFor={name} className="text-sm font-medium text-gray-300 flex items-center">
          {label}
          <Tooltip text={tooltipText}>
            <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
          </Tooltip>
        </label>
        <span className="text-sm font-bold text-blue-400 bg-gray-700 px-2.5 py-1 rounded-md">{value}</span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max={ALLOWED_SCORES.length - 1}
        value={valueIndex}
        onChange={handleChange}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
      />
      <div className="mt-3 text-xs text-gray-400 bg-gray-900/50 p-3 rounded-md h-full min-h-[70px]">
        <strong>Meaning:</strong> {currentDefinition}
      </div>
    </div>
  );
};

interface FibonacciSliderProps {
  name: string;
  value: number;
  handler: (e: { target: { name: string; value: number } }) => void;
  tooltipText: string;
  label: string;
}
const FibonacciSlider = ({ name, value, handler, tooltipText, label }: FibonacciSliderProps) => {
  let valueIndex = FIBONACCI_SCORES.indexOf(value);
  if (valueIndex === -1) {
    valueIndex = 4; // Corresponds to 8
  }
  const handleChange = (e: { target: { value: string } }) => {
    const newIndex = parseInt(e.target.value, 10);
    const newValue = FIBONACCI_SCORES[newIndex];
    handler({ target: { name, value: newValue } });
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-300 flex items-center">
          {label}
          <Tooltip text={tooltipText}>
            <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
          </Tooltip>
        </label>
        <span className="text-sm font-bold text-blue-400 bg-gray-700 px-2 py-0.5 rounded">{value}</span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="0"
        max={FIBONACCI_SCORES.length - 1}
        value={valueIndex}
        onChange={handleChange}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
      />
    </div>
  );
};

interface ConfigPanelProps {
  onConfigTest: () => void;
}
const ConfigPanel = ({ onConfigTest }: ConfigPanelProps) => (
  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Database className="w-5 h-5 text-blue-400 mr-2" />
        <span className="text-sm font-medium">Storage Mode: In-Memory Session</span>
      </div>
      <button
        onClick={onConfigTest}
        className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
      >
        Test Config
      </button>
    </div>
    <p className="text-xs text-gray-400 mt-2">
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
        <label htmlFor={name} className="text-sm font-medium text-gray-300 flex items-center">
          {label}
          <Tooltip text={tooltipText}>
            <HelpCircle className="w-4 h-4 ml-1.5 text-gray-500 hover:text-blue-400 cursor-help" />
          </Tooltip>
        </label>
        <span className="text-sm font-bold text-blue-400 bg-gray-700 px-2 py-0.5 rounded">{value}</span>
      </div>
      <input
        type="range"
        id={name}
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={handler}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
      />
    </div>
  );
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
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
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <style>{`
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #60a5fa;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid #1f2937;
                }
                .range-thumb::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #60a5fa;
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid #1f2937;
                }
            `}</style>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-400">WSJF Prioritization Calculator</h1>
          <p className="mt-2 text-lg text-gray-400">
            Prioritize initiatives by calculating Weighted Shortest Job First.
          </p>
        </header>
        <ConfigPanel onConfigTest={testConfiguration} />
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Cost of Delay Weights</h2>
          <p className="text-gray-400 mb-6">
            Adjust the relative importance of each CoD component. These weights are determined by stakeholders.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderWeightSlider('uv', weights.uv, handleWeightChange, tooltips.uv, 'User Value')}
            {renderWeightSlider('tc', weights.tc, handleWeightChange, tooltips.tc, 'Time Criticality')}
            {renderWeightSlider('rr', weights.rr, handleWeightChange, tooltips.rr, 'Risk Reduction')}
            {renderWeightSlider('cr', weights.cr, handleWeightChange, tooltips.cr, 'Compliance')}
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Add New Initiative</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="initiative-name" className="text-sm font-medium text-gray-300 mb-1 block">
                Initiative Name
              </label>
              <input
                type="text"
                id="initiative-name"
                name="name"
                value={newInitiative.name}
                onChange={handleInitiativeChange}
                placeholder="e.g., Automate Training Readiness Report"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <ScoringSlider
                name="uv"
                value={newInitiative.uv}
                handler={handleInitiativeChange}
                tooltipText={tooltips.uv}
                label="User Value"
                definitions={SCORE_DEFINITIONS.uv}
              />
              <ScoringSlider
                name="tc"
                value={newInitiative.tc}
                handler={handleInitiativeChange}
                tooltipText={tooltips.tc}
                label="Time Criticality"
                definitions={SCORE_DEFINITIONS.tc}
              />
              <ScoringSlider
                name="rr"
                value={newInitiative.rr}
                handler={handleInitiativeChange}
                tooltipText={tooltips.rr}
                label="Risk Reduction"
                definitions={SCORE_DEFINITIONS.rr}
              />
              <ScoringSlider
                name="cr"
                value={newInitiative.cr}
                handler={handleInitiativeChange}
                tooltipText={tooltips.cr}
                label="Compliance"
                definitions={SCORE_DEFINITIONS.cr}
              />
            </div>
            <FibonacciSlider
              name="jobSize"
              value={newInitiative.jobSize}
              handler={handleInitiativeChange}
              tooltipText={tooltips.jobSize}
              label="Job Size (Story Points)"
            />
            <div className="text-right">
              <button
                onClick={addInitiative}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Initiative
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider"
                >
                  Rank
                </th>
                <th
                  scope="col"
                  className="py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider min-w-[200px]"
                >
                  Initiative
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-center text-xs font-bold text-blue-300 uppercase tracking-wider"
                >
                  CoD
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-center text-xs font-bold text-blue-300 uppercase tracking-wider"
                >
                  Job Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-bold text-blue-300 uppercase tracking-wider"
                >
                  WSJF
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-bold text-blue-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {rankedInitiatives.length > 0 ? (
                rankedInitiatives.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg ${
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
                    <td className="py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {`UV:${item.uv} | TC:${item.tc} | RR:${item.rr} | CR:${item.cr}`}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-gray-300">
                      {item.costOfDelay.toFixed(0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-gray-300">{item.jobSize}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xl font-bold text-blue-400">
                      {item.wsjf.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => deleteInitiative(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 px-6">
                    <h3 className="text-lg font-medium text-white">No initiatives yet.</h3>
                    <p className="mt-1 text-sm text-gray-400">
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
  );
}

export default WSJFApp;