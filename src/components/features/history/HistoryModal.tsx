

import React, { useEffect, useRef, useMemo } from 'react';
import { useHistory } from '@/hooks/useHistory';
import { useAnalysis } from '@/hooks/useAnalysis';
import { format } from 'date-fns';
import { PoeAnalysisResult, ComparisonResult, AnalysisSnapshot, ComparisonSelection } from '@/types';
import { useUI } from '@/hooks/useUI';

const SelectionSlot: React.FC<{ slot: 'A' | 'B' }> = ({ slot }) => {
    const { state: { comparisonSelection }, clearComparison } = useHistory();
    const snapshot = slot === 'A' ? comparisonSelection.slotA : comparisonSelection.slotB;

    if (!snapshot) {
        return (
            <div className="comparison-slot">
                <p className="font-bold">SLOT {slot}</p>
                <p className="opacity-70 mt-2">Select an analysis from the list below.</p>
            </div>
        );
    }
    
    return (
        <div className="comparison-slot filled">
            <p className="font-bold text-sky">SLOT {slot}</p>
            <p className="font-bold mt-2">{snapshot.buildTitle}</p>
            <p className="opacity-70 text-sm">Saved: {new Date(snapshot.timestamp).toLocaleDateString()}</p>
            <button onClick={clearComparison} className="button-secondary mt-3 text-red" style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem', alignSelf: 'center'}}>
                Clear
            </button>
        </div>
    );
};

