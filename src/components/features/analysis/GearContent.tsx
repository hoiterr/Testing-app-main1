

import React from 'react';
import { AnalysisResult } from '@/types';
import { ExternalLink } from '@/components/ui/ExternalLink';

interface GearContentProps {
  analysisResult: AnalysisResult;
}

const GearContent: React.FC<GearContentProps> = ({ analysisResult }) => {
  if (!analysisResult || !analysisResult.gearImprovements || analysisResult.gearImprovements.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No gear improvements suggested.</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Gear Improvements</h3>
      {analysisResult.gearImprovements.length > 0 ? (
        <div className="space-y-4">
          {analysisResult.gearImprovements.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h4>
              <p className="text-gray-700 dark:text-gray-300">{item.type}</p>
              <p className="text-gray-700 dark:text-gray-300">Implicit Mods: {item.implicitMods.join(', ')}</p>
              <p className="text-gray-700 dark:text-gray-300">Explicit Mods: {item.explicitMods.join(', ')}</p>
              <p className="text-gray-700 dark:text-gray-300">Recommended Mods: {item.recommendedMods.join(', ')}</p>
              {item.pobUrl && <ExternalLink href={item.pobUrl}>View in PoB</ExternalLink>}
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