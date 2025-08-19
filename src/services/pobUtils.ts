
import pako from 'pako';
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
        logService.debug("Decoding PoB code...");

        // 1. Sanitize the code by removing all whitespace.
        const sanitizedCode = code.replace(/\s/g, '');
        
        // 2. Replace URL-safe Base64 characters with standard ones.
        let base64String = sanitizedCode.replace(/-/g, '+').replace(/_/g, '/');
        
        // 3. Add Base64 padding if necessary. The length must be a multiple of 4.
        while (base64String.length % 4) {
            base64String += '=';
        }
        
        // 4. Decode from Base64 to a binary string.
        const decodedData = atob(base64String);

        // 5. Decompress the binary string using pako (zlib inflate).
        // The result is a Uint8Array.
        const charData = decodedData.split('').map(x => x.charCodeAt(0));
        const binData = new Uint8Array(charData);
        const inflated = pako.inflate(binData, { to: 'string' });

        logService.debug("PoB code decoded successfully.");
        return inflated;
    } catch (e) {
        logService.error("Failed to decode PoB code.", { code, error: e });
        throw new Error("Invalid or corrupted Path of Building code. Please ensure you copied the entire code correctly.");
    }
};