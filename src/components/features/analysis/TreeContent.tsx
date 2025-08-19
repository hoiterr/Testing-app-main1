

import React from 'react';
import { PoeAnalysisResult } from '@/types';

interface TreeContentProps {
  analysisResult: PoeAnalysisResult;
}

const TreeContent: React.FC<TreeContentProps> = ({ analysisResult }) => {
  if (!analysisResult || !analysisResult.passiveTreeAnalysis || !analysisResult.passiveTreeAnalysis.nodesToAllocate || analysisResult.passiveTreeAnalysis.nodesToAllocate.length === 0) { // Adjusted to passiveTreeAnalysis
    return <p className="text-gray-600 dark:text-gray-400">No tree improvements suggested.</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Passive Tree Improvements</h3>
      {analysisResult.passiveTreeAnalysis.nodesToAllocate.length > 0 ? ( // Adjusted to passiveTreeAnalysis
        <div className="space-y-4">
          {analysisResult.passiveTreeAnalysis.nodesToAllocate.map((improvement: any, index: number) => ( // Adjusted to passiveTreeAnalysis
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{improvement.summary}</h4> {/* Changed .name to .summary */}
              <p className="text-gray-700 dark:text-gray-300">Details: {improvement.details}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No tree improvements suggested.</p>
      )}
    </div>
  );
};

export default TreeContent;