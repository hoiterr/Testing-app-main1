

import React from 'react';
import { PoeAnalysisResult } from '@/types';

interface GearContentProps {
  analysisResult: PoeAnalysisResult;
}

const GearContent: React.FC<GearContentProps> = ({ analysisResult }) => {
  if (!analysisResult || !analysisResult.gearAnalysis || analysisResult.gearAnalysis.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No gear improvements suggested.</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Gear Improvements</h3>
      {analysisResult.gearAnalysis.length > 0 ? (
        <div className="space-y-4">
          {analysisResult.gearAnalysis.map((item: any, index: number) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.itemName}</h4>
              <p className="text-gray-700 dark:text-gray-300">Slot: {item.slot}</p>
              <p className="text-gray-700 dark:text-gray-300">Implicit Mods: {item.implicitMods.map((mod: any) => mod.text).join(', ')}</p>
              <p className="text-gray-700 dark:text-gray-300">Explicit Mods: {item.explicitMods.map((mod: any) => mod.text).join(', ')}</p>
              <p className="text-gray-700 dark:text-gray-300">Suggestions: {item.suggestions.map((sug: any) => sug.summary).join(', ')}</p>
              {item.suggestedItem && <p className="text-gray-700 dark:text-gray-300">Suggested Item: {item.suggestedItem.name}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No gear improvements suggested.</p>
      )}
    </div>
  );
};

export default GearContent;