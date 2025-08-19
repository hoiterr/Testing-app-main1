export type Priority = 'Easy' | 'Medium' | 'Hard';
export type ROI = 'High' | 'Medium' | 'Low' | 'N/A';
export type AnalysisGoal = 'All-Rounder' | 'Mapping' | 'Bossing';
export type AppView = 'welcome' | 'loading' | 'dashboard' | 'error';
export type LeagueContext = 'League Start' | 'Mid-League' | 'Endgame';

export interface DefensiveLayer {
  name: string; // e.g., 'Armour', 'Evasion', 'Spell Suppression'
  value: number; // The numeric value, e.g., 30000 for armour, 75 for resistance
  effectiveness: number; // A score from 0-100 of how good this value is
  notes: string; // A brief explanation from the AI
}

export interface LootFilter {
  script: string;
  notes: string;
}

export interface DetailedSuggestion {
  summary: string;
  details: string;
}

export interface GeneralSuggestion {
  id: string; // Unique identifier for the suggestion
  priority: Priority;
  description: string;
  roi: ROI;
  confidence: number; // A score from 0-100
}

export interface UserMod {
  text: string;
  tier: string;
}

export interface SuggestedItem {
    name: string;
    mods: string[];
}

export interface BestInSlotMod {
    text: string;
    has: boolean;
}

export interface ImpactProjection {
    stat: string; // e.g., 'Total DPS', 'Effective HP'
    change: string; // e.g., '+15.2%', '-500'
}

export interface MetaValidation {
    text: string;
    source: string; // e.g., 'poe.ninja'
}

export interface GearPieceAnalysis {
  slot: string;
  itemName: string;
  goodMods: UserMod[];
  badMods: UserMod[];
  suggestions: DetailedSuggestion[];
  bestInSlotMods: BestInSlotMod[];
  upgradePrice: string;
  suggestedItem?: SuggestedItem;
  projectedImpact?: ImpactProjection[];
  metaValidation?: MetaValidation;
}

export interface GemSetupAnalysis {
  setupName: string;
  gems: string[];
  suggestions: DetailedSuggestion[];
}

export interface FlaskAnalysis {
  flaskName: string;
  suggestions: DetailedSuggestion[];
}

export interface PassiveTreeAnalysis {
  summary: string;
  nodesToAllocate: DetailedSuggestion[];
  nodesToRespec: DetailedSuggestion[];
  suggestedTreeUrl?: string;
  projectedImpact?: ImpactProjection[];
  metaValidation?: MetaValidation;
}

export interface GroundingMetadata {
    uri: string;
    title: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export interface PoeCharacter {
    name: string;
    class: string;
    level: number;
}

export interface GuidedReviewStep {
    title: string;
    explanation: string;
    relatedTab: 'gear' | 'tree' | 'gems' | 'flasks';
}

export interface SynergyInsight {
    type: 'Synergy' | 'Anti-Synergy';
    description: string;
}

export interface SynergyAnalysis {
    summary: string;
    insights: SynergyInsight[];
}

export interface PoeAnalysisResult {
  buildTitle: string;
  overallSummary: string;
  keyStats: {
    topStrength: string;
    biggestWeakness: string;
    offenseScore: number; // Score from 0-100
    defenseScore: number; // Score from 0-100
    speedScore: number;   // Score from 0-100
  };
  gearAnalysis: GearPieceAnalysis[];
  gemAnalysis: GemSetupAnalysis[];
  flaskAnalysis: FlaskAnalysis[];
  passiveTreeAnalysis: PassiveTreeAnalysis;
  prioritizedImprovements: GeneralSuggestion[];
  synergyAnalysis: SynergyAnalysis;
  groundingMetadata?: GroundingMetadata[];
  guidedReview: GuidedReviewStep[];
  defensiveLayers: DefensiveLayer[];
}

export interface AnalysisSnapshot {
    id: string;
    timestamp: number;
    buildTitle: string;
    characterName: string;
    result: PoeAnalysisResult;
}

export interface PreflightCheckResult {
    characterClass: string;
    ascendancy: string;
    mainSkill: string;
    level: number;
}


export interface TimelessJewelSuggestion {
    socketLocation: string;
    jewelName: string;
    notableStats: string[];
    summary: string;
}

export interface ClusterJewelSuggestion {
    type: 'Large' | 'Medium' | 'Small';
    baseType: string;
    notablePassives: string[];
    summary: string;
}

export interface TreeOptimizationSuggestion {
    title: string;
    summary: string;
    pros: string[];
    cons: string[];
}

export interface SimulationResult {
    timelessJewel?: TimelessJewelSuggestion;
    clusterJewels?: ClusterJewelSuggestion[];
    treeOptimizations?: TreeOptimizationSuggestion[];
}

export interface CraftingStep {
    step: number;
    action: string;
    details: string;
    estimatedCost: string;
}

export interface FarmingStrategy {
    name: string;
    description: string;
    atlasTreeUrl: string;
    suitability: string;
    estimatedProfit: string;
}

export interface CraftingPlan {
    targetItemName: string;
    baseItem: string;
    itemLevel: string;
    estimatedTotalCost: string;

    steps: CraftingStep[];
    farmingStrategies?: FarmingStrategy[];
}

export interface MetagameTrend {
    name: string;
    usage: string;
    reason: string;
}

export interface MarketMover {
    name: string;
    priceChange: string;
    reason: string;
}

export interface MetagamePulseResult {
    ascendancyTrends: MetagameTrend[];
    skillTrends: MetagameTrend[];
    marketWatch: MarketMover[];
    reportSummary: string;
}

export interface ComparisonSelection {
    slotA: AnalysisSnapshot | null;
    slotB: AnalysisSnapshot | null;
}

export interface ComparisonResult {
    summary: string;
    snapshotA: AnalysisSnapshot;
    snapshotB: AnalysisSnapshot;
}

// --- V3 Feature Types ---

// Leveling Plan
export interface LevelingStep {
    levelRange: string;
    primaryTask: string;
    skillSetup: {
        skill: string;
        links: string[];
    };
    notes: string;
}
export interface PassiveTreeMilestone {
    level: number;
    description: string;
    treeUrl: string;
}
export interface LevelingPlan {
    summary: string;
    steps: LevelingStep[];
    passiveTreeMilestones: PassiveTreeMilestone[];
    recommendedUniques: DetailedSuggestion[];
}

// Build Tuning
export type TuningGoal = 'Simulacrum' | 'Deep Delve' | 'Legion Farming' | 'Boss Rushing';
export interface TuningSuggestion {
    type: 'Flask Swap' | 'Gear Swap' | 'Skill Gem Swap' | 'Passive Tree Tweak';
    suggestion: string;
    reasoning: string;
}
export interface TuningResult {
    goal: TuningGoal;
    summary: string;
    suggestions: TuningSuggestion[];
}

// Public Library
export interface AIScores {
    metaViability: number; // 0-100
    budgetEfficiency: number; // 0-100
    optimizationScore: number; // 0-100
}
export interface PublicBuild {
    id: string; // unique ID
    publishedAt: number;
    buildTitle: string;
    characterName: string;
    mainSkill: string;
    ascendancy: string;

    aiScores: AIScores;
    snapshot: AnalysisSnapshot; // The full analysis data
}

// --- V4 Feature Types ---
export interface BossingStrategyGuide {
    bossName: string;
    guide: string; // Markdown formatted
}

export interface ProgressionAlertData {
    offenseChange: number;
    defenseChange: number;
    speedChange: number;
    milestones: string[];
}

// Fallback data fetching types
export interface PoeApiBuildData {
    items: any;
    passiveSkills: any;
}
