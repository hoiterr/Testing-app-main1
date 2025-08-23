import { z } from 'zod';

// Base request interface
export interface BaseRequest {
  action: string;
  data?: Record<string, unknown>;
}

// Base schema for common fields
export const baseRequestSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  data: z.record(z.unknown()).optional(),
}) satisfies z.ZodType<BaseRequest>;

// Types for each action's data
interface PreflightCheckData {
  pobData: string;
}

interface AnalyzePobData extends PreflightCheckData {
  pobUrl?: string;
  leagueContext?: string;
  analysisGoal?: string;
}

interface FindUpgradeData extends PreflightCheckData {
  slot: string;
  budget: number | string;
  leagueContext?: string;
}

interface LootFilterData {
  analysis: Record<string, unknown>;
  leagueContext?: string;
}

interface SimulationData extends PreflightCheckData {
  pobUrl?: string;
  leagueContext?: string;
}

interface CraftingPlanData extends PreflightCheckData {
  slot: string;
  leagueContext?: string;
}

interface FarmingStrategyData extends PreflightCheckData {
  craftingCost: number | string;
  leagueContext?: string;
}

interface MetagamePulseData {
  leagueContext?: string;
}

interface CompareAnalysesData {
  analysisA: Record<string, unknown>;
  analysisB: Record<string, unknown>;
}

interface BuildGuideData {
  analysis: Record<string, unknown>;
}

interface LevelingPlanData extends PreflightCheckData {
  leagueContext?: string;
}

interface TuneBuildData extends BuildGuideData {
  goal: string;
  leagueContext?: string;
}

interface BossingStrategyData extends BuildGuideData {}

interface ScoreBuildData extends BuildGuideData {}

interface ConvertPoeJsonData {
  buildData: string;
}

// Schema for PoB analysis
export const pobAnalysisSchema = baseRequestSchema.extend({
  action: z.literal('analyzePob'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
    pobUrl: z.string().url('Invalid URL format').optional(),
    leagueContext: z.string().optional(),
    analysisGoal: z.string().optional(),
  }) satisfies z.ZodType<AnalyzePobData>,
});

// Schema for preflight check
export const preflightCheckSchema = baseRequestSchema.extend({
  action: z.literal('preflightCheckPob'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
  }) satisfies z.ZodType<PreflightCheckData>,
});

// Schema for finding upgrades
export const findUpgradeSchema = baseRequestSchema.extend({
  action: z.literal('findUpgrade'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
    slot: z.string().min(1, 'Slot is required'),
    budget: z.union([
      z.number().min(0, 'Budget must be a positive number'),
      z.string().refine(val => !isNaN(parseFloat(val)), 'Budget must be a number')
    ]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<Omit<FindUpgradeData, 'budget'> & { budget: number | string }>,
});

// Schema for generating loot filters
export const lootFilterSchema = baseRequestSchema.extend({
  action: z.literal('generateLootFilter'),
  data: z.object({
    analysis: z.record(z.unknown()),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<LootFilterData>,
});

// Schema for build simulation
export const simulationSchema = baseRequestSchema.extend({
  action: z.literal('runSimulation'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
    pobUrl: z.string().url('Invalid URL format').optional(),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<SimulationData>,
});

// Additional schemas for other actions
export const craftingPlanSchema = baseRequestSchema.extend({
  action: z.literal('generateCraftingPlan'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
    slot: z.string().min(1, 'Slot is required'),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<CraftingPlanData>,
});

export const farmingStrategySchema = baseRequestSchema.extend({
  action: z.literal('generateFarmingStrategy'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
    craftingCost: z.union([
      z.number().min(0, 'Crafting cost must be a positive number'),
      z.string().refine(val => !isNaN(parseFloat(val)), 'Crafting cost must be a number')
    ]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<Omit<FarmingStrategyData, 'craftingCost'> & { craftingCost: number | string }>,
});

export const metagamePulseSchema = baseRequestSchema.extend({
  action: z.literal('getMetagamePulse'),
  data: z.object({
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<MetagamePulseData>,
});

export const compareAnalysesSchema = baseRequestSchema.extend({
  action: z.literal('compareAnalyses'),
  data: z.object({
    analysisA: z.record(z.unknown()),
    analysisB: z.record(z.unknown()),
  }) satisfies z.ZodType<CompareAnalysesData>,
});

export const buildGuideSchema = baseRequestSchema.extend({
  action: z.literal('generateBuildGuide'),
  data: z.object({
    analysis: z.record(z.unknown()),
  }) satisfies z.ZodType<BuildGuideData>,
});

export const levelingPlanSchema = baseRequestSchema.extend({
  action: z.literal('generateLevelingPlan'),
  data: z.object({
    pobData: z.string().min(1, 'PoB data is required'),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<LevelingPlanData>,
});

export const tuneBuildSchema = baseRequestSchema.extend({
  action: z.literal('tuneBuildForContent'),
  data: z.object({
    analysis: z.record(z.unknown()),
    goal: z.string().min(1, 'Goal is required'),
    leagueContext: z.string().optional(),
  }) satisfies z.ZodType<TuneBuildData>,
});

export const bossingStrategySchema = baseRequestSchema.extend({
  action: z.literal('generateBossingStrategy'),
  data: z.object({
    analysis: z.record(z.unknown()),
  }) satisfies z.ZodType<BossingStrategyData>,
});

export const scoreBuildSchema = baseRequestSchema.extend({
  action: z.literal('scoreBuildForLibrary'),
  data: z.object({
    analysis: z.record(z.unknown()),
  }) satisfies z.ZodType<ScoreBuildData>,
});

export const convertPoeJsonSchema = baseRequestSchema.extend({
  action: z.literal('convertPoeJsonToPobXml'),
  data: z.object({
    buildData: z.string().min(1, 'Build data is required'),
  }) satisfies z.ZodType<ConvertPoeJsonData>,
});

// Union type for all possible request schemas
export const apiRequestSchema = z.discriminatedUnion('action', [
  pobAnalysisSchema,
  preflightCheckSchema,
  findUpgradeSchema,
  lootFilterSchema,
  simulationSchema,
  craftingPlanSchema,
  farmingStrategySchema,
  metagamePulseSchema,
  compareAnalysesSchema,
  buildGuideSchema,
  levelingPlanSchema,
  tuneBuildSchema,
  bossingStrategySchema,
  scoreBuildSchema,
  convertPoeJsonSchema,
]);

// Type for the validated request
export type ApiRequest = z.infer<typeof apiRequestSchema>;

// Type guard to check if an action is valid
export function isValidAction(action: string): action is ApiRequest['action'] {
  return apiRequestSchema.options.some(schema => schema.shape.action.value === action);
}

// Type guard to get the data type for an action
export function getDataForAction<T extends ApiRequest['action']>(
  action: T,
  data: unknown
): Extract<ApiRequest, { action: T }>['data'] {
  const schema = apiRequestSchema.options.find(s => s.shape.action.value === action);
  if (!schema) {
    throw new Error(`No schema found for action: ${action}`);
  }
  return schema.shape.data.parse(data);
}
