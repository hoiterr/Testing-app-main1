

import React from 'react';
import { PoeAnalysisResult } from '@/types';
// import { ExternalLink } from '@/components/ui/ExternalLink';

interface TreeContentProps {
  analysisResult: PoeAnalysisResult;
}

const TreeContent: React.FC<TreeContentProps> = ({ analysisResult }) => {
  if (!analysisResult || !analysisResult.treeImprovements || analysisResult.treeImprovements.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No tree improvements suggested.</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Passive Tree Improvements</h3>
      {analysisResult.treeImprovements.length > 0 ? (
        <div className="space-y-4">
          {analysisResult.treeImprovements.map((improvement: any, index: number) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{improvement.name}</h4>
              <p className="text-gray-700 dark:text-gray-300">{improvement.type}</p>
              <p className="text-gray-700 dark:text-gray-300">Description: {improvement.description}</p>
              {improvement.pobUrl && <a href={improvement.pobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View in PoB</a>}
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