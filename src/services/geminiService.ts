
import { GoogleGenAI, Chat } from "@google/genai";
import { PoeAnalysisResult, GroundingMetadata, SimulationResult, CraftingPlan, FarmingStrategy, MetagamePulseResult, PreflightCheckResult, AnalysisGoal, LootFilter, LevelingPlan, TuningGoal, TuningResult, BossingStrategyGuide, AIScores, PoeApiBuildData } from '../types';
import { logService } from './logService';
import { configService } from './configService'; // New import

// Lazily initialize the GoogleGenAI client to avoid throwing during module import
let ai: GoogleGenAI | null = null;
const getAi = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = configService.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured. For serverless functions, set it in Vercel Project Settings. For client-only chat, set VITE_GEMINI_API_KEY.');
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

const safeJsonParse = <T>(text: string): T => {
    try {
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');

        if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
             const arrayStartIndex = text.indexOf('[');
             const arrayEndIndex = text.lastIndexOf(']');
             if(arrayStartIndex !== -1 && arrayEndIndex !== -1 && arrayEndIndex > arrayStartIndex) {
                const arrayString = text.substring(arrayStartIndex, arrayEndIndex + 1);
                return JSON.parse(arrayString) as T;
             }
            logService.error("Failed to find JSON object or array in AI response.", { text });
            throw new Error("Failed to find a valid JSON object or array in the AI response.");
        }
        
        const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
        return JSON.parse(jsonString) as T;
    } catch (parseError) {
        logService.error("Failed to parse extracted JSON.", { text, error: parseError });
        throw new Error("Failed to parse the JSON object from the AI response even after extraction.");
    }
};

export const preflightCheckPob = async (pobData: string): Promise<PreflightCheckResult> => {
    logService.info("preflightCheckPob started");
    const prompt = `
        You are an extremely fast Path of Building data parser. Your only goal is to identify the character's core identity from the raw PoB XML data.
        Do not perform any analysis.
        You MUST respond ONLY with a single, valid JSON object. Do not include any text, markdown, or commentary before or after it.

        The JSON structure MUST be as follows:
        {
          "characterClass": "string",
          "ascendancy": "string",
          "mainSkill": "string (The primary damage skill used)",
          "level": "number"
        }

        --- RAW PoB XML DATA ---
        ${pobData}
        ---
    `;
    try {
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 } // Disable thinking for max speed
            }
        });
        const rawText = response.text?.trim() ?? '';
        const result = safeJsonParse<PreflightCheckResult>(rawText);
        logService.info("preflightCheckPob completed successfully.");
        return result;
    } catch (error) {
        logService.error("Error in preflightCheckPob service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get a valid pre-flight check from the AI. Details: ${errorMessage}`);
    }
};


