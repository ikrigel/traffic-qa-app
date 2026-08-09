/* eslint-disable no-console */
import type { EmbeddingResult } from './types';

export const textSearchEmbed = async (text: string): Promise<EmbeddingResult> => {
  try {
    console.log('[TEXT-SEARCH] 🔍 Starting text-based keyword embedding...');
    console.log('[TEXT-SEARCH] 📊 Text length:', text.length);

    // Create a simple hash-based embedding for text-based search
    // This doesn't use semantic similarity but allows keyword matching
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);

    console.log('[TEXT-SEARCH] 📝 Extracted', uniqueWords.size, 'unique keywords');

    // Create a 384-dimensional embedding using keyword frequency analysis
    // Each dimension represents a common traffic-related keyword
    const trafficKeywords = [
      'speed', 'limit', 'drive', 'road', 'car', 'vehicle', 'traffic', 'sign',
      'light', 'turn', 'lane', 'stop', 'yield', 'overtake', 'safe', 'accident',
      'helmet', 'seat', 'belt', 'child', 'license', 'permit', 'insurance',
      'document', 'requirement', 'regulation', 'rule', 'law', 'violation',
      'fine', 'penalty', 'warning', 'distance', 'meter', 'kilometer',
      'hour', 'minute', 'weather', 'rain', 'snow', 'ice', 'fog', 'dark',
      'night', 'day', 'visibility', 'brake', 'accelerate', 'wheel', 'tire',
      'engine', 'fuel', 'parking', 'intersection', 'pedestrian', 'cyclist',
      'motorcycle', 'truck', 'bus', 'ambulance', 'police', 'emergency',
      'highway', 'street', 'alley', 'bridge', 'tunnel', 'curve', 'hill',
      'slope', 'grade', 'intersection', 'roundabout', 'crosswalk', 'median',
      'shoulder', 'sidewalk', 'curb', 'ditch', 'barrier', 'guardrail',
    ];

    // Create embedding: normalize keyword presence
    const embedding: number[] = trafficKeywords.map(keyword => {
      return uniqueWords.has(keyword) ? 1.0 : 0.0;
    });

    // Pad to 384 dimensions
    while (embedding.length < 384) {
      embedding.push(0);
    }

    console.log('[TEXT-SEARCH] ✅ Text embedding created (384 dimensions)');

    return {
      embedding: embedding.slice(0, 384),
      dimensions: 384,
      provider: 'textsearch',
      model: 'keyword-frequency',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[TEXT-SEARCH] ❌ Error:', message);
    throw new Error(`Text search embedding failed: ${message}`);
  }
};
