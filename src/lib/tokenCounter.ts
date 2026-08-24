/**
 * Estimate token count for text using multilingual-e5-large tokenizer behavior
 * Hebrew text: ~2-3 chars per token (SentencePiece tokenizer)
 * English text: ~4 chars per token
 * Mixed: average ~3.5 chars per token
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // Count Hebrew characters (Hebrew Unicode range: U+0590 to U+05FF)
  const hebrewMatches = text.match(/[֐-׿]/g);
  const hebrewChars = hebrewMatches ? hebrewMatches.length : 0;
  const totalChars = text.length;
  const nonHebrewChars = totalChars - hebrewChars;

  // Hebrew: ~2.5 chars per token, English: ~4 chars per token
  const hebrewTokens = Math.ceil(hebrewChars / 2.5);
  const englishTokens = Math.ceil(nonHebrewChars / 4);

  return hebrewTokens + englishTokens;
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return String(tokens);
}

export function calculateETA(tokensRemaining: number, tokensPerMinute: number): number {
  if (tokensPerMinute === 0) return 0;
  return Math.ceil((tokensRemaining / tokensPerMinute) * 60 * 1000); // Returns ms
}

export function formatETA(ms: number): string {
  if (ms <= 0) return '0s';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}m`;
}