export const analyzePob = async (pobData: string, pobUrl: string, leagueContext: string, analysisGoal: AnalysisGoal): Promise<PoeAnalysisResult> => {
    logService.info("analyzePob started", { leagueContext, pobUrl, analysisGoal });
    const prompt = `
        You are a world-class expert on the video game Path of Exile. You have deep knowledge of all game mechanics, items, skills, and the current meta.
        Your goal is to analyze a player's build based on the provided data and give actionable, prioritized advice that builds trust and provides deep insight.

        CONTEXT: Tailor your analysis, suggestions, and especially your price estimates to the following context:
        - Game League Stage: "${leagueContext}"
        - Player's Goal: "${analysisGoal}" (e.g., if 'Bossing', prioritize single-target damage and survivability suggestions).
        Use Google Search to find current prices and meta data relevant to this context.

        You MUST respond ONLY with a single, valid JSON object. Do not include any text before or after the JSON object.
        
        The JSON structure MUST be as follows:
        {
          "buildTitle": "string",
          "overallSummary": "string (Use [GOOD]positive point[/GOOD] for positives and [BAD]area for improvement[/BAD] for negatives. Mention recent patch impacts found via Google Search.)",
          "keyStats": {
            "topStrength": "string (A short phrase)", 
            "biggestWeakness": "string (A short phrase)",
            "offenseScore": "number (0-100)", "defenseScore": "number (0-100)", "speedScore": "number (0-100)"
          },
          "prioritizedImprovements": [{"id": "string (slug-like-id)", "priority": "Easy"|"Medium"|"Hard", "description": "string", "roi": "High"|"Medium"|"Low"|"N/A", "confidence": "number (0-100)"}],
          "synergyAnalysis": { "summary": "string", "insights": [{"type": "Synergy"|"Anti-Synergy", "description": "string"}]},
          "defensiveLayers": [{"name": "string", "value": "number", "effectiveness": "number (0-100)", "notes": "string"}],
          "gearAnalysis": [{
            "slot": "string", "itemName": "string",
            "goodMods": [{"text": "string", "tier": "string"}], "badMods": [{"text": "string", "tier": "string"}],
            "bestInSlotMods": [{"text": "string", "has": boolean}],
            "suggestedItem": { "name": "string", "mods": ["string"] },
            "suggestions": [{"summary": "string", "details": "string (include crafting steps)"}], 
            "upgradePrice": "string",
            "projectedImpact": [{"stat": "string e.g. Total DPS", "change": "string e.g. +15.2%"}],
            "metaValidation": {"text": "string e.g. Used by 78% of Tricksters on poe.ninja", "source": "poe.ninja"}
          }],
          "gemAnalysis": [{"setupName": "string", "gems": ["string"], "suggestions": [{"summary": "string", "details": "string"}]}],
          "flaskAnalysis": [{"flaskName": "string", "suggestions": [{"summary": "string", "details": "string"}]}],
          "passiveTreeAnalysis": {
            "summary": "string",
            "nodesToAllocate": [{"summary": "string", "details":"string"}], "nodesToRespec": [{"summary": "string", "details":"string"}],
            "suggestedTreeUrl": "string (pobb.in URL with changes)",
            "projectedImpact": [{"stat": "string", "change": "string"}],
            "metaValidation": {"text": "string", "source": "string"}
          },
          "guidedReview": [{"title": "string", "explanation": "string", "relatedTab": "gear"|"tree"|"gems"|"flasks"}]
        }
        
        CRITICAL INSTRUCTIONS FOR ADVANCED FEATURES:
        1.  **DEFENSIVE LAYERS**: You MUST populate the 'defensiveLayers' array. Analyze key defensive stats (Armour, Evasion, Spell Suppression, Block, Resistances, etc.). For each, provide its numeric value, an effectiveness score from 0-100, and a short note on its status.
        2.  **IMPACT PROJECTION & META-VALIDATION**: For significant gear/tree suggestions, you MUST calculate and add 'projectedImpact' and use Google Search to add 'metaValidation' by checking poe.ninja data.
        3.  **SYNERGY & ANTI-SYNERGY**: In 'synergyAnalysis', provide expert-level insights into non-obvious interactions.
        4.  **AI-GUIDED REVIEW**: Create a 'guidedReview' array with 3-5 critical findings to walk the user through the results.

        --- RAW XML DATA ---
        ${pobData}
        ---
        --- PUBLIC BUILD URL ---
        ${pobUrl}
        ---
    `;

    try {
        logService.debug("Sending prompt to Gemini API for analysis.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response from Gemini API.", { rawText });
        
        const analysis = safeJsonParse<PoeAnalysisResult>(rawText);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const groundingMetadata: GroundingMetadata[] = groundingChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web.title)
            .map(web => ({ uri: web.uri, title: web.title.trim() }));
        
        const uniqueMetadata = Array.from(new Map(groundingMetadata.map(item => [item.uri, item])).values());
        analysis.groundingMetadata = uniqueMetadata;

        logService.info("analyzePob completed successfully.");
        return analysis;

    } catch (error) {
        logService.error("Error in analyzePob service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get a valid analysis from the AI service. Details: ${errorMessage}`);
    }
};

