import { generateSignature, verifySignature } from '../../utils/signature';

describe('Signature Utils', () => {
  const secret = 'test-secret-key';
  const payload = { test: 'data', timestamp: '2024-01-01T00:00:00Z' };
  const payloadString = JSON.stringify(payload);

  describe('generateSignature', () => {
    it('should generate a valid HMAC-SHA256 signature', () => {
      const signature = generateSignature(payloadString, secret);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('should generate consistent signatures for same input', () => {
      const signature1 = generateSignature(payloadString, secret);
      const signature2 = generateSignature(payloadString, secret);

      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different inputs', () => {
      const signature1 = generateSignature(payloadString, secret);
      const signature2 = generateSignature('different-payload', secret);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate different signatures for different secrets', () => {
      const signature1 = generateSignature(payloadString, secret);
      const signature2 = generateSignature(payloadString, 'different-secret');

      expect(signature1).not.toBe(signature2);
    });

    it('should handle empty payload', () => {
      const signature = generateSignature('', secret);

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('should handle special characters in payload', () => {
      const specialPayload = '{"data":"special chars: !@#$%^&*()"}';
      const signature = generateSignature(specialPayload, secret);

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });
  });

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const signature = generateSignature(payloadString, secret);
      const isValid = verifySignature(payloadString, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const invalidSignature = 'sha256=invalidsignature123';
      const isValid = verifySignature(payloadString, invalidSignature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject signature with different payload', () => {
      const signature = generateSignature(payloadString, secret);
      const isValid = verifySignature('different-payload', signature, secret);

      expect(isValid).toBe(false);
    });

    it('should reject signature with different secret', () => {
      const signature = generateSignature(payloadString, secret);
      const isValid = verifySignature(payloadString, signature, 'different-secret');

      expect(isValid).toBe(false);
    });

    it('should reject malformed signature', () => {
      const malformedSignatures = [
        'invalid',
        'sha256=',
        'sha256=invalid',
        'sha256=123',
        'md5=abcdef123456',
        'sha256=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      ];

      malformedSignatures.forEach((signature) => {
        const isValid = verifySignature(payloadString, signature, secret);
        expect(isValid).toBe(false);
      });
    });

    it('should handle empty payload', () => {
      const signature = generateSignature('', secret);
      const isValid = verifySignature('', signature, secret);

      expect(isValid).toBe(true);
    });

    it('should be case sensitive', () => {
      const signature = generateSignature(payloadString, secret);
      const upperCaseSignature = signature.toUpperCase();
      const isValid = verifySignature(payloadString, upperCaseSignature, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with real-world data', () => {
      const webhookPayload = {
        id: 'webhook_123',
        eventType: 'user.created',
        data: {
          userId: 'user_456',
          email: 'test@example.com',
          name: 'Test User',
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          version: '1.0',
        },
      };

      const payloadString = JSON.stringify(webhookPayload);
      const signature = generateSignature(payloadString, secret);
      const isValid = verifySignature(payloadString, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should handle Unicode characters correctly', () => {
      const unicodePayload = {
        message: 'Hello 世界 🌍',
        emoji: '🚀🎉',
        special: 'ñáéíóú',
      };

      const payloadString = JSON.stringify(unicodePayload);
      const signature = generateSignature(payloadString, secret);
      const isValid = verifySignature(payloadString, signature, secret);

      expect(isValid).toBe(true);
    });
  });
});
