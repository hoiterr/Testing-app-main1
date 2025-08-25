// Minimal API-local types to avoid importing from src/

export type AnalysisGoal =
  | 'All-Rounder'
  | 'Mapping'
  | 'Bossing'
  | 'League Starter'
  | 'Endgame'
  | 'Hardcore'
  | 'SSF';

export type TuningGoal =
  | 'Simulacrum'
  | 'Deep Delve'
  | 'Legion Farming'
  | 'Boss Rushing';

export interface PoeAnalysisResult {
  buildTitle: string;
  overallSummary: string;
  keyStats: {
    topStrength: string;
    biggestWeakness: string;
    offenseScore: number;
    defenseScore: number;
    speedScore: number;
  };
  prioritizedImprovements: Array<{
    id: string;
    priority: 'Easy' | 'Medium' | 'Hard';
    description: string;
    roi: 'High' | 'Medium' | 'Low' | 'N/A';
    confidence: number;
  }>;
  synergyAnalysis?: {
    summary?: string;
    insights?: Array<{ type: 'Synergy' | 'Anti-Synergy'; description: string }>;
  };
  defensiveLayers?: Array<{
    name: string;
    value: number | string;
    effectiveness: number;
    notes?: string;
  }>;
  gearAnalysis: Array<{
    slot: string;
    itemName: string;
    goodMods?: Array<{ text: string; tier: string }>;
    badMods?: Array<{ text: string; tier: string }>;
    bestInSlotMods?: Array<{ text: string; has: boolean }>;
    suggestedItem?: { name: string; mods: string[] };
    suggestions?: Array<{ summary: string; details: string }>;
    upgradePrice?: string;
    projectedImpact?: Array<{ stat: string; change: string }>;
    metaValidation?: { text: string; source: string };
  }>;
  gemAnalysis?: Array<{ setupName: string; gems: string[]; suggestions?: Array<{ summary: string; details: string }> }>;
  flaskAnalysis?: Array<{ flaskName: string; suggestions?: Array<{ summary: string; details: string }> }>;
  passiveTreeAnalysis?: {
    summary?: string;
    nodesToAllocate?: Array<{ summary: string; details: string }>;
    nodesToRespec?: Array<{ summary: string; details: string }>;
    suggestedTreeUrl?: string;
    projectedImpact?: Array<{ stat: string; change: string }>;
    metaValidation?: { text: string; source: string };
  };
  guidedReview?: Array<{ title: string; explanation: string; relatedTab: 'gear' | 'tree' | 'gems' | 'flasks' }>
  groundingMetadata?: Array<{ uri: string; title: string }>;
}

export interface PoeApiBuildData {
  character: unknown;
  // Keep minimal; conversion function can assert deeper fields as needed
}