export const findUpgrade = async (pobData: string, slot: string, budget: string, leagueContext: string): Promise<{ tradeUrl: string; explanation: string; }> => {
    logService.info("findUpgrade started", { slot, budget, leagueContext });
    const prompt = `
        You are a Path of Exile trade expert. Your goal is to generate a valid URL for the official trade website (pathofexile.com/trade) to help a user find an upgrade.
        
        Analyze the user's build data provided below.
        Identify the most impactful explicit modifiers for the "${slot}" slot that are missing or could be improved.
        Construct a trade search URL that looks for these modifiers.
        The search should be realistic for a budget of approximately "${budget}" in the "${leagueContext}" league context. Use your knowledge and Google Search to estimate current market values to set reasonable stat filters.
        
        You MUST respond ONLY with a single, valid JSON object. No other text or markdown.
        The JSON structure must be:
        {
          "tradeUrl": "string",
          "explanation": "string (A short explanation of what this search is looking for and why it's a good upgrade.)"
        }

        --- Build Data ---
        ${pobData}
        ---
    `;
    try {
        logService.debug("Sending prompt to Gemini for upgrade finder.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json"
            }
        });
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response from Gemini for upgrade finder.", { rawText });
        const result = safeJsonParse<{ tradeUrl: string; explanation: string; }>(rawText);

        if (!result.tradeUrl || !result.tradeUrl.includes('pathofexile.com/trade')) {
            throw new Error("AI did not generate a valid trade URL.");
        }
        logService.info("findUpgrade completed successfully.");
        return result;
    } catch (error) {
        logService.error("Error in findUpgrade service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`AI trade search failed. Details: ${errorMessage}`);
    }
};

