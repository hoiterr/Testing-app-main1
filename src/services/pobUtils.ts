import * as pako from 'pako';
import { logService } from './logService';

/**
 * Checks if the provided string is a Path of Building share code.
 * @param data The string to check.
 * @returns True if it's a PoB code, false otherwise.
 */
export const isPobCode = (data: string): boolean => {
    // Sanitize by removing all whitespace characters (spaces, newlines, tabs)
    const sanitizedData = data.replace(/\s/g, '');
    // PoB codes are base64 encoded zlib streams. They commonly start with eJ or eN.
    return (sanitizedData.startsWith('eJ') || sanitizedData.startsWith('eN')) && !sanitizedData.startsWith('<');
};

/**
 * Decodes a Path of Building share code into its full XML representation.
 * The process is: Sanitize -> URL-safe Base64 -> standard Base64 + Padding -> zlib decompression.
 * @param code The PoB share code.
 * @returns The decoded XML string.
 * @throws An error if the decoding fails.
 */
export const decodePobCode = (code: string): string => {
    try {
        logService.debug("Decoding PoB code...", {
            len: code?.length ?? 0,
            startsWith: code?.slice(0, 4) ?? ''
        });

        // 1. Sanitize the code by removing all whitespace.
        const sanitizedCode = code.replace(/\s/g, '');
        
        // 2. Replace URL-safe Base64 characters with standard ones.
        let base64String = sanitizedCode.replace(/-/g, '+').replace(/_/g, '/');
        
        // 3. Add Base64 padding if necessary. The length must be a multiple of 4.
        while (base64String.length % 4) {
            base64String += '=';
        }
        
        // 4. Decode from Base64 to a binary string, then to Uint8Array.
        const decodedData = atob(base64String);
        const charData = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; i++) charData[i] = decodedData.charCodeAt(i);

        // 5. Try multiple inflate strategies (zlib default, windowBits variants, and raw) to be robust.
        const tryInflate = (): string => {
            const attempts: Array<() => string> = [
                () => pako.inflate(charData, { to: 'string' }) as string,
                () => pako.inflate(charData, { to: 'string', windowBits: 15 }) as string,
                () => pako.inflate(charData, { to: 'string', windowBits: 31 }) as string, // gzip/zlib autodetect
                () => pako.inflateRaw(charData, { to: 'string' }) as string,
            ];
            const errors: any[] = [];
            for (const attempt of attempts) {
                try {
                    return attempt();
                } catch (err) {
                    errors.push(err);
                }
            }
            // If all attempts failed, throw combined error
            throw new Error(`Inflate failed with ${errors.length} strategies.`);
        };

        const inflated = tryInflate();

        logService.debug("PoB code decoded successfully.");
        return inflated;
    } catch (e) {
        // Do not log full code; include minimal diagnostics only
        logService.error("Failed to decode PoB code.", {
            len: code?.length ?? 0,
            startsWith: code?.slice(0, 4) ?? '',
            error: e
        });
        throw new Error("Invalid or corrupted Path of Building code. Please ensure you copied the entire code correctly.");
    }
};