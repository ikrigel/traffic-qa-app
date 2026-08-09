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

    // Create a 768-dimensional embedding using keyword frequency analysis
    // First 200 dimensions: common traffic-related keywords
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
      'red', 'green', 'yellow', 'white', 'black', 'blue', 'line', 'marking',
      'center', 'edge', 'surface', 'asphalt', 'concrete', 'gravel', 'dirt',
      'wet', 'dry', 'slippery', 'icy', 'muddy', 'dusty', 'clean', 'dirty',
      'clear', 'cloudy', 'sunny', 'shady', 'bright', 'dim', 'flashing', 'solid',
      'steady', 'blinking', 'off', 'on', 'working', 'broken', 'damaged', 'intact',
      'full', 'empty', 'heavy', 'light', 'fast', 'slow', 'quick', 'steady',
      'smooth', 'rough', 'straight', 'curved', 'steep', 'flat', 'narrow', 'wide',
      'short', 'long', 'near', 'far', 'close', 'distant', 'next', 'behind',
      'ahead', 'left', 'right', 'center', 'middle', 'front', 'back', 'side',
      'top', 'bottom', 'above', 'below', 'inside', 'outside', 'uphill', 'downhill',
    ];

    // Create embedding: normalize keyword presence
    const embedding: number[] = trafficKeywords.map(keyword => {
      return uniqueWords.has(keyword) ? 1.0 : 0.0;
    });

    // Pad to 768 dimensions with varying values based on text stats
    const textLength = text.length;
    const uniqueWordCount = uniqueWords.size;
    const wordDensity = uniqueWordCount / (textLength / 10 || 1);

    while (embedding.length < 768) {
      // Add supplementary dimensions based on text characteristics
      const supplementaryValue = (wordDensity / 100) % 1.0;
      embedding.push(supplementaryValue);
    }

    console.log('[TEXT-SEARCH] ✅ Text embedding created (768 dimensions)');

    return {
      embedding: embedding.slice(0, 768),
      dimensions: 768,
      provider: 'textsearch',
      model: 'keyword-frequency',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedding failed';
    console.error('[TEXT-SEARCH] ❌ Error:', message);
    throw new Error(`Text search embedding failed: ${message}`);
  }
};
