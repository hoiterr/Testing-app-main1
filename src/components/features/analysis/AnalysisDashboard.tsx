

import React, { useState, useEffect } from 'react';
import { type PoeAnalysisResult, type SynergyInsight } from '@/types'; // Used 'type' import
import { useAnalysis } from '@/hooks/useAnalysis';
import { useChat } from '@/hooks/useChat';
import { useUI } from '@/hooks/useUI';
import { logService } from '@/services/logService';

import GearContent from '@/components/features/analysis/GearContent';
import TreeContent from '@/components/features/analysis/TreeContent';
import SimulationView from '@/components/features/simulation/SimulationView';

export const AnalysisDashboard: React.FC = () => {
  const { analysisResult, checkedImprovements, handleToggleImprovement, error, isAnalyzing } = useAnalysis();
  const { /* sendProactiveChatMessage */ } = useChat(); // Removed from destructuring
  const { /* showGuidedReview */ } = useUI(); // Removed from destructuring

  const [activeTab, setActiveTab] = useState('improvements');

  useEffect(() => {
    if (error) {
      logService.error('AnalysisDashboard - Error', error);
    }
  }, [error]);

  if (isAnalyzing) {
    return (
      <div className="flex-col items-center justify-center h-full text-center">
        <p className="text-yellow mt-4">Analyzing build...</p>
      </div>
    );
  }

  if (!analysisResult) return null;

  const tabs: { id: string; label: string }[] = [
    { id: 'improvements', label: 'Improvements' },
    { id: 'synergy', label: 'Synergy' },
    { id: 'gear', label: 'Gear' },
    { id: 'tree', label: 'Tree' },
    { id: 'simulation', label: 'Simulation' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'improvements':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Prioritized Improvements</h3>
            <div className="space-y-4">
              {analysisResult.prioritizedImprovements.map((item) => {
                const isCompleted = checkedImprovements.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleImprovement(item.id)}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded mt-1 mr-4"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {item.description}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          ROI: {item.roi}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Priority: {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'synergy':
        return (
          <div>
            {analysisResult.synergyAnalysis && analysisResult.synergyAnalysis.insights.length > 0 ? (
              <>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Synergy & Interactions</h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  {analysisResult.synergyAnalysis.insights.map((insight: SynergyInsight, index: number) => (
                    <li key={index}>{insight.description}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="opacity-50 text-center">No synergy insights available for this build.</p>
            )}
          </div>
        );
      case 'gear':
        return <GearContent analysisResult={analysisResult} />;
      case 'tree':
        return <TreeContent analysisResult={analysisResult} />;
      case 'simulation':
        return <SimulationView />;
      default:
        return null;
    }
  };

  return (
    <div className="analysis-dashboard p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg min-h-screen-content">
      <div className="flex justify-center mb-6">
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default AnalysisDashboard;