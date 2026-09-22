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
  'nkudah': '.',
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
  'shurah chadasha': '\n',
  'shura chadasha': '\n',
  'new line': '\n',
  'נקודה': '.',
  'שורה חדשה': '\n',

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
    // Escape special regex characters in the word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex patterns for whole words (case-insensitive)
    // For Hebrew and other non-ASCII, use simpler boundary matching
    const patterns = [
      new RegExp(`(^|\\s)${escapedWord}($|\\s)`, 'gi'), // surrounded by word boundaries or spaces
      new RegExp(`^${escapedWord}($|\\s)`, 'gi'), // at start
      new RegExp(`(^|\\s)${escapedWord}$`, 'gi'), // at end
    ];

    patterns.forEach(pattern => {
      result = result.replace(pattern, (_match, prefix = '', suffix = '') => {
        // Preserve the prefix and suffix spaces/boundaries
        return (prefix || '') + symbol + (suffix || '');
      });
    });
  });

  // Clean up: remove duplicate spaces, but preserve newlines
  result = result
    .split('\n') // Split by newlines
    .map(line => line.replace(/\s+/g, ' ').trim()) // Clean up each line
    .join('\n') // Rejoin with newlines
    .trim();

  return result;
}

export function hasSymbolWords(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  return Object.keys(SYMBOL_MAP).some(word =>
    new RegExp(`\\b${word}\\b`, 'i').test(text)
  );
}
