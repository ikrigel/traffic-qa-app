import type { ProviderErrorCode } from './types';

export class ProviderCallError extends Error {
  code: ProviderErrorCode;

  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProviderCallError';
  }
}
