/**
 * Type definitions for Path of Exile related data structures
 */

export interface PreflightCheckResult {
  characterClass: string;
  ascendancy: string;
  mainSkill: string;
  level: number;
}

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
  synergyAnalysis: {
    summary: string;
    insights: Array<{
      type: 'Synergy' | 'Anti-Synergy';
      description: string;
    }>;
  };
  defensiveLayers: Array<{
    name: string;
    value: number;
    effectiveness: number;
    notes: string;
  }>;
  gearAnalysis: Array<{
    slot: string;
    itemName: string;
    goodMods: Array<{
      text: string;
      tier: string;
    }>;
    badMods: Array<{
      text: string;
      tier: string;
    }>;
    bestInSlotMods: Array<{
      text: string;
      has: boolean;
    }>;
    suggestedItem: {
      name: string;
      mods: string[];
    };
    suggestions: Array<{
      summary: string;
      details: string;
    }>;
    upgradePrice: string;
    projectedImpact: Array<{
      stat: string;
      change: string;
    }>;
    metaValidation: {
      text: string;
      source: string;
    };
  }>;
  gemAnalysis: Array<{
    setupName: string;
    gems: string[];
    suggestions: Array<{
      summary: string;
      details: string;
    }>;
  }>;
  flaskAnalysis: Array<{
    flaskName: string;
    suggestions: Array<{
      summary: string;
      details: string;
    }>;
  }>;
  passiveTreeAnalysis: {
    summary: string;
    nodesToAllocate: Array<{
      summary: string;
      details: string;
    }>;
    nodesToRespec: Array<{
      summary: string;
      details: string;
    }>;
    suggestedTreeUrl: string;
    projectedImpact: Array<{
      stat: string;
      change: string;
    }>;
    metaValidation: {
      text: string;
      source: string;
    };
  };
  guidedReview: Array<{
    title: string;
    explanation: string;
    relatedTab: 'gear' | 'tree' | 'gems' | 'flasks';
  }>;
  groundingMetadata?: Array<{
    uri: string;
    title: string;
  }>;
}

export type AnalysisGoal = 'All-Rounder' | 'Mapping' | 'Bossing';

export interface LootFilter {
  // Add loot filter related types here
}

export interface GroundingMetadata {
  uri: string;
  title: string;
}

export interface SimulationResult {
  // Add simulation result related types here
}

export interface CraftingPlan {
  // Add crafting plan related types here
}

export interface FarmingStrategy {
  // Add farming strategy related types here
}

export interface MetagamePulseResult {
  // Add metagame pulse related types here
}

export interface LevelingPlan {
  // Add leveling plan related types here
}

export interface TuningGoal {
  // Add tuning goal related types here
}

export interface TuningResult {
  // Add tuning result related types here
}

export interface BossingStrategyGuide {
  // Add bossing strategy guide related types here
}

export interface AIScores {
  // Add AI scores related types here
}

export interface PoeApiBuildData {
  // Add PoE API build data related types here
}
