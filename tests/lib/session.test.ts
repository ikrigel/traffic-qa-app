import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { signSessionToken, verifySessionToken } from '@/lib/session';

describe('Session Management', () => {
  const testPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-very-long';
  });

  describe('signSessionToken', () => {
    it('should create a valid JWT token', () => {
      const token = signSessionToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => signSessionToken(testPayload)).toThrow('Missing JWT_SECRET');
    });
  });

  describe('verifySessionToken', () => {
    it('should verify and decode a valid token', () => {
      const token = signSessionToken(testPayload);
      const decoded = verifySessionToken(token);
      expect(decoded).toEqual(testPayload);
    });

    it('should return null for invalid token', () => {
      const decoded = verifySessionToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      process.env.JWT_SECRET = 'test-secret';
      const expiredToken = jwt.sign(testPayload, 'test-secret', {
        expiresIn: '1ms',
      });
      // Wait for token to expire
      setTimeout(() => {
        const decoded = verifySessionToken(expiredToken);
        expect(decoded).toBeNull();
      }, 10);
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      const token = jwt.sign(testPayload, 'test-secret');
      expect(() => verifySessionToken(token)).toThrow('Missing JWT_SECRET');
    });
  });
});