export const generateLootFilter = async (analysis: PoeAnalysisResult, leagueContext: string): Promise<LootFilter> => {
    logService.info("generateLootFilter started", { leagueContext });
    const prompt = `
        You are an expert Path of Exile loot filter creator. Your task is to generate a custom loot filter based on a provided build analysis.
        The filter should be written in a syntax compatible with FilterBlade.xyz (e.g., using blocks like "Show", "Hide", setting "SetFontSize", "SetBackgroundColor", etc.).
        
        Analyze the JSON data to understand the build's needs:
        1.  Identify key item bases for each gear slot from the 'gearAnalysis'.
        2.  Identify crucial affixes from 'bestInSlotMods' and 'goodMods'.
        3.  Prioritize items that would be significant upgrades.
        
        Generate a filter that:
        - Highlights valuable currency and unique items.
        - Shows and styles desirable item bases for the user's build.
        - Emphasizes items with combinations of important modifiers.
        - Hides general "clutter" items not relevant to the build.
        
        You MUST respond ONLY with a single, valid JSON object. Do not include any text before or after it.
        The JSON structure must be:
        {
          "script": "string (The full loot filter script, with comments explaining key sections.)",
          "notes": "string (A brief summary of what this filter is customized to do for the user's build.)"
        }

        --- Build Analysis JSON ---
        ${JSON.stringify(analysis, null, 2)}
        ---
    `;
    try {
        logService.debug("Sending prompt to Gemini for loot filter generation.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response from Gemini for loot filter.", { rawText });
        const result = safeJsonParse<LootFilter>(rawText);
        logService.info("generateLootFilter completed successfully.");
        return result;
    } catch (error) {
        logService.error("Error in generateLootFilter service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`AI loot filter generation failed. Details: ${errorMessage}`);
    }
};

export const runSimulation = async (pobData: string, pobUrl: string, leagueContext: string): Promise<SimulationResult> => {
    logService.info("runSimulation started", { leagueContext, pobUrl });
    const prompt = `
        You are a top-tier Path of Exile theorycrafter, famous for finding clever and powerful build optimizations.
        Your task is to perform advanced simulations on a given Path of Building configuration to find optimal Timeless Jewel, Cluster Jewel, and alternative tree pathing strategies.
        Use the provided PoB data as the source of truth. The user's current league context is "${leagueContext}".
        You MUST respond ONLY with a single, valid JSON object. Do not include any text before or after it.
        The JSON structure MUST be as follows:
        {
          "timelessJewel": { "socketLocation": "string", "jewelName": "string", "notableStats": ["string"], "summary": "string" },
          "clusterJewels": [{ "type": "Large" | "Medium" | "Small", "baseType": "string", "notablePassives": ["string"], "summary": "string" }],
          "treeOptimizations": [{ "title": "string", "summary": "string", "pros": ["string"], "cons": ["string"] }]
        }
        If you cannot find a meaningful suggestion for a section, omit that key from the response.
        --- RAW XML DATA ---
        ${pobData}
        ---
        --- PUBLIC BUILD URL ---
        ${pobUrl}
        ---
    `;

    try {
        logService.debug("Sending prompt to Gemini API for simulation.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response from Gemini API for simulation.", { rawText });
        const simulationResult = safeJsonParse<SimulationResult>(rawText);
        logService.info("runSimulation completed successfully.");
        return simulationResult;
    } catch (error) {
        logService.error("Error in runSimulation service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get a valid simulation from the AI service. Details: ${errorMessage}`);
    }
};

export const generateCraftingPlan = async (pobData: string, slot: string, leagueContext: string): Promise<CraftingPlan> => {
    logService.info("generateCraftingPlan started", { slot, leagueContext });
    const prompt = `
        You are a Path of Exile crafting master, with comprehensive knowledge of all crafting methods, referencing methodologies from craftofexile.com and affix data from poedb.tw/us.
        Your task is to create a detailed, step-by-step crafting plan for the user's build, targeting the "${slot}" slot.
        The plan must be realistic and cost-effective for the specified league context: "${leagueContext}".
        Analyze the provided Path of Building data to understand the build's needs.
        You MUST respond ONLY with a single, valid JSON object.
        
        The JSON structure MUST conform to this schema:
        {
            "type": "object",
            "properties": {
                "targetItemName": {"type": "string"},
                "baseItem": {"type": "string"},
                "itemLevel": {"type": "string"},
                "estimatedTotalCost": {"type": "string"},
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step": {"type": "number"},
                            "action": {"type": "string"},
                            "details": {"type": "string"},
                            "estimatedCost": {"type": "string"}
                        },
                        "required": ["step", "action", "details", "estimatedCost"]
                    }
                }
            },
            "required": ["targetItemName", "baseItem", "itemLevel", "estimatedTotalCost", "steps"]
        }

        --- Path of Building Data ---
        ${pobData}
    `;

    try {
        logService.debug("Sending prompt to Gemini API for crafting plan.", { slot });
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response for crafting plan.", { rawText });
        const plan = safeJsonParse<CraftingPlan>(rawText);
        logService.info("Successfully parsed crafting plan JSON.");
        return plan;
    } catch (error) {
        logService.error("Error in generateCraftingPlan service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`AI crafting simulation failed. Details: ${errorMessage}`);
    }
};

export const generateFarmingStrategy = async (pobData: string, craftingCost: string, leagueContext: string): Promise<FarmingStrategy[]> => {
    logService.info("generateFarmingStrategy started", { craftingCost, leagueContext });
    const prompt = `
        You are a Path of Exile economy expert. Your goal is to recommend profitable farming strategies.
        A user needs to farm currency for a craft that costs approximately "${craftingCost}".
        Their build is provided below. Analyze its strengths (e.g., clear speed, bossing, tankiness).
        Based on the build's strengths and the league context "${leagueContext}", recommend 2-3 distinct, actionable farming strategies.
        For each strategy, provide a link to a pre-filled Atlas Passive Tree on a planner like poeplanner.com.
        
        You MUST respond ONLY with a single, valid JSON array object.

        The JSON structure for each element in the array MUST be:
        {
            "name": "string (e.g., 'Legion & Breach Atlas Farming')",
            "description": "string (How to run the strategy, what scarabs/sextants to use)",
            "atlasTreeUrl": "string (A valid URL to an atlas planner)",
            "suitability": "string (Why this strategy is a good fit for the user's build)",
            "estimatedProfit": "string (e.g., '2-3 Divines/hour')"
        }
        
        --- Path of Building Data ---
        ${pobData}
    `;

    try {
        logService.debug("Sending prompt to Gemini API for farming strategy.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response for farming strategy.", { rawText });
        const strategies = safeJsonParse<FarmingStrategy[]>(rawText);
        logService.info("Successfully parsed farming strategies JSON.");
        return strategies;
    } catch (error) {
        logService.error("Error in generateFarmingStrategy service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`AI farming strategy generation failed. Details: ${errorMessage}`);
    }
};

export const getMetagamePulse = async (leagueContext: string): Promise<MetagamePulseResult> => {
    logService.info("getMetagamePulse started", { leagueContext });
    const prompt = `
        You are a Path of Exile market analyst and meta expert. Your task is to provide a "pulse" of the current game state for the "${leagueContext}" context.
        You MUST use Google Search to get the latest data from poe.ninja (e.g., from the Builds, Economy, and Items sections).
        Analyze the data to identify key trends. Provide a concise summary and specific examples.
        You MUST respond ONLY with a single, valid JSON object. Do not include any text before or after the JSON object.
        The JSON object must follow this exact structure:
        {
          "ascendancyTrends": [{ "name": "string", "usage": "string (e.g., '18% of players')", "reason": "string (Why is it popular?)" }],
          "skillTrends": [{ "name": "string", "usage": "string (e.g., 'Used by 12% of players')", "reason": "string (What makes it strong?)" }],
          "marketWatch": [{ "name": "string (Item or currency name)", "priceChange": "string (e.g., '+25% this week')", "reason": "string (Why did the price change?)" }],
          "reportSummary": "string (A brief, one-paragraph overview of the current metagame state.)"
        }
    `;
    try {
        logService.debug("Sending prompt to Gemini API for metagame pulse.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        const rawText = response.text?.trim() ?? '';
        logService.debug("Received raw response from Gemini API for metagame pulse.", { rawText });
        const pulseResult = safeJsonParse<MetagamePulseResult>(rawText);
        logService.info("getMetagamePulse completed successfully.");
        return pulseResult;
    } catch (error) {
        logService.error("Error in getMetagamePulse service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get a valid metagame report from the AI service. Details: ${errorMessage}`);
    }
};

export const compareAnalyses = async (analysisA: PoeAnalysisResult, analysisB: PoeAnalysisResult): Promise<string> => {
    logService.info("compareAnalyses started");
    const prompt = `
        You are a Path of Exile build expert. You will be given two JSON analysis objects for two different builds.
        Your task is to provide a concise, expert comparison between them.
        
        Analyze the key differences in:
        - Defensive layers (e.g., Life, Armour, Evasion, Block, Spell Suppression).
        - Offensive capabilities (e.g., different damage scaling, skills used).
        - Overall strategy and playstyle (e.g., one is a bosser, one is a mapper).
        - Budget and investment level implied by the gear and suggestions.

        Provide a summary in a few paragraphs. Do not just list stats. Explain the trade-offs and what each build excels at relative to the other.

        Build A Title: "${analysisA.buildTitle}"
        Build B Title: "${analysisB.buildTitle}"

        --- Build A JSON ---
        ${JSON.stringify(analysisA, null, 2)}
        ---

        --- Build B JSON ---
        ${JSON.stringify(analysisB, null, 2)}
        ---
    `;

    try {
        logService.debug("Sending prompt to Gemini API for comparison.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const summary = response.text?.trim() ?? '';
        logService.info("compareAnalyses completed successfully.");
        return summary;
    } catch(error) {
        logService.error("Error in compareAnalyses service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`AI comparison failed. Details: ${errorMessage}`);
    }
};


export const createChat = (analysisResult: PoeAnalysisResult): Chat => {
    logService.info("Creating new chat session.");
    const systemInstruction = `
You are a world-class Path of Exile expert continuing a conversation with a player about their build.
You have already provided them with an initial analysis. Your task is to answer their follow-up questions.
Be helpful, concise, and friendly. Use your knowledge of game mechanics to elaborate on your previous points or suggest alternatives.
The original build analysis you provided is below, use it as the primary context for all your answers.
Do not refer to it as "the analysis"; just use the information within it as your established knowledge of their character.
For example, if they ask "why is my helmet bad?", you should look at the helmet's 'badMods' and 'suggestions' in the JSON and explain it in a conversational way.

**NEW CAPABILITY**: If the user asks a "what if" question (e.g., "what if I equip item X?" or "what if I change this skill gem?"), use your deep game knowledge and the provided build context to provide an *estimated* impact on their key stats (like DPS or survivability). You MUST preface your answer by stating that it is an estimation, as you cannot run a full new simulation. For example: "That's an interesting idea! Based on my analysis, swapping to a Farrul's Fur would likely be a significant boost to your DPS... However, you would lose some spell suppression...".

Initial Analysis Context:
${JSON.stringify(analysisResult, null, 2)}
    `;

    const chat = getAi().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return chat;
}

export const generateBuildGuide = async (analysis: PoeAnalysisResult): Promise<string> => {
    logService.info("generateBuildGuide started");
    const prompt = `
        You are an expert Path of Exile player and content creator, known for writing clear and helpful build guides.
        Your task is to convert the following JSON build analysis into a friendly, well-structured build guide in Markdown format.

        The guide should include the following sections:
        - **## Build Overview**: A short, engaging paragraph summarizing the build's playstyle, core mechanics, strengths, and weaknesses.
        - **## Core Stats**: A simple list of the Offense, Defense, and Speed scores.
        - **## Upgrade Path**: A summary of the top 3-5 most important upgrades from the "prioritizedImprovements" section, explained in a user-friendly way.
        - **## Gearing Philosophy**: A brief explanation of the key stats to look for on major gear pieces.
        - **## Passive Tree Strategy**: A summary of the main changes suggested for the passive tree.
        - **## Playstyle Tips**: One or two sentences on how to best play the build.

        Write in a conversational and encouraging tone. Use Markdown formatting (headings, bold text, lists) to make the guide easy to read.
        
        --- ANALYSIS JSON ---
        ${JSON.stringify(analysis, null, 2)}
        ---
    `;

    try {
        logService.debug("Sending prompt to Gemini API for build guide generation.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const guide = response.text?.trim() ?? '';
        logService.info("generateBuildGuide completed successfully.");
        return guide;
    } catch(error) {
        logService.error("Error in generateBuildGuide service call.", { error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`AI guide generation failed. Details: ${errorMessage}`);
    }
};

export const generateLevelingPlan = async (pobData: string, leagueContext: string): Promise<LevelingPlan> => {
    logService.info("generateLevelingPlan started", { leagueContext });
    const prompt = `
        You are a Path of Exile leveling expert. Your task is to generate a comprehensive leveling plan (levels 1-90) for the build specified in the Path of Building data.
        The plan should be easy to follow for a new player. The league context is "${leagueContext}".

        You MUST respond ONLY with a single, valid JSON object. Do not include any text before or after it.
        The JSON structure must be:
        {
          "summary": "string (A brief overview of the leveling strategy)",
          "steps": [
            {
              "levelRange": "string (e.g., '1-12')",
              "primaryTask": "string (e.g., 'Complete Act 1, acquire key gems')",
              "skillSetup": { "skill": "string", "links": ["string"] },
              "notes": "string (Key tips for this level range)"
            }
          ],
          "passiveTreeMilestones": [
            { "level": "number", "description": "string (What the tree focuses on at this stage)", "treeUrl": "string (pobb.in or poeplanner.com URL for this milestone)" }
          ],
          "recommendedUniques": [
            { "summary": "string (Item Name)", "details": "string (Why it's useful for leveling)" }
          ]
        }

        --- Path of Building Data ---
        ${pobData}
    `;
    try {
        logService.debug("Sending prompt to Gemini for leveling plan.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        const plan = safeJsonParse<LevelingPlan>(rawText);
        logService.info("generateLevelingPlan completed successfully.");
        return plan;
    } catch (error) {
        logService.error("Error in generateLevelingPlan", { error });
        throw new Error(`AI leveling plan generation failed. ${(error as Error).message}`);
    }
};

export const tuneBuildForContent = async (analysis: PoeAnalysisResult, goal: TuningGoal, leagueContext: string): Promise<TuningResult> => {
    logService.info("tuneBuildForContent started", { goal, leagueContext });
    const prompt = `
        You are a Path of Exile build specialist. A user wants to tune their existing build for a specific activity: "${goal}".
        Analyze their build data below. Provide a set of specific, actionable swaps (gear, gems, flasks, passive tree points) to optimize for that activity.
        The league context is "${leagueContext}". Keep suggestions practical.

        You MUST respond ONLY with a single, valid JSON object.
        The JSON structure must be:
        {
          "goal": "${goal}",
          "summary": "string (A brief overview of the tuning strategy)",
          "suggestions": [
            {
              "type": "Flask Swap" | "Gear Swap" | "Skill Gem Swap" | "Passive Tree Tweak",
              "suggestion": "string (e.g., 'Swap Granite Flask for a Basalt Flask')",
              "reasoning": "string (Why this change helps with ${goal})"
            }
          ]
        }

        --- Build Analysis JSON ---
        ${JSON.stringify(analysis, null, 2)}
    `;
    try {
        logService.debug("Sending prompt to Gemini for build tuning.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        const result = safeJsonParse<TuningResult>(rawText);
        logService.info("tuneBuildForContent completed successfully.");
        return result;
    } catch (error) {
        logService.error("Error in tuneBuildForContent", { error });
        throw new Error(`AI build tuning failed. ${(error as Error).message}`);
    }
};

export const generateBossingStrategy = async (analysis: PoeAnalysisResult): Promise<BossingStrategyGuide[]> => {
    logService.info("generateBossingStrategy started");
    const prompt = `
        You are a Path of Exile bossing expert. Analyze the provided build and generate specific strategy guides for two major endgame bosses (e.g., The Maven, Sirus, The Eater of Worlds, The Searing Exarch).
        For each boss, explain how the user should leverage their build's strengths and mitigate its weaknesses during the fight. Provide tips on mechanics, flask usage, and positioning.
        The output must be in Markdown format within the JSON.

        You MUST respond ONLY with a single, valid JSON array object.
        The JSON structure for each element in the array must be:
        {
          "bossName": "string (e.g., 'The Maven')",
          "guide": "string (A detailed, Markdown-formatted guide for the fight, tailored to the user's build.)"
        }

        --- Build Analysis JSON ---
        ${JSON.stringify(analysis, null, 2)}
    `;
    try {
        logService.debug("Sending prompt to Gemini for bossing strategy.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        const result = safeJsonParse<BossingStrategyGuide[]>(rawText);
        logService.info("generateBossingStrategy completed successfully.");
        return result;
    } catch (error) {
        logService.error("Error in generateBossingStrategy", { error });
        throw new Error(`AI bossing guide generation failed. ${(error as Error).message}`);
    }
};

export const scoreBuildForLibrary = async (analysis: PoeAnalysisResult): Promise<AIScores> => {
    logService.info("scoreBuildForLibrary started");
    const prompt = `
        You are a Path of Exile build evaluator. Your task is to score a build based on its analysis across three categories: Meta Viability, Budget Efficiency, and Optimization Score.
        - **Meta Viability**: How well does this build align with the current powerful meta strategies? (0-100)
        - **Budget Efficiency**: How much power does this build get for its likely currency investment? (0-100)
        - **Optimization Score**: How well put-together is this specific version of the build? (0-100, where 100 is perfectly optimized)

        Analyze the provided JSON and return only a single JSON object with your scores.

        You MUST respond ONLY with a single, valid JSON object.
        The JSON structure must be:
        {
          "metaViability": "number",
          "budgetEfficiency": "number",
          "optimizationScore": "number"
        }

        --- Build Analysis JSON ---
        ${JSON.stringify(analysis, null, 2)}
    `;
    try {
        logService.debug("Sending prompt to Gemini for build scoring.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const rawText = response.text?.trim() ?? '';
        const result = safeJsonParse<AIScores>(rawText);
        logService.info("scoreBuildForLibrary completed successfully.");
        return result;
    } catch (error) {
        logService.error("Error in scoreBuildForLibrary", { error });
        throw new Error(`AI build scoring failed. ${(error as Error).message}`);
    }
};

export const convertPoeJsonToPobXml = async (buildData: PoeApiBuildData): Promise<string> => {
    logService.info("convertPoeJsonToPobXml started");
    const prompt = `
        You are an expert Path of Building data converter. You will receive JSON data for a character's items and passive skills, sourced directly from the official Path of Exile API.
        Your task is to convert this JSON data into a valid Path of Building XML format.
        You MUST respond ONLY with the raw XML string. Do not include any text, markdown, or commentary before or after it. It must start with "<PathOfBuilding>".

        --- PoE API JSON Data ---
        ${JSON.stringify(buildData, null, 2)}
    `;
    try {
        logService.debug("Sending prompt to Gemini for JSON to XML conversion.");
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // Max speed
            }
        });
        const xml = response.text?.trim() ?? '';
        if (!xml.startsWith('<PathOfBuilding>')) {
            throw new Error("AI did not return valid PoB XML.");
        }
        logService.info("convertPoeJsonToPobXml completed successfully.");
        return xml;
    } catch (error) {
        logService.error("Error in convertPoeJsonToPobXml", { error });
        throw new Error(`AI JSON to XML conversion failed. ${(error as Error).message}`);
    }
};