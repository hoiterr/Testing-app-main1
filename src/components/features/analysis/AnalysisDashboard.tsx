

import React, { useState, useEffect } from 'react';
import { Priority, ROI, DetailedSuggestion, GroundingMetadata } from '../../../types';
import { AnalysisCard } from '../../ui/AnalysisCard';
import { Icon, IconName } from '../../ui/Icon';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { useChat } from '../../../hooks/useChat';
import { useUI } from '../../../hooks/useUI';
import { ConfidenceBadge, ExpandableSuggestion } from '../info/InfoBoxes';
import { Spinner } from '../../ui/Spinner';
import { useError } from '../../../contexts/ErrorContext'; // New import

import SimulationView from '../simulation/SimulationView';
import CraftingBench from '../crafting/CraftingBench';
import MetagamePulseView from '../metagame/MetagamePulseView';
import TreeContent from './TreeContent';
import GearContent from './GearContent';
import DefensiveLayersChart from './DefensiveLayersChart';
import LootFilterContent from '../loot_filter/LootFilterContent';
import LevelingPlanView from '../leveling/LevelingPlanView';
import BossingStrategyView from '../bossing/BossingStrategyView';

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const classMap = {
        Easy: 'priority-easy',
        Medium: 'priority-medium',
        Hard: 'priority-hard',
    };
    return <span className={`priority-badge ${classMap[priority]}`}>[{priority.toUpperCase()}]</span>;
}

const ROIBadge: React.FC<{ roi: ROI }> = ({ roi }) => {
    if (roi === 'N/A') return null;
    return <span className="roi-badge">[ROI: {roi.toUpperCase()}]</span>;
}

