
import React from 'react';
import { AnalysisCard } from '../../ui/AnalysisCard';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { useHistory } from '../../../hooks/useHistory';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { useError } from '../../../contexts/ErrorContext'; // New import

const SimulationView: React.FC = () => {
    const { pobInput, pobUrl, leagueContext } = useAnalysis();
    const { handleRunSimulation, simulationResult, isSimulating, simulationError } = useHistory();
    const { showError } = useError(); // Use showError
    
    const onRun = () => {
        handleRunSimulation(pobInput, pobUrl, leagueContext);
    }

    React.useEffect(() => {
        if (simulationError) {
            showError(simulationError, 'error');
        }
    }, [simulationError, showError]);

    if (isSimulating) {
        return (
            <AnalysisCard title="Running Simulations..." icon="brain">
                <div className="flex-col items-center justify-center gap-4" style={{height: '12rem'}}>
                    <Spinner />
                    <p className="text-yellow">AI is theorycrafting...</p>
                    <p className="opacity-70 text-sm">This can take up to a minute.</p>
                </div>
            </AnalysisCard>
        );
    }

    if (!simulationResult) {
        return (
             <AnalysisCard title="Advanced Simulations" icon="brain">
                <div className="text-center">
                    <Icon name="brain" className="mx-auto opacity-50 mb-4" style={{height: '4rem', width: '4rem'}} />
                    <h3 className="text-xl">Unlock Deeper Insights</h3>
                    <p className="mt-2 opacity-70 max-w-md mx-auto">
                        Run advanced AI simulations to discover optimal Timeless Jewels, Cluster Jewel setups, and alternative passive tree pathing.
                    </p>
                    <button onClick={onRun} className="button button-primary mt-6">
                        <Icon name="wand" style={{width: '1.25rem', height: '1.25rem'}}/>
                        <span>Run Advanced Simulations</span>
                    </button>
                </div>
            </AnalysisCard>
        );
    }
    
    const hasResults = simulationResult.timelessJewel || simulationResult.clusterJewels?.length || simulationResult.treeOptimizations?.length;

    return (
        <div className="flex-col gap-6">
             <AnalysisCard title="Simulation Results" icon="brain">
                <div className="flex-row justify-between items-center">
                    <p className="opacity-80">AI has analyzed complex upgrade paths.</p>
                     <button onClick={onRun} className="button button-secondary">Re-run</button>
                </div>
            </AnalysisCard>

            {!hasResults && (
                <AnalysisCard title="No Obvious Optimizations Found" icon="check">
                    <p className="text-center opacity-70">The AI could not find any high-impact simulations for your current build. This may mean it is already highly optimized.</p>
                </AnalysisCard>
            )}

            {simulationResult.timelessJewel && (
                <AnalysisCard title="Timeless Jewel" icon="gem">
                    <h4 className="text-xl text-yellow">{simulationResult.timelessJewel.jewelName}</h4>
                    <p className="text-sm opacity-70 mb-3">Socket: {simulationResult.timelessJewel.socketLocation}</p>
                    <p className="mb-4 pb-4" style={{borderBottom: '1px solid var(--color-divider)'}}>{simulationResult.timelessJewel.summary}</p>
                    <h5 className="font-bold mb-2">Key Stats:</h5>
                    <ul className="flex-col gap-2 text-sky" style={{listStyle: 'none'}}>
                        {simulationResult.timelessJewel.notableStats.map((stat, i) => <li key={i} className="flex-row items-center gap-2"><Icon name="star" style={{width:'1rem', height:'1rem'}} />{stat}</li>)}
                    </ul>
                </AnalysisCard>
            )}

            {simulationResult.clusterJewels && simulationResult.clusterJewels.length > 0 && (
                <AnalysisCard title="Cluster Jewels" icon="tree">
                    <div className="flex-col gap-4">
                        {simulationResult.clusterJewels.map((jewel, i) => (
                             <div key={i} className="card p-4" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
                                <h4 className="text-xl text-yellow">{jewel.type} Cluster Jewel</h4>
                                <p className="text-sm opacity-70 mb-3">Base: {jewel.baseType}</p>
                                <p className="mb-3">{jewel.summary}</p>
                                <h5 className="font-bold mb-2">Ideal Notables:</h5>
                                <ul className="flex-col gap-2 text-sky" style={{listStyle: 'none'}}>
                                   {jewel.notablePassives.map((passive, j) => <li key={j} className="flex-row items-center gap-2"><Icon name="star" style={{width:'1rem', height:'1rem'}} />{passive}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </AnalysisCard>
            )}

            {simulationResult.treeOptimizations && simulationResult.treeOptimizations.length > 0 && (
                <AnalysisCard title="Tree Optimizations" icon="wand">
                    <div className="flex-col gap-4">
                       {simulationResult.treeOptimizations.map((opt, i) => (
                            <div key={i} className="card p-4" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
                                <h4 className="text-xl text-yellow">{opt.title}</h4>
                                <p className="my-3">{opt.summary}</p>
                                <div className="grid gap-4" style={{gridTemplateColumns: '1fr 1fr'}}>
                                    <div>
                                        <h5 className="font-bold text-green mb-2">PROS</h5>
                                        <ul className="text-sm flex-col gap-1" style={{listStyle: 'none'}}>{opt.pros.map((pro, j) => <li key={j}>+ {pro}</li>)}</ul>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-red mb-2">CONS</h5>
                                        <ul className="text-sm flex-col gap-1" style={{listStyle: 'none'}}>{opt.cons.map((con, j) => <li key={j}>- {con}</li>)}</ul>
                                    </div>
                                </div>
                            </div>
                       ))}
                    </div>
                </AnalysisCard>
            )}
        </div>
    );
};

export default SimulationView;