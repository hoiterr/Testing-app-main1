// Core PoE Analysis Types
export type AnalysisGoal = 'All-Rounder' | 'Mapping' | 'Bossing' | 'League Starter' | 'Endgame' | 'Hardcore' | 'SSF';

export interface PreflightCheckResult {
  characterClass: string;
  ascendancy: string;
  mainSkill: string;
  level: number;
}

export interface PoeAnalysisResult {
  buildOverview: {
    className: string;
    ascendancy: string;
    mainSkill: string;
    playstyle: string;
    damageType: string[];
    defenseLayers: string[];
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
  gear: {
    weapons: string[];
    bodyArmour: string;
    helmet: string;
    gloves: string;
    boots: string;
    belt: string;
    amulet: string;
    rings: string[];
    flasks: string[];
    jewels: string[];
  };
  skillTree: {
    url: string;
    notableClusters: string[];
    keystones: string[];
  };
  gems: {
    mainLinks: string[];
    auras: string[];
    movement: string[];
    utility: string[];
  };
  budget: {
    totalCost: string;
    mostExpensiveItems: Array<{ name: string; price: string }>;
    budgetAlternatives: Array<{ original: string; alternative: string; price: string }>;
  };
  levelingGuide?: string[];
  bossingTips?: Record<string, string[]>;
  mappingTips?: string[];
  // Additional metadata from AI processing
  groundingMetadata?: Array<{
    uri: string;
    title: string;
  }>;
  // Add buildTitle to match usage in the code
  buildTitle?: string;
}

export interface CraftingPlan {
  itemBase: string;
  requiredInfluences?: string[];
  craftingSteps: Array<{
    step: number;
    description: string;
    cost: string;
    successRate: string;
    requiredMaterials: Array<{ name: string; quantity: number }>;
  }>;
  totalEstimatedCost: string;
  alternativeOptions?: Array<{
    method: string;
    description: string;
    cost: string;
    pros: string[];
    cons: string[];
  }>;
}

export interface FarmingStrategy {
  name: string;
  description: string;
  atlasTreeUrl?: string;
  requiredWatchstones?: string[];
  requiredSextants?: string[];
  expectedReturns: {
    currencyPerHour: string;
    divinesPerHour: string;
    requiredInvestment: string;
    roiTime: string;
  };
  stepByStep: string[];
  tips: string[];
  videoGuideUrl?: string;
}

export interface MetagamePulseResult {
  timestamp: string;
  league: string;
  topBuilds: Array<{
    name: string;
    archetype: string;
    playRate: number;
    winRate: number;
    popularityTrend: 'rising' | 'falling' | 'stable';
    budget: string;
    sampleSize: number;
  }>;
  metaShifts: Array<{
    build: string;
    change: number;
    reason: string;
  }>;
  underratedBuilds: Array<{
    name: string;
    winRate: number;
    playRate: number;
    whyUnderrated: string;
  }>;
}

export interface BossingStrategyGuide {
  bossName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard' | 'Pinnacle';
  mechanics: Array<{
    name: string;
    description: string;
    howToDeal: string;
    videoUrl?: string;
  }>;
  recommendedGear: {
    mandatory: string[];
    recommended: string[];
  };
  gemSwaps: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  flasks: string[];
  tips: string[];
  killVideoUrl?: string;
}

export interface AIScores {
  damage: number;
  defense: number;
  speed: number;
  bossing: number;
  mapping: number;
  survivability: number;
  gearDependency: number;
  leagueStartViability: number;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
}

export interface TuningGoal {
  type: 'damage' | 'defense' | 'speed' | 'balance';
  targetContent?: string;
  budget?: string;
  preferences?: string[];
}

export interface TuningResult {
  originalMetrics: {
    damage: number;
    defense: number;
    speed: number;
  };
  newMetrics: {
    damage: number;
    defense: number;
    speed: number;
  };
  changes: Array<{
    type: 'gem' | 'passive' | 'item' | 'flask' | 'skill';
    from: string;
    to: string;
    reason: string;
    cost?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  estimatedCost: string;
  passiveTreeUrl?: string;
  pobCode?: string;
}

export interface SimulationResult {
  originalDPS: number;
  optimizedDPS: number;
  dpsIncrease: number;
  changes: Array<{
    type: 'jewel' | 'cluster' | 'tree' | 'item' | 'gem';
    description: string;
    dpsImpact: number;
    cost?: string;
    recommended: boolean;
  }>;
  recommendedChanges: string[];
  pobCode: string;
  treeUrl: string;
}

export interface LevelingPlan {
  acts: Array<{
    act: number;
    levelRange: string;
    mainSkill: string;
    supportGems: string[];
    keyPassives: string[];
    questRewards: string[];
    vendorRecipes: string[];
    tips: string[];
  }>;
  campaignBosses: Array<{
    name: string;
    level: number;
    strategy: string;
    recommendedGear: string[];
    gemSetup: string[];
  }>;
  generalTips: string[];
  levelingUniques: Array<{
    name: string;
    slot: string;
    levelReq: number;
    useUntil: string;
    price: string;
  }>;
}

export interface PoeApiBuildData {
  // Define the structure based on PoE API response
  // This is a placeholder - adjust according to actual API response
  [key: string]: any;
}
