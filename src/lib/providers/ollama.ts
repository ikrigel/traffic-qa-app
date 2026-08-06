import { ProviderCallError } from './errors';
import type { GenerationProvider, TestKeyResult } from './types';

const ollamaProvider: GenerationProvider = {
  async generate(_apiKey: string, _systemPrompt: string, _userPrompt: string): Promise<string> {
    throw new ProviderCallError(
      'UNSUPPORTED',
      'Ollama requires a locally accessible server. Server-side chat/grading cannot reach your local Ollama instance on Vercel. This feature will be supported in a future release.'
    );
  },

  async testKey(_apiKey: string): Promise<TestKeyResult> {
    return {
      ok: false,
      errorCode: 'UNSUPPORTED',
      errorMessage: 'Ollama is not yet supported for server-side chat/grading. This feature will be available soon.',
    };
  },
};

export default ollamaProvider;
