import type { AIProvider } from '@/types';
import type { GenerationProvider } from './types';
import geminiProvider from './gemini';
import groqProvider from './groq';
import openaiProvider from './openai';
import huggingfaceProvider from './huggingface';
import ollamaProvider from './ollama';

export const providers: Record<AIProvider, GenerationProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  openai: openaiProvider,
  huggingface: huggingfaceProvider,
  ollama: ollamaProvider,
};

export type { GenerationProvider, ProviderErrorCode, TestKeyResult } from './types';
export { ProviderCallError } from './errors';
export { PROVIDER_PRIORITY } from './priority';
