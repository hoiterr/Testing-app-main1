
import { 
    PoeCharacter,
    PoeApiBuildData
} from '../types';
import { logService } from './logService';
import { decodePobCode } from './pobUtils';
import { fetchProxied } from "./proxyClient";


// This file handles direct interactions with the Path of Exile website
// via our client-side proxy caller. All AI-related logic is handled by the /api/ai.ts
// Vercel serverless function.

export const getAccountCharacters = async (accountName: string): Promise<PoeCharacter[]> => {
    logService.info("getAccountCharacters started", { accountName });
    const targetUrl = `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(accountName)}`;
    try {
        const response = await fetchProxied(targetUrl);
        const contentType = response.headers.get('content-type') || '';
        const responseText = await response.text();
        
        try {
            const data = contentType.includes('application/json')
                ? JSON.parse(responseText)
                : JSON.parse(responseText.trim());
            
            if (data.error) {
                const errorMessage = data.error.message || (typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);
                 if (errorMessage.toLowerCase().includes("private")) {
                    throw new Error(`Account "${accountName}" profile is private. Please set it to public on pathofexile.com.`);
                }
                throw new Error(`API Error: ${errorMessage}`);
            }

            if (!Array.isArray(data)) {
                logService.error("Received unexpected data from character API", { responseText });
                throw new Error('Received unexpected data from character API.');
            }

            logService.info("getAccountCharacters successful", { count: data.length });
            return data.map((char: any) => ({
                name: char.name,
                class: char.class,
                level: char.level
            }));
        } catch (e) {
            // Many times PoE returns an HTML page (e.g., login) instead of JSON.
            const looksLikeHtml = responseText.trim().startsWith('<') || responseText.includes('<html');
            logService.error("Failed to parse character data as JSON", { responseText: looksLikeHtml ? '[HTML response elided]' : responseText, error: e });
            if (looksLikeHtml) {
                throw new Error(
                    `The Path of Exile website returned HTML instead of JSON. This usually means the profile is private or PoE is blocking the request. ` +
                    `Please ensure your account profile and character tabs are public on pathofexile.com.`
                );
            }
            if (responseText.includes("Account not found")) {
                 throw new Error(`Account "${accountName}" not found. Check the name and make sure your profile is public.`);
            }
            throw new Error("The character API returned an invalid response. The PoE website might be having issues.");
        }
    } catch (error) {
        logService.error("Error in getAccountCharacters service call.", { 
            error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
        });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
    }
};

const getCharacterBuildDataFromPoeApi = async (accountName: string, characterName: string): Promise<PoeApiBuildData> => {
    logService.info("Fallback: Fetching build data directly from PoE API", { accountName, characterName });
    const itemsTargetUrl = `https://www.pathofexile.com/character-window/get-items?character=${encodeURIComponent(characterName)}&accountName=${encodeURIComponent(accountName)}`;
    const passivesTargetUrl = `https://www.pathofexile.com/character-window/get-passive-skills?character=${encodeURIComponent(characterName)}&accountName=${encodeURIComponent(accountName)}`;
    
    try {
        const [itemsResponse, passivesResponse] = await Promise.all([
            fetchProxied(itemsTargetUrl),
            fetchProxied(passivesTargetUrl)
        ]);

        const itemsData = await itemsResponse.json();
        const passivesData = await passivesResponse.json();
        
        return { items: itemsData.items, passiveSkills: passivesData };
    } catch (error) {
        logService.error("Error in getCharacterBuildDataFromPoeApi", { 
             error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
        });
        throw new Error("Failed to fetch character build data directly from the Path of Exile API as a fallback.");
    }
}

export const convertPoeJsonToPobXml = async (buildData: PoeApiBuildData): Promise<string> => {
    logService.info("AI starting conversion from PoE API JSON to PoB XML");
    // This function requires an AI call, so it must be handled by our backend.
    // We will make a request to our own /api/ai endpoint.
     const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convertPoeJsonToPobXml', data: { buildData } }),
    });
    const result = await response.json();
     if (!response.ok) {
        throw new Error(result.error || `XML Conversion failed with status ${response.status}`);
    }
    return result;
}


export const fetchPobFromAccount = async (accountName: string, characterName: string): Promise<{ pobData: string; pobUrl: string; }> => {
    logService.info("fetchPobFromAccount started with pobbin.com", { accountName, characterName });

    const importApiUrl = `https://pobbin.com/api/import?poe_account_name=${encodeURIComponent(accountName)}&character_name=${encodeURIComponent(characterName)}`;
    
    let pobbinUrl = '';

    try {
        const importResponse = await fetchProxied(importApiUrl);
        const importResponseText = await importResponse.text();

        try {
            const importData = JSON.parse(importResponseText);
            if (!importData.url) {
                logService.error("Malformed response from pobbin.com/api/import", { importData });
                throw new Error("pobbin.com did not return a valid URL.");
            }
            pobbinUrl = importData.url;
        } catch (e) {
            logService.error("Failed to parse pobbin.com import response as JSON", { responseText: importResponseText, error: e });

            if (importResponseText.includes("Private profile or invalid character name")) {
                 throw new Error(`Could not import from pobbin.com. Please ensure your character tab is public on pathofexile.com and the character name is correct.`);
            }
             if (importResponseText.includes("was not found")) {
                 throw new Error(`Could not import from pobbin.com because account "${accountName}" was not found. Please check the spelling.`);
            }

            if (importResponseText.trim().startsWith("<!doctype html>")) {
                logService.info("pobbin.com returned HTML. Initiating fallback to direct PoE API fetch.");
                try {
                    const jsonData = await getCharacterBuildDataFromPoeApi(accountName, characterName);
                    const xmlData = await convertPoeJsonToPobXml(jsonData);
                    return { pobData: xmlData, pobUrl: '' }; // No pobbin URL available for fallback
                } catch (fallbackError) {
                    logService.error("Fallback strategy failed", { 
                        error: fallbackError instanceof Error ? { message: fallbackError.message, stack: fallbackError.stack } : String(fallbackError) 
                    });
                    throw new Error("The primary import service (pobbin.com) failed, and the direct API fallback also failed. This may be a temporary issue with the Path of Exile servers.");
                }
            }
            throw new Error("The PoB import service (pobbin.com) returned an invalid (non-JSON) response. The service might be temporarily down.");
        }

        logService.info("Successfully got pobbin URL", { pobbinUrl });

        const rawUrl = `${pobbinUrl}/raw`;
        const rawResponse = await fetchProxied(rawUrl);
        const pobCode = await rawResponse.text();
        
        if (!pobCode) {
            throw new Error("pobbin.com returned an empty build code. The character might not have any skills or items equipped.");
        }

        const pobData = decodePobCode(pobCode);

        logService.info("fetchPobFromAccount successful using pobbin.com");
        return {
           pobData: pobData,
           pobUrl: pobbinUrl
        };

    } catch (error) {
        logService.error("Error in fetchPobFromAccount service call.", { 
            error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
        });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
    }
};