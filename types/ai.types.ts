// AI-specific types that aren't part of the main PoE types
export interface GroundingMetadata {
  groundingChunks: Array<{
    chunk: {
      chunkId: string;
      content: string;
      sourceMetadata: {
        source: string;
        timestamp: string;
      };
    };
  }>;
}

export interface LootFilter {
  script: string;
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