const ProgressionLog: React.FC = () => {
    const { state: { history } } = useHistory();

    const progressionData = useMemo(() => {
        const characters = new Map<string, AnalysisSnapshot[]>();
        // Reverse history to process oldest first
        [...history].reverse().forEach(snapshot => {
            if (!characters.has(snapshot.characterName)) {
                characters.set(snapshot.characterName, []);
            }
            characters.get(snapshot.characterName)!.push(snapshot);
        });

        const characterLogs: { name: string; logs: AnalysisSnapshot[] }[] = [];
        characters.forEach((logs, name) => {
            if (logs.length > 1) {
                characterLogs.push({ name, logs });
            }
        });

        return characterLogs;
    }, [history]);

    if (progressionData.length === 0) {
        return (
            <div className="text-center opacity-50 p-6">
                <p>No character progression found.</p>
                <p className="text-sm mt-1">Save multiple snapshots for the same character to track their progress.</p>
            </div>
        )
    }

    const renderChange = (current: number, prev: number) => {
        const change = current - prev;
        if (change === 0) return <span className="opacity-50">--</span>;
        const isPositive = change > 0;
        return (
            <span className={`progression-change ${isPositive ? 'text-green' : 'text-red'}`}>
                <span>{Math.abs(change)}</span>
            </span>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {progressionData.map(charData => (
                <div key={charData.name} className="card p-4">
                    <h4 className="text-xl text-yellow">{charData.name}</h4>
                    <table className="progression-log-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Offense</th>
                                <th>Defense</th>
                                <th>Speed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charData.logs.map((log, index) => {
                                const prevLog = index > 0 ? charData.logs[index - 1] : null;
                                const stats = log.result.keyStats;
                                const prevStats = prevLog?.result.keyStats;
                                return (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleDateString()}</td>
                                        <td>{stats.offenseScore} {prevStats && renderChange(stats.offenseScore, prevStats.offenseScore)}</td>
                                        <td>{stats.defenseScore} {prevStats && renderChange(stats.defenseScore, prevStats.defenseScore)}</td>
                                        <td>{stats.speedScore} {prevStats && renderChange(stats.speedScore, prevStats.speedScore)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};


export const HistoryModal: React.FC = () => {
    const {
        state: { history, comparisonSelection, isComparing, comparisonResult, comparisonError },
        deleteAnalysisFromHistory,
        handleSelectForComparison,
        handleRunComparison,
        clearComparison
    } = useHistory();
    const { isHistoryVisible, hideHistory } = useUI();
    const { loadSnapshotAndCheckProgression } = useAnalysis();

    const modalRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = React.useState('snapshots');

    useEffect(() => {
        if (!isHistoryVisible) {
            clearComparison();
            return;
        }
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideHistory();
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift+Tab
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        firstElement?.focus();
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isHistoryVisible, hideHistory, clearComparison]);

    if (!isHistoryVisible) return null;

    const onClose = () => hideHistory();

    const onSelectForCompare = (snapshot: AnalysisSnapshot) => {
        setActiveTab('compare');
        if (!comparisonSelection.slotA) {
            handleSelectForComparison('slotA', snapshot);
        } else if (!comparisonSelection.slotB) {
            handleSelectForComparison('slotB', snapshot);
        } else {
            handleSelectForComparison('slotA', snapshot);
        }
    }

    const isReadyToCompare = !!comparisonSelection.slotA && !!comparisonSelection.slotB;

    return (
        <div 
            className="modal-overlay animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="history-modal-title"
        >
            <div 
                ref={modalRef}
                className="modal-content max-w-7xl"
                onClick={e => e.stopPropagation()}
            >
                <header className="modal-header">
                    <div className="flex-row items-center gap-3">
                        <h2 id="history-modal-title" className="text-xl">History &amp; Progression</h2>
                    </div>
                    <button onClick={onClose} className="modal-close-btn" aria-label="Close history modal">
                        X
                    </button>
                </header>
                
                <div className="tabs px-4">
                     <button onClick={() => setActiveTab('snapshots')} className={`tab-button ${activeTab === 'snapshots' ? 'active' : ''}`}>Saved Snapshots</button>
                     <button onClick={() => setActiveTab('progression')} className={`tab-button ${activeTab === 'progression' ? 'active' : ''}`}>Progression Log</button>
                     <button onClick={() => setActiveTab('compare')} className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}>Comparison Tool</button>
                </div>


                <div className="modal-body">
                    {activeTab === 'compare' && (
                        <div className="flex-col gap-4 animate-fade-in">
                            <div className="card p-4">
                                <h3 className="text-lg text-yellow mb-4 flex-row items-center gap-2">
                                    Build Comparison Tool
                                </h3>
                                <p className="text-sm opacity-70 mb-4">Select two saved snapshots from the 'Saved Snapshots' tab to compare them side-by-side.</p>
                                <div className="comparison-slots">
                                    <SelectionSlot slot="A" />
                                    <SelectionSlot slot="B" />
                                </div>
                                <div className="text-center mt-4">
                                    <button 
                                        className="button button-primary"
                                        disabled={!isReadyToCompare || isComparing}
                                        onClick={handleRunComparison}
                                    >
                                        {isComparing ? 'Comparing...' : 'Compare Builds'}
                                    </button>
                                    {comparisonSelection.slotA && (
                                        <button 
                                            onClick={clearComparison} 
                                            disabled={isComparing}
                                            className="button button-secondary ml-4"
                                        >Clear</button>
                                    )}
                                </div>
                            </div>
    
                            {isComparing && (
                                <div className="text-center text-yellow p-4">
                                    Comparing...
                                    <p className="mt-2">AI is comparing snapshots...</p>
                                </div>
                            )}
    
                            {comparisonError && (
                                <div className="text-center text-red p-4">
                                    <p className="font-bold">Comparison Failed</p>
                                    <p>{comparisonError}</p>
                                </div>
                            )}
    
                            {comparisonResult && (
                                <div className="comparison-result-view">
                                    <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Comparison Summary</h4>
                                    <p>{comparisonResult.summary}</p>
                                    <div className="flex space-x-4 mt-4">
                                        <div className="flex-1">
                                            <h5 className="font-bold">Snapshot A: {comparisonResult.snapshotA.buildTitle}</h5>
                                            <p>{new Date(comparisonResult.snapshotA.timestamp).toLocaleString()}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold">Snapshot B: {comparisonResult.snapshotB.buildTitle}</h5>
                                            <p>{new Date(comparisonResult.snapshotB.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'progression' && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg text-yellow mb-4 flex-row items-center gap-2">
                                Character Progression Log
                            </h3>
                            <ProgressionLog />
                        </div>
                    )}
                    
                    {activeTab === 'snapshots' && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg mb-4">Saved Snapshots</h3>
                            {history.length === 0 ? (
                                <div className="text-center opacity-50 py-10">
                                    No saved analyses found.
                                    <p className="text-xl">No saved analyses found.</p>
                                    <p className="text-sm mt-2">You can save an analysis from the main dashboard.</p>
                                </div>
                            ) : (
                                <ul className="flex-col gap-3" style={{listStyle: 'none'}}>
                                    {history.map((snapshot: AnalysisSnapshot) => (
                                        <li key={snapshot.id} className="p-3 flex-row items-center justify-between gap-4 flex-wrap" style={{backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--color-divider)'}}>
                                            <div>
                                                <p className="font-bold">{snapshot.buildTitle}</p>
                                                <p className="text-sm opacity-70">Saved on: {new Date(snapshot.timestamp).toLocaleString()}</p>
                                            </div>
                                            <div className="flex-row items-center gap-2" style={{flexShrink: 0}}>
                                                <button 
                                                    onClick={() => onSelectForCompare(snapshot)}
                                                    className="button button-secondary"
                                                    style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}
                                                >
                                                    Compare
                                                </button>
                                                <button 
                                                    onClick={() => loadSnapshotAndCheckProgression(snapshot, history)}
                                                    className="button text-black"
                                                    style={{backgroundColor: 'var(--color-sky)', padding: '0.5rem 1rem', fontSize: '0.875rem'}}
                                                >
                                                    Load
                                                </button>
                                                <button 
                                                    onClick={() => deleteAnalysisFromHistory(snapshot.id)}
                                                    className="button text-white"
                                                    style={{backgroundColor: 'var(--color-red)', padding: '0.5rem 1rem', fontSize: '0.875rem'}}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};