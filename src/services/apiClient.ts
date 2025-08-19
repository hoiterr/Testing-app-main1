

import { 
    PoeAnalysisResult, 
    SimulationResult, 
    CraftingPlan, 
    FarmingStrategy, 
    MetagamePulseResult, 
    PreflightCheckResult, 
    AnalysisGoal, 
    LootFilter, 
    LeagueContext,
    PoeCharacter,
    LevelingPlan,
    TuningGoal,
    TuningResult,
    BossingStrategyGuide,
    AIScores,
    PublicBuild,
    PoeApiBuildData,
} from '../types';
import { Chat } from '@google/genai';
import { createChat } from './geminiService'; // Chat is client-side, so this is fine.
import * as poeApi from './poeApi';

// This is the CLIENT-SIDE entrypoint for Path of Exile API calls.
export const getAccountCharacters = async (accountName: string): Promise<PoeCharacter[]> => {
    return poeApi.getAccountCharacters(accountName);
};

// This is the CLIENT-SIDE entrypoint for Path of Exile API calls.
export const fetchPobFromAccount = async (accountName: string, characterName: string): Promise<{ pobData: string; pobUrl: string; }> => {
    return poeApi.fetchPobFromAccount(accountName, characterName);
};


// --- AI Service Calls ---
// All functions below will call our single, secure /api/ai endpoint.

async function callAiApi<T>(action: string, data: any): Promise<T> {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
    }
    
    return result as T;
}

export const preflightCheckPob = (pobData: string): Promise<PreflightCheckResult> => {
    return callAiApi('preflightCheckPob', { pobData });
};

export const analyzePob = (pobData: string, pobUrl: string, leagueContext: LeagueContext, analysisGoal: AnalysisGoal): Promise<PoeAnalysisResult> => {
    return callAiApi('analyzePob', { pobData, pobUrl, leagueContext, analysisGoal });
};

export const findUpgrade = (pobData: string, slot: string, budget: string, leagueContext: LeagueContext): Promise<{ tradeUrl: string; explanation: string; }> => {
    return callAiApi('findUpgrade', { pobData, slot, budget, leagueContext });
};

export const generateLootFilter = (analysis: PoeAnalysisResult, leagueContext: LeagueContext): Promise<LootFilter> => {
    return callAiApi('generateLootFilter', { analysis, leagueContext });
};

export const runSimulation = (pobData: string, pobUrl: string, leagueContext: LeagueContext): Promise<SimulationResult> => {
    return callAiApi('runSimulation', { pobData, pobUrl, leagueContext });
};

export const generateCraftingPlan = (pobData: string, slot: string, leagueContext: LeagueContext): Promise<CraftingPlan> => {
    return callAiApi('generateCraftingPlan', { pobData, slot, leagueContext });
};

export const generateFarmingStrategy = (pobData: string, craftingCost: string, leagueContext: LeagueContext): Promise<FarmingStrategy[]> => {
    return callAiApi('generateFarmingStrategy', { pobData, craftingCost, leagueContext });
};

export const getMetagamePulse = (leagueContext: LeagueContext): Promise<MetagamePulseResult> => {
    return callAiApi('getMetagamePulse', { leagueContext });
};

export const compareAnalyses = async (analysisA: PoeAnalysisResult, analysisB: PoeAnalysisResult): Promise<string> => {
    // The result here isn't JSON, it's just a string, so we handle it specially.
     const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compareAnalyses', data: { analysisA, analysisB } }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
    }
    return result;
};

export const generateBuildGuide = async (analysis: PoeAnalysisResult): Promise<string> => {
    // The result here isn't JSON, it's just a string, so we handle it specially.
     const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateBuildGuide', data: { analysis } }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
    }
    return result;
};

export const generateLevelingPlan = (pobData: string, leagueContext: LeagueContext): Promise<LevelingPlan> => {
    return callAiApi('generateLevelingPlan', { pobData, leagueContext });
};

export const tuneBuildForContent = (analysis: PoeAnalysisResult, goal: TuningGoal, leagueContext: LeagueContext): Promise<TuningResult> => {
    return callAiApi('tuneBuildForContent', { analysis, goal, leagueContext });
};

export const generateBossingStrategy = (analysis: PoeAnalysisResult): Promise<BossingStrategyGuide[]> => {
    return callAiApi('generateBossingStrategy', { analysis });
};

export const scoreBuildForLibrary = (analysis: PoeAnalysisResult): Promise<AIScores> => {
    return callAiApi('scoreBuildForLibrary', { analysis });
};

const PUBLIC_LIBRARY_KEY = 'poe-ai-public-library';

export const getPublicBuilds = async (): Promise<PublicBuild[]> => {
    try {
        const savedBuilds = localStorage.getItem(PUBLIC_LIBRARY_KEY);
        if (savedBuilds) {
            return JSON.parse(savedBuilds);
        }
    } catch (e) {
        console.error("Failed to load public builds from localStorage", e);
    }
    return [];
};

export const publishBuild = async (build: PublicBuild): Promise<void> => {
    try {
        const currentBuilds = await getPublicBuilds();
        // Avoid duplicates by ID
        const updatedBuilds = [build, ...currentBuilds.filter(b => b.id !== build.id)].slice(0, 50); // Keep max 50 builds
        localStorage.setItem(PUBLIC_LIBRARY_KEY, JSON.stringify(updatedBuilds));
    } catch (e) {
        console.error("Failed to save public build to localStorage", e);
        throw new Error("Could not save build to the public library.");
    }
};

// Chat initialization is a special case. It uses the geminiService directly but only to configure the chat object.
// The actual API calls within the chat will be handled by the client-side Gemini SDK, which is fine as long as the initial context (system prompt) is set up.
// No API key is exposed here.
export { createChat };