
import React, { createContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { AnalysisSnapshot, PoeAnalysisResult, ComparisonSelection, ComparisonResult, CraftingPlan, SimulationResult, MetagamePulseResult, PublicBuild, PreflightCheckResult, LeagueContext } from '@/types';
import { logService } from '@/services/logService';
import * as apiClient from '@/services/apiClient';
import { useError } from '@/contexts/ErrorContext'; // New import

// 1. Define the state interface
interface HistoryState {
    history: AnalysisSnapshot[];
    simulationResult: SimulationResult | null;
    isSimulating: boolean;
    simulationError: string | null;
    craftingPlans: { [slot: string]: CraftingPlan | null };
    isCrafting: { [slot: string]: boolean };
    craftingError: { [slot: string]: string | null };
    metagamePulseResult: MetagamePulseResult | null;
    isFetchingMetagame: boolean;
    metagameError: string | null;
    comparisonSelection: ComparisonSelection;
    isComparing: boolean;
    comparisonResult: ComparisonResult | null;
    comparisonError: string | null;
    publicBuilds: PublicBuild[];
    isFetchingPublicBuilds: boolean;
    isPublishing: boolean;
}

// 2. Define action types
type HistoryAction =
    | { type: 'LOAD_HISTORY'; payload: AnalysisSnapshot[] }
    | { type: 'ADD_SNAPSHOT'; payload: AnalysisSnapshot }
    | { type: 'DELETE_SNAPSHOT'; payload: string }
    | { type: 'SET_SIMULATION_STATE'; payload: { isSimulating: boolean; simulationResult?: SimulationResult | null; simulationError?: string | null } }
    | { type: 'SET_CRAFTING_STATE'; payload: { slot: string; isCrafting: boolean; craftingPlan?: CraftingPlan | null; craftingError?: string | null } }
    | { type: 'SET_METAGAME_STATE'; payload: { isFetchingMetagame: boolean; metagamePulseResult?: MetagamePulseResult | null; metagameError?: string | null } }
    | { type: 'SET_COMPARISON_SELECTION'; payload: ComparisonSelection }
    | { type: 'SET_COMPARISON_STATE'; payload: { isComparing: boolean; comparisonResult?: ComparisonResult | null; comparisonError?: string | null } }
    | { type: 'SET_PUBLIC_BUILDS'; payload: PublicBuild[] }
    | { type: 'SET_FETCHING_PUBLIC_BUILDS'; payload: boolean }
    | { type: 'SET_PUBLISHING'; payload: boolean };

// 3. Define the initial state
const initialState: HistoryState = {
    history: [],
    simulationResult: null,
    isSimulating: false,
    simulationError: null,
    craftingPlans: {},
    isCrafting: {},
    craftingError: {},
    metagamePulseResult: null,
    isFetchingMetagame: false,
    metagameError: null,
    comparisonSelection: { slotA: null, slotB: null },
    isComparing: false,
    comparisonResult: null,
    comparisonError: null,
    publicBuilds: [],
    isFetchingPublicBuilds: false,
    isPublishing: false,
};

// 4. Create the reducer function
const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
    switch (action.type) {
        case 'LOAD_HISTORY':
            return { ...state, history: action.payload };
        case 'ADD_SNAPSHOT':
            const updatedHistory = [action.payload, ...state.history].slice(0, 20);
            return { ...state, history: updatedHistory };
        case 'DELETE_SNAPSHOT':
            return { ...state, history: state.history.filter(item => item.id !== action.payload) };
        case 'SET_SIMULATION_STATE':
            return { ...state, ...action.payload };
        case 'SET_CRAFTING_STATE':
            return {
                ...state,
                isCrafting: { ...state.isCrafting, [action.payload.slot]: action.payload.isCrafting },
                craftingPlans: action.payload.craftingPlan ? { ...state.craftingPlans, [action.payload.slot]: action.payload.craftingPlan } : state.craftingPlans,
                craftingError: action.payload.craftingError !== undefined ? { ...state.craftingError, [action.payload.slot]: action.payload.craftingError } : state.craftingError,
            };
        case 'SET_METAGAME_STATE':
            return { ...state, ...action.payload };
        case 'SET_COMPARISON_SELECTION':
            return { ...state, comparisonSelection: action.payload };
        case 'SET_COMPARISON_STATE':
            return { ...state, isComparing: action.payload.isComparing, comparisonResult: action.payload.comparisonResult, comparisonError: action.payload.comparisonError };
        case 'SET_PUBLIC_BUILDS':
            return { ...state, publicBuilds: action.payload };
        case 'SET_FETCHING_PUBLIC_BUILDS':
            return { ...state, isFetchingPublicBuilds: action.payload };
        case 'SET_PUBLISHING':
            return { ...state, isPublishing: action.payload };
        default:
            return state;
    }
};