const GroundingSources: React.FC<{ sources: GroundingMetadata[] }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-6 pt-4" style={{borderTop: '1px solid var(--color-divider)'}}>
            <h4 className="text-sm opacity-50 mb-2">SOURCES</h4>
            <ul className="flex-row flex-wrap gap-2" style={{listStyle: 'none'}}>
                {sources.map((source, index) => (
                    <li key={index}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="chromatic-aberration text-sm text-sky"
                          style={{backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px', textDecoration: 'none'}}
                        >
                            {source.title || new URL(source.uri).hostname}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export const AnalysisDashboard: React.FC = () => {
  const { analysisResult, checkedImprovements, handleToggleImprovement, state: { error, isAnalyzing } } = useAnalysis();
  const { sendProactiveChatMessage } = useChat();
  const { showGuidedReview } = useUI();
  const { showError } = useError(); // Use showError
  const [activeTab, setActiveTab] = useState('improvements');

  useEffect(() => {
    const handler = setTimeout(() => {
        sendProactiveChatMessage(activeTab as any);
    }, 1000); // Send after a short delay
    return () => clearTimeout(handler);
  }, [activeTab, sendProactiveChatMessage]);

  useEffect(() => {
    if (error) {
      showError(error, 'error');
    }
  }, [error, showError]);

  if (isAnalyzing) {
    return (
      <div className="flex-col items-center justify-center h-full text-center">
        <Spinner />
        <p className="text-yellow mt-4">Analyzing build...</p>
      </div>
    );
  }

  if (!analysisResult) return null;

  const tabs: {id: string, label: string, icon: IconName}[] = [
    { id: 'improvements', label: 'Improvements', icon: 'list' },
    { id: 'synergy', label: 'Synergy', icon: 'link' },
    { id: 'gear', label: 'Gear', icon: 'chest' },
    { id: 'defenses', label: 'Defenses', icon: 'shield' },
    { id: 'tree', label: 'Passive Tree', icon: 'tree' },
    { id: 'gems', label: 'Gems', icon: 'gem' },
    { id: 'flasks', label: 'Flasks', icon: 'flask' },
    { id: 'bossing', label: 'Bossing', icon: 'skull' },
    { id: 'leveling', label: 'Leveling', icon: 'level' },
    { id: 'lootFilter', label: 'Loot Filter', icon: 'filter' },
    { id: 'crafting', label: 'Crafting', icon: 'hammer' },
    { id: 'simulations', label: 'Simulations', icon: 'brain' },
    { id: 'metagame', label: 'Metagame', icon: 'pulse' },
  ];
  
  const renderContent = () => {
    switch(activeTab) {
        case 'improvements':
            return (
                <AnalysisCard title="Prioritized Improvements" icon="list">
                    <p className="opacity-70 text-sm mb-4">Here are the most impactful changes you can make. Check them off as you complete them.</p>
                    <div className="flex-col gap-3">
                        {analysisResult.prioritizedImprovements.map((item) => {
                            const isCompleted = checkedImprovements.has(item.id);
                            return (
                                <div key={item.id} className={`improvement-item ${isCompleted ? 'completed' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        id={`improvement-${item.id}`} 
                                        className="improvement-checkbox"
                                        checked={isCompleted}
                                        onChange={() => handleToggleImprovement(item.id)}
                                    />
                                    <div className="flex-grow cursor-pointer" onClick={() => document.getElementById(`improvement-${item.id}`)?.click()}>
                                        <p>{item.description}</p>
                                        <div className="flex-row items-center gap-3 mt-2">
                                            <ROIBadge roi={item.roi} />
                                            <PriorityBadge priority={item.priority} />
                                            <ConfidenceBadge score={item.confidence} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AnalysisCard>
            );
        case 'synergy':
            return (
                 <AnalysisCard title="Synergy & Interactions" icon="link">
                   {analysisResult.synergyAnalysis && analysisResult.synergyAnalysis.insights.length > 0 ? (
                     <>
                        <p className="opacity-70 text-sm mb-4">{analysisResult.synergyAnalysis.summary}</p>
                         <div className="flex-col gap-3">
                            {analysisResult.synergyAnalysis.insights.map((item, index) => {
                                const isSynergy = item.type === 'Synergy';
                                return (
                                    <div key={index} className="flex-row items-start gap-3 p-3" style={{backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '6px', borderLeft: `3px solid ${isSynergy ? 'var(--color-green)' : 'var(--color-red)'}`}}>
                                        <Icon name={isSynergy ? 'check' : 'alertTriangle'} className={isSynergy ? 'text-green' : 'text-red'} style={{width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.2rem'}} />
                                        <div>
                                            <h5 className={`font-bold ${isSynergy ? 'text-green' : 'text-red'}`}>{item.type.replace('-', ' ')}</h5>
                                            <p className="opacity-90">{item.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     </>
                   ) : (
                     <p className="opacity-50 text-center">No synergy insights available for this build.</p>
                   )}
                </AnalysisCard>
            );
        case 'gear':
            return (
                 <AnalysisCard title="Gear Analysis" icon="chest">
                    <GearContent />
                </AnalysisCard>
            );
        case 'defenses':
            return <DefensiveLayersChart />;
        case 'tree':
            return (
                <AnalysisCard title="Passive Tree" icon="tree">
                     <TreeContent />
                </AnalysisCard>
            );
        case 'gems':
            return (
                 <AnalysisCard title="Gem Setups" icon="gem">
                    {analysisResult.gemAnalysis && analysisResult.gemAnalysis.length > 0 ? (
                      <div className="flex-col gap-4">
                          {analysisResult.gemAnalysis.map((setup, i) => (
                              <div key={i} className="card p-4" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
                                  <h4 className="font-bold text-yellow">{setup.setupName}</h4>
                                  <p className="text-sm opacity-70 my-2 pb-2" style={{borderBottom: '1px solid var(--color-divider)'}}>{setup.gems.join(' - ')}</p>
                                  <div className="mt-2 flex-col gap-2">{setup.suggestions.map((sug, i) => <ExpandableSuggestion key={i} suggestion={sug} />)}</div>
                              </div>
                          ))}
                      </div>
                    ) : (
                      <p className="opacity-50 text-center">No gem setup analysis available.</p>
                    )}
                </AnalysisCard>
            );
        case 'flasks':
            return (
                <AnalysisCard title="Flasks" icon="flask">
                     {analysisResult.flaskAnalysis && analysisResult.flaskAnalysis.length > 0 ? (
                       <div className="flex-col gap-4">
                          {analysisResult.flaskAnalysis.map((flask, i) => (
                              <div key={i} className="card p-4" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
                                  <h4 className="font-bold text-yellow">{flask.flaskName}</h4>
                                  <div className="mt-2 flex-col gap-2">{flask.suggestions.map((sug, i) => <ExpandableSuggestion key={i} suggestion={sug} />)}</div>
                              </div>
                          ))}
                      </div>
                     ) : (
                       <p className="opacity-50 text-center">No flask analysis available.</p>
                     )}
                </AnalysisCard>
            );
        case 'bossing': return <BossingStrategyView />;
        case 'leveling': return <LevelingPlanView />;
        case 'lootFilter':
            return <LootFilterContent />;
        case 'crafting':
            return <CraftingBench />;
        case 'simulations':
            return <SimulationView />;
        case 'metagame':
            return <MetagamePulseView />;
        default: return null;
    }
  }

  return (
    <div className="flex-col gap-6">
        {(analysisResult.guidedReview && analysisResult.guidedReview.length > 0) && (
            <div className="card text-center p-6">
                <Icon name="wand" className="mx-auto text-yellow" style={{width: '3rem', height: '3rem'}}/>
                <h3 className="text-2xl mt-3">Feeling Overwhelmed?</h3>
                <p className="opacity-80 mt-2 mb-4 max-w-lg mx-auto">Let the AI walk you through the most important findings from your analysis.</p>
                <button onClick={showGuidedReview} className="button button-primary">
                    <Icon name="star" />
                    <span>Start Guided Review</span>
                </button>
            </div>
        )}

        <AnalysisCard title="Detailed Summary" icon="summary">
            <p className="opacity-90" style={{maxWidth: '80ch', lineHeight: 1.7, whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: analysisResult.overallSummary.replace(/\[GOOD\]/g, '<span class="summary-good">').replace(/\[\/GOOD\]/g, '</span>').replace(/\[BAD\]/g, '<span class="summary-bad">').replace(/\[\/BAD\]/g, '</span>') }} />
            <GroundingSources sources={analysisResult.groundingMetadata || []} />
        </AnalysisCard>
        
        <div className="dashboard-layout">
   <nav className="dashboard-nav" role="tablist" aria-label="Analysis Sections">
                {tabs.map(tab => (
                    <button
   key={tab.id}
   id={`tab-${tab.id}`}
   role="tab"
   aria-selected={activeTab === tab.id}
   aria-controls="analysis-tab-panel"
   onClick={() => setActiveTab(tab.id)}
   className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <Icon name={tab.icon} style={{height: '1.25rem', width: '1.25rem', flexShrink: 0}} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
            <div id="analysis-tab-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="dashboard-content animate-fade-in">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

export default AnalysisDashboard;