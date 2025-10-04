import * as jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import {
  extractJWTFromRequest,
  verifyJWT,
  extractUserInfo,
  authenticateWebSocket,
  generateWebSocketURL,
  isValidTokenFormat,
  JWTPayload,
} from '../utils/jwt.util';
import { config } from '../config/config';

const SECRET_KEY = config.JWT_SECRET;

describe('JWT Utilities', () => {
  const userPayload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'> = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'user',
  };

  const createToken = (payload: object, expiresIn: string | number = '1h'): string => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: expiresIn as any });
  };

  describe('extractJWTFromRequest', () => {
    it('should get token from Authorization header', () => {
      const token = createToken(userPayload);
      const req = { headers: { authorization: `Bearer ${token}` } } as IncomingMessage;
      expect(extractJWTFromRequest(req)).toBe(token);
    });

    it('should get token from query param', () => {
      const token = createToken(userPayload);
      const req = { url: `/?token=${token}`, headers: {} } as IncomingMessage;
      expect(extractJWTFromRequest(req)).toBe(token);
    });

    it('should return null if no token is provided', () => {
      const req = { url: '/', headers: {} } as IncomingMessage;
      expect(extractJWTFromRequest(req)).toBeNull();
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid token', () => {
      const token = createToken(userPayload);
      const decoded = verifyJWT(token) as JWTPayload;
      expect(decoded.sub).toBe(userPayload.sub);
    });

    it('should throw for an expired token', () => {
      const token = createToken(userPayload, -1);
      expect(() => verifyJWT(token)).toThrow('Token expired');
    });

    it('should throw for an invalid token', () => {
      const token = 'invalid-token';
      expect(() => verifyJWT(token)).toThrow('Invalid token');
    });
  });

  describe('extractUserInfo', () => {
    it('should extract user info from a valid token', () => {
      const token = createToken(userPayload);
      const userInfo = extractUserInfo(token);
      expect(userInfo).toEqual({
        id: userPayload.sub,
        email: userPayload.email,
        role: userPayload.role,
      });
    });
  });

  describe('authenticateWebSocket', () => {
    it('should return user info for a valid token', async () => {
      const token = createToken({ ...userPayload, jti: 'jwt-id' });
      const req = { headers: { authorization: `Bearer ${token}` } } as IncomingMessage;
      const authResult = await authenticateWebSocket(req);
      expect(authResult?.user.id).toBe(userPayload.sub);
      expect(authResult?.jti).toBe('jwt-id');
    });

    it('should return null for an expired token', async () => {
      const token = createToken({ ...userPayload, jti: 'jwt-id' }, -1);
      const req = { headers: { authorization: `Bearer ${token}` } } as IncomingMessage;
      await expect(authenticateWebSocket(req)).resolves.toBeNull();
    });
  });

  describe('generateWebSocketURL', () => {
    it('should generate a URL with the token', () => {
      const token = 'my-test-token';
      const baseUrl = 'ws://localhost:8080';
      const url = generateWebSocketURL(baseUrl, token);
      expect(url).toBe(`${baseUrl}/?token=${token}`);
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for a valid format', () => {
      const token = 'a.b.c';
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it('should return false for an invalid format', () => {
      expect(isValidTokenFormat('a.b')).toBe(false);
      expect(isValidTokenFormat('a.b.c.d')).toBe(false);
      expect(isValidTokenFormat('invalid-token')).toBe(false);
      expect(isValidTokenFormat('')).toBe(false);
      expect(isValidTokenFormat(null as any)).toBe(false);
    });
  });
});