// 5. Define the context type
interface HistoryContextType {
    state: HistoryState;
    dispatch: React.Dispatch<HistoryAction>;
    saveCurrentAnalysis: (result: PoeAnalysisResult, preflight: PreflightCheckResult | null, charName: string | undefined) => void;
    loadAnalysisFromHistory: (snapshot: AnalysisSnapshot) => void;
    deleteAnalysisFromHistory: (id: string) => void;
    handleRunSimulation: (pobData: string, pobUrl: string, league: LeagueContext) => Promise<void>;
    handleGenerateCraftingPlan: (pobData: string, slot: string, league: LeagueContext) => Promise<void>;
    handleGenerateFarmingStrategy: (pobData: string, slot: string, league: LeagueContext) => Promise<void>;
    handleGetMetagamePulse: (league: LeagueContext) => Promise<void>;
    handleSelectForComparison: (slot: 'slotA' | 'slotB', snapshot: AnalysisSnapshot) => void;
    handleRunComparison: () => Promise<void>;
    clearComparison: () => void;
    fetchPublicBuilds: () => Promise<void>;
    handlePublishBuild: (snapshot: AnalysisSnapshot) => Promise<void>;
    resetHistory: () => void; // Add resetHistory to context type
}

// 6. Create the context
export const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

// 7. Create the provider component
export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(historyReducer, initialState);
    const { showError } = useError();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        try {
            const savedHistory = localStorage.getItem('poe-ai-optimizer-history');
            if (savedHistory) dispatch({ type: 'LOAD_HISTORY', payload: JSON.parse(savedHistory) });
        } catch (error) { logService.error("Failed to load history", { error }); showError("Failed to load history.", 'error'); }
    };

    const saveCurrentAnalysis = (result: PoeAnalysisResult, preflight: PreflightCheckResult | null, charName: string | undefined) => {
        const characterName = charName || (preflight ? `${preflight.ascendancy}-${preflight.mainSkill}` : result.buildTitle);
        const newSnapshot: AnalysisSnapshot = { id: new Date().toISOString(), timestamp: Date.now(), buildTitle: result.buildTitle, characterName, result: result };
        dispatch({ type: 'ADD_SNAPSHOT', payload: newSnapshot });
        try {
            localStorage.setItem('poe-ai-optimizer-history', JSON.stringify([newSnapshot, ...state.history].slice(0, 20)));
            // alert('Analysis snapshot saved!'); // Removed alert
        } catch (error) { logService.error("Failed to save history", { error }); showError("Failed to save analysis.", 'error'); }
    };

    const loadAnalysisFromHistory = (snapshot: AnalysisSnapshot) => {
        logService.info("Loading analysis from history", { snapshotId: snapshot.id });
    };

    const deleteAnalysisFromHistory = (id: string) => {
        dispatch({ type: 'DELETE_SNAPSHOT', payload: id });
        try {
            localStorage.setItem('poe-ai-optimizer-history', JSON.stringify(state.history.filter(item => item.id !== id)));
        } catch (error) { logService.error("Failed to update history in localStorage", { error }); showError("Failed to delete analysis from history.", 'error'); }
    };

    const handleRunSimulation = useCallback(async (pobData: string, pobUrl: string, league: LeagueContext) => {
        if (!pobData.trim() || !pobUrl.trim()) { showError('Original build data is missing for simulation.', 'warning'); dispatch({ type: 'SET_SIMULATION_STATE', payload: { isSimulating: false, simulationError: 'Original build data is missing.' } }); return; }
        dispatch({ type: 'SET_SIMULATION_STATE', payload: { isSimulating: true, simulationError: null, simulationResult: null } });
        try {
          const result = await apiClient.runSimulation(pobData, pobUrl, league);
          dispatch({ type: 'SET_SIMULATION_STATE', payload: { isSimulating: false, simulationResult: result } });
        } catch (err) {
          logService.error("handleRunSimulation failed.", { error: err });
          showError(`Simulation failed. ${(err as Error).message}`, 'error');
          dispatch({ type: 'SET_SIMULATION_STATE', payload: { isSimulating: false, simulationError: `Simulation failed. ${(err as Error).message}` } });
        }
      }, [showError]);

    const handleGenerateCraftingPlan = useCallback(async (pobData: string, slot: string, league: LeagueContext) => {
        if (!pobData) { showError('Original build data is missing for crafting plan generation.', 'warning'); dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: false, craftingError: 'Original build data is missing.' } }); return; }
        dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: true, craftingError: null } });
        try {
            const plan = await apiClient.generateCraftingPlan(pobData, slot, league);
            dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: false, craftingPlan: plan } });
        } catch (err) {
            logService.error("handleGenerateCraftingPlan failed", { slot, error: err });
            showError(`Crafting plan generation for ${slot} failed. ${(err as Error).message}`, 'error');
            dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: false, craftingError: (err as Error).message } });
        }
    }, [showError]);

    const handleGenerateFarmingStrategy = useCallback(async (pobData: string, slot: string, league: LeagueContext) => {
        const plan = state.craftingPlans[slot];
        if (!pobData || !plan) { showError('Crafting plan or original build data is missing for farming strategy generation.', 'warning'); dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: false, craftingError: 'Missing data for farming strategy.' } }); return; }
        dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: true } });
        try {
            const strategies = await apiClient.generateFarmingStrategy(pobData, plan.estimatedTotalCost, league);
            dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: false, craftingPlan: { ...plan, farmingStrategies: strategies } } });
        } catch (err) {
            logService.error("handleGenerateFarmingStrategy failed", { slot, error: err });
            showError(`Farming strategy generation for ${slot} failed. ${(err as Error).message}`, 'error');
            dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot, isCrafting: false, craftingError: `Farming strategy generation failed. ${(err as Error).message}` } });
        }
    }, [state.craftingPlans, showError]);

    const handleGetMetagamePulse = useCallback(async (league: LeagueContext) => {
        dispatch({ type: 'SET_METAGAME_STATE', payload: { isFetchingMetagame: true, metagameError: null, metagamePulseResult: null } });
        try {
          const result = await apiClient.getMetagamePulse(league);
          dispatch({ type: 'SET_METAGAME_STATE', payload: { isFetchingMetagame: false, metagamePulseResult: result } });
        } catch (err) {
          logService.error("handleGetMetagamePulse failed.", { error: err });
          showError(`Failed to fetch metagame data. ${(err as Error).message}`, 'error');
          dispatch({ type: 'SET_METAGAME_STATE', payload: { isFetchingMetagame: false, metagameError: `Failed to fetch metagame data. ${(err as Error).message}` } });
        }
      }, [showError]);

    const handleSelectForComparison = useCallback((slot: 'slotA' | 'slotB', snapshot: AnalysisSnapshot) => {
        dispatch({ type: 'SET_COMPARISON_SELECTION', payload: { ...state.comparisonSelection, [slot]: snapshot } });
        dispatch({ type: 'SET_COMPARISON_STATE', payload: { comparisonResult: null, comparisonError: null } });
    }, [state.comparisonSelection]);

    const clearComparison = useCallback(() => {
        dispatch({ type: 'SET_COMPARISON_SELECTION', payload: { slotA: null, slotB: null } });
        dispatch({ type: 'SET_COMPARISON_STATE', payload: { isComparing: false, comparisonResult: null, comparisonError: null } });
    }, []);

    const handleRunComparison = useCallback(async () => {
        if (!state.comparisonSelection.slotA || !state.comparisonSelection.slotB) {
            showError("Please select two analyses to compare.", 'warning');
            dispatch({ type: 'SET_COMPARISON_STATE', payload: { isComparing: false, comparisonError: "Please select two analyses to compare." } });
            return;
        }
        dispatch({ type: 'SET_COMPARISON_STATE', payload: { isComparing: true, comparisonResult: null, comparisonError: null } });
        try {
            const summary = await apiClient.compareAnalyses(state.comparisonSelection.slotA.result, state.comparisonSelection.slotB.result);
            dispatch({ type: 'SET_COMPARISON_STATE', payload: { isComparing: false, comparisonResult: { summary, snapshotA: state.comparisonSelection.slotA, snapshotB: state.comparisonSelection.slotB } } });
        } catch (err) {
            logService.error("handleRunComparison failed.", { error: err });
            showError(`Comparison failed. ${(err as Error).message}`, 'error');
            dispatch({ type: 'SET_COMPARISON_STATE', payload: { isComparing: false, comparisonError: `Comparison failed. ${(err as Error).message}` } });
        }
    }, [state.comparisonSelection, showError]);
    
    const fetchPublicBuilds = async () => {
        dispatch({ type: 'SET_FETCHING_PUBLIC_BUILDS', payload: true });
        try {
            const builds = await apiClient.getPublicBuilds();
            dispatch({ type: 'SET_PUBLIC_BUILDS', payload: builds });
        } catch(e) {
            logService.error("Failed to fetch public builds", e);
            showError("Failed to fetch public builds.", 'error');
        } finally {
            dispatch({ type: 'SET_FETCHING_PUBLIC_BUILDS', payload: false });
        }
    };

    const handlePublishBuild = async (snapshot: AnalysisSnapshot) => {
        dispatch({ type: 'SET_PUBLISHING', payload: true });
        try {
            const aiScores = await apiClient.scoreBuildForLibrary(snapshot.result);
            const preflight = await apiClient.preflightCheckPob(snapshot.result.gearAnalysis.map(g => g.itemName).join(', '));
            const newPublicBuild: PublicBuild = {
                id: snapshot.id,
                publishedAt: Date.now(),
                buildTitle: snapshot.buildTitle,
                characterName: snapshot.characterName,
                mainSkill: preflight.mainSkill,
                ascendancy: preflight.ascendancy,
                aiScores,
                snapshot,
            };
            await apiClient.publishBuild(newPublicBuild);
            showError("Build published successfully!", 'info'); // Changed to info/success type
        } catch(e) {
            logService.error("Failed to publish build", e);
            showError("Failed to publish build.", 'error');
        } finally {
            dispatch({ type: 'SET_PUBLISHING', payload: false });
        }
    };

    const resetHistory = useCallback(() => {
        dispatch({ type: 'LOAD_HISTORY', payload: [] });
        dispatch({ type: 'SET_SIMULATION_STATE', payload: { isSimulating: false, simulationResult: null, simulationError: null } });
        dispatch({ type: 'SET_CRAFTING_STATE', payload: { slot: '', isCrafting: false, craftingPlan: null, craftingError: null } }); // Reset all crafting states
        dispatch({ type: 'SET_METAGAME_STATE', payload: { isFetchingMetagame: false, metagamePulseResult: null, metagameError: null } });
        dispatch({ type: 'SET_COMPARISON_SELECTION', payload: { slotA: null, slotB: null } });
        dispatch({ type: 'SET_COMPARISON_STATE', payload: { isComparing: false, comparisonResult: null, comparisonError: null } });
        dispatch({ type: 'SET_PUBLIC_BUILDS', payload: [] });
        dispatch({ type: 'SET_FETCHING_PUBLIC_BUILDS', payload: false });
        dispatch({ type: 'SET_PUBLISHING', payload: false });
        localStorage.removeItem('poe-ai-optimizer-history'); // Clear local storage for history
    }, []);

    const value = {
        state,
        dispatch,
        saveCurrentAnalysis,
        loadAnalysisFromHistory,
        deleteAnalysisFromHistory,
        handleRunSimulation,
        handleGenerateCraftingPlan,
        handleGenerateFarmingStrategy,
        handleGetMetagamePulse,
        handleSelectForComparison,
        handleRunComparison,
        clearComparison,
        fetchPublicBuilds,
        handlePublishBuild,
        resetHistory,
    };

    return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};