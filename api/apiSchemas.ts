import { z } from 'zod';

export const analyzePobData = z.object({
  pobData: z.string().min(1),
  pobUrl: z.string().optional(),
  leagueContext: z.string().optional(),
  analysisGoal: z.string().optional(),
});

export const preflightCheckData = z.object({
  pobData: z.string().min(1),
});

export const generateLootFilterData = z.object({
  analysis: z.record(z.any()),
  leagueContext: z.string().optional(),
});

export const runSimulationData = z.object({
  pobData: z.string().min(1),
  pobUrl: z.string().optional(),
  leagueContext: z.string().optional(),
});

export const generateCraftingPlanData = z.object({
  pobData: z.string().min(1),
  slot: z.string().min(1),
  leagueContext: z.string().optional(),
});

export const generateFarmingStrategyData = z.object({
  pobData: z.string().min(1),
  craftingCost: z.union([z.string(), z.number()]).optional(),
  leagueContext: z.string().optional(),
});

export const getMetagamePulseData = z.object({
  leagueContext: z.string().optional(),
});

export const compareAnalysesData = z.object({
  analysisA: z.record(z.any()),
  analysisB: z.record(z.any()),
});

export const generateBuildGuideData = z.object({
  analysis: z.record(z.any()),
});

export const generateLevelingPlanData = z.object({
  pobData: z.string().min(1),
  leagueContext: z.string().optional(),
});

export const tuneBuildForContentData = z.object({
  analysis: z.record(z.any()),
  goal: z.string().min(1),
  leagueContext: z.string().optional(),
});

export const generateBossingStrategyData = z.object({
  analysis: z.record(z.any()),
});

export const scoreBuildForLibraryData = z.object({
  analysis: z.record(z.any()),
});

export const convertPoeJsonToPobXmlData = z.object({
  buildData: z.record(z.any()),
});

export const apiRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('analyzePob'), data: analyzePobData }),
  z.object({ action: z.literal('preflightCheckPob'), data: preflightCheckData }),
  z.object({ action: z.literal('generateLootFilter'), data: generateLootFilterData }),
  z.object({ action: z.literal('runSimulation'), data: runSimulationData }),
  z.object({ action: z.literal('generateCraftingPlan'), data: generateCraftingPlanData }),
  z.object({ action: z.literal('generateFarmingStrategy'), data: generateFarmingStrategyData }),
  z.object({ action: z.literal('getMetagamePulse'), data: getMetagamePulseData }),
  z.object({ action: z.literal('compareAnalyses'), data: compareAnalysesData }),
  z.object({ action: z.literal('generateBuildGuide'), data: generateBuildGuideData }),
  z.object({ action: z.literal('generateLevelingPlan'), data: generateLevelingPlanData }),
  z.object({ action: z.literal('tuneBuildForContent'), data: tuneBuildForContentData }),
  z.object({ action: z.literal('generateBossingStrategy'), data: generateBossingStrategyData }),
  z.object({ action: z.literal('scoreBuildForLibrary'), data: scoreBuildForLibraryData }),
  z.object({ action: z.literal('convertPoeJsonToPobXml'), data: convertPoeJsonToPobXmlData }),
]);
