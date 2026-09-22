// Map spoken words to symbols in multiple languages
const SYMBOL_MAP: Record<string, string> = {
  // English
  'period': '.',
  'dot': '.',
  'comma': ',',
  'question mark': '?',
  'exclamation mark': '!',
  'exclamation': '!',
  'colon': ':',
  'semicolon': ';',
  'dash': '-',
  'hyphen': '-',
  'slash': '/',
  'backslash': '\\',
  'parenthesis': '(',
  'closing parenthesis': ')',
  'bracket': '[',
  'closing bracket': ']',
  'smiley': '😊',
  'sad face': '☹️',
  'thumbs up': '👍',
  'thumbs down': '👎',
  'heart': '❤️',
  'star': '⭐',
  'fire': '🔥',
  'check': '✓',
  'x': '❌',

  // Hebrew (transliterated)
  'nekuda': '.',
  'nkuda': '.',
  'tapuz': ',',
  'tapus': ',',
  'sheila': '?',
  'sheela': '?',
  'kriah': '!',
  'kria': '!',
  'kolon': ':',
  'koolan': ':',
  'nekudataim': ';',
  'gash': '-',
  'geresh': "'",
  'gershayim': '"',

  // Common misspellings/alternatives
  'point': '.',
  'stop': '.',
  'mark': '!',
  'question': '?',
  'ampersand': '&',
  'at sign': '@',
  'hash': '#',
  'percent': '%',
  'dollar': '$',
  'euro': '€',
  'pound': '£',
};

export function translateSymbols(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Replace symbol words with actual symbols
  Object.entries(SYMBOL_MAP).forEach(([word, symbol]) => {
    // Create regex patterns for whole words (case-insensitive)
    const patterns = [
      new RegExp(`\\b${word}\\b`, 'gi'), // standalone word
      new RegExp(`^${word}\\b`, 'gi'), // at start
      new RegExp(`\\b${word}$`, 'gi'), // at end
    ];

    patterns.forEach(pattern => {
      result = result.replace(pattern, symbol);
    });
  });

  // Clean up: remove duplicate spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

export function hasSymbolWords(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  return Object.keys(SYMBOL_MAP).some(word =>
    new RegExp(`\\b${word}\\b`, 'i').test(text)
  );
}
