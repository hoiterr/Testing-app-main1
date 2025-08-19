

import React, { useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Icon } from '@/components/ui/Icon';
import { ExpandableSuggestion, ImpactProjection, MetaValidation } from '@/components/features/info/InfoBoxes';

export const TreeContent: React.FC = () => {
    const { analysisResult } = useAnalysis();
    const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');

    const result = analysisResult?.passiveTreeAnalysis;
    if (!result) return null;

    return (
        <div className="flex-col gap-4">
             {result.suggestedTreeUrl && (
                <div className="tree-view-toggle-group">
                    <button onClick={() => setViewMode('list')} className={`tree-view-toggle ${viewMode === 'list' ? 'active' : ''}`}>
                        <Icon name="list" style={{width: '1rem', height: '1rem'}}/> List View
                    </button>
                    <button onClick={() => setViewMode('visual')} className={`tree-view-toggle ${viewMode === 'visual' ? 'active' : ''}`}>
                        <Icon name="eye" style={{width: '1rem', height: '1rem'}}/> Visual View
                    </button>
                </div>
            )}
            
            {viewMode === 'visual' && result.suggestedTreeUrl ? (
                <div className="animate-fade-in">
                    <p className="mb-4">This is an interactive view of the suggested passive tree. Note: Some planner sites may have issues with being embedded.</p>
                     <div className="tree-visualizer-container">
                        <iframe
                            src={result.suggestedTreeUrl}
                            className="tree-visualizer-iframe"
                            title="Suggested Passive Tree Visualizer"
                            sandbox="allow-scripts allow-same-origin"
                        ></iframe>
                    </div>
                     <a href={result.suggestedTreeUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary mt-4">
                        <Icon name="externalLink" style={{width: '1rem', height: '1rem'}}/>
                        <span>Open in New Tab</span>
                    </a>
                </div>
            ) : (
                <div className="animate-fade-in">
                     {result.suggestedTreeUrl && (
                        <div className="text-center mb-6">
                             <a href={result.suggestedTreeUrl} target="_blank" rel="noopener noreferrer" className="button" style={{backgroundColor: 'var(--color-sky)', color: '#000'}}>
                               <Icon name="tree" style={{width: '1.5rem', height: '1.5rem'}}/><span>Open Suggested Tree</span>
                            </a>
                        </div>
                    )}
                    <p className="mb-4 pb-4" style={{borderBottom: '1px solid var(--color-divider)'}}>{result.summary}</p>
                     
                    {(result.projectedImpact || result.metaValidation) && (
                        <div className="mb-4 flex flex-col gap-3">
                             {result.projectedImpact && <ImpactProjection impacts={result.projectedImpact} />}
                             {result.metaValidation && <MetaValidation validation={result.metaValidation} sources={analysisResult?.groundingMetadata} />}
                        </div>
                    )}

                     <div className="tree-grid">
                        <div>
                            <h4 className="flex-row items-center gap-2 text-xl text-green mb-3"><Icon name="check" style={{width: '1.25rem', height: '1.25rem'}} />Allocate</h4>
                            <div className="flex-col gap-2">
                                {result.nodesToAllocate.length > 0 ? (
                                    result.nodesToAllocate.map((sug, i) => <ExpandableSuggestion key={`alloc-${i}`} suggestion={sug} />)
                                ) : ( <p className="opacity-70 text-sm">/No nodes to allocate/.</p> )}
                            </div>
                        </div>
                        <div>
                            <h4 className="flex-row items-center gap-2 text-xl text-red mb-3"><Icon name="x" style={{width: '1.25rem', height: '1.25rem'}} />Respec</h4>
                             <div className="flex-col gap-2">
                                {result.nodesToRespec.length > 0 ? (
                                    result.nodesToRespec.map((sug, i) => <ExpandableSuggestion key={`respec-${i}`} suggestion={sug} />)
                                ) : ( <p className="opacity-70 text-sm">/No nodes to respec/.</p> )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TreeContent;