
import React from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useHistory } from '@/hooks/useHistory';
import { useError } from '@/contexts/ErrorContext'; // New import

const SimulationView: React.FC = () => {
    const { pobInput, pobUrl, leagueContext } = useAnalysis();
    const { handleRunSimulation, state: { simulationResult, isSimulating, simulationError } } = useHistory();
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
            <div className="flex justify-center items-center h-full">
                {/* Removed Spinner */}
                {/* <Spinner /> */}
            </div>
        );
    }

    if (!simulationResult) {
        return (
             <div className="text-center">
                    <h3 className="text-xl">Unlock Deeper Insights</h3>
                    <p className="mt-2 opacity-70 max-w-md mx-auto">
                        Run advanced AI simulations to discover optimal Timeless Jewels, Cluster Jewel setups, and alternative passive tree pathing.
                    </p>
                    <button onClick={onRun} className="button button-primary mt-6">
                        <span>Run Advanced Simulations</span>
                    </button>
                </div>
        );
    }
    
    const hasResults = simulationResult.timelessJewel || simulationResult.clusterJewels?.length || simulationResult.treeOptimizations?.length;

    return (
        <div className="flex-col gap-6">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex-row justify-between items-center">
                    <p className="opacity-80">AI has analyzed complex upgrade paths.</p>
                     <button onClick={onRun} className="button button-secondary">Re-run</button>
                </div>
            </div>

            {simulationError && <p className="text-red-500 mb-4">Error: {simulationError}</p>}

            {simulationResult && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Simulation Results</h3>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timeless Jewel</h4>
                        <p className="text-gray-700 dark:text-gray-300">Seed: {simulationResult.timelessJewel.seed}</p>
                        <p className="text-gray-700 dark:text-gray-300">Type: {simulationResult.timelessJewel.type}</p>
                        <h5 className="font-medium text-gray-800 dark:text-gray-200">Notable Stats:</h5>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                            {simulationResult.timelessJewel.notableStats.map((stat: string, i: number) => (
                                <li key={i}>{stat}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cluster Jewels</h4>
                        <div className="space-y-2">
                            {simulationResult.clusterJewels.map((jewel: any, i: number) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Name: {jewel.name}</p>
                                    <p className="text-gray-700 dark:text-gray-300">Type: {jewel.type}</p>
                                    <p className="text-gray-700 dark:text-gray-300">Passives: {jewel.passives.join(', ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tree Optimizations</h4>
                        <div className="space-y-2">
                            {simulationResult.treeOptimizations.map((opt: any, i: number) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Type: {opt.type}</p>
                                    <p className="text-gray-700 dark:text-gray-300">Description: {opt.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleRunSimulation}
                        disabled={isSimulating}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSimulating ? 'Simulating...' : 'Run Simulation'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SimulationView;