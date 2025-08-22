// Vercel Serverless Function: /api/ai.ts
// This is our secure backend endpoint for all Gemini AI operations.

import { 
    analyzePob,
    preflightCheckPob,
    findUpgrade,
    generateLootFilter,
    runSimulation,
    generateCraftingPlan,
    generateFarmingStrategy,
    getMetagamePulse,
    compareAnalyses,
    generateBuildGuide,
    generateLevelingPlan,
    tuneBuildForContent,
    generateBossingStrategy,
    scoreBuildForLibrary,
    convertPoeJsonToPobXml
} from './geminiService';

export default async function handler(request: any, response: any) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (request.headers['content-type'] && !request.headers['content-type'].includes('application/json')) {
            return response.status(415).json({ error: 'Unsupported Media Type. Use application/json.' });
        }

        // Basic input validation and size limiting
        const body = request.body ?? {};
        const { action, data } = body as { action?: string; data?: any };
        if (!action) {
            return response.status(400).json({ error: 'Missing required field: action' });
        }
        const bodySize = new TextEncoder().encode(JSON.stringify(body)).length;
        if (bodySize > 750_000) { // ~750 KB guard
            return response.status(413).json({ error: 'Request entity too large.' });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000); // 60s timeout

        try {
            // Router to call the appropriate service function based on the 'action'
            switch (action) {
                case 'preflightCheckPob':
                    return response.status(200).json(await preflightCheckPob(data?.pobData));
                case 'analyzePob':
                    return response.status(200).json(await analyzePob(data?.pobData, data?.pobUrl, data?.leagueContext, data?.analysisGoal));
                case 'findUpgrade':
                    return response.status(200).json(await findUpgrade(data?.pobData, data?.slot, data?.budget, data?.leagueContext));
                case 'generateLootFilter':
                    return response.status(200).json(await generateLootFilter(data?.analysis, data?.leagueContext));
                case 'runSimulation':
                    return response.status(200).json(await runSimulation(data?.pobData, data?.pobUrl, data?.leagueContext));
                case 'generateCraftingPlan':
                    return response.status(200).json(await generateCraftingPlan(data?.pobData, data?.slot, data?.leagueContext));
                case 'generateFarmingStrategy':
                    return response.status(200).json(await generateFarmingStrategy(data?.pobData, data?.craftingCost, data?.leagueContext));
                case 'getMetagamePulse':
                    return response.status(200).json(await getMetagamePulse(data?.leagueContext));
                case 'compareAnalyses':
                    return response.status(200).json(await compareAnalyses(data?.analysisA, data?.analysisB));
                case 'generateBuildGuide':
                    return response.status(200).json(await generateBuildGuide(data?.analysis));
                case 'generateLevelingPlan':
                    return response.status(200).json(await generateLevelingPlan(data?.pobData, data?.leagueContext));
                case 'tuneBuildForContent':
                    return response.status(200).json(await tuneBuildForContent(data?.analysis, data?.goal, data?.leagueContext));
                case 'generateBossingStrategy':
                    return response.status(200).json(await generateBossingStrategy(data?.analysis));
                case 'scoreBuildForLibrary':
                    return response.status(200).json(await scoreBuildForLibrary(data?.analysis));
                case 'convertPoeJsonToPobXml':
                    return response.status(200).json(await convertPoeJsonToPobXml(data?.buildData));
                default:
                    return response.status(400).json({ error: `Unknown action: ${action}` });
            }
        } finally {
            clearTimeout(timeout);
        }
    } catch (error: any) {
        console.error(`[api/ai.ts] Error:`, error);
        const isAbort = (error?.name === 'AbortError') || /aborted|timeout/i.test(String(error?.message || ''));
        const status = isAbort ? 504 : 500;
        const message = isAbort ? 'Request timed out.' : `An error occurred on the server: ${error.message}`;
        return response.status(status).json({ error: message });
    }
}
