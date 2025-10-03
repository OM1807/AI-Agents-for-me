import { randomBytes, createHash } from 'crypto';

/**
 * Generate PKCE parameters for OAuth flow
 */
export function generatePKCE() {
  // Generate code verifier - 43-128 characters
  const verifier = randomBytes(32).toString('base64url');

  // Generate code challenge using SHA256
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  return {
    code_verifier: verifier,
    code_challenge: challenge,
    code_challenge_method: 'S256' as const,
  };
}

/**
 * Generate cryptographically secure state parameter
 */
export function generateState() {
  return randomBytes(16).toString('base64url');
}

/**
 * Store sensitive data in server-side session/cache
 * In production, use Redis or similar for distributed systems
 */
const tempStore = new Map<string, any>();

export function storeSecureData(key: string, data: any, ttl: number = 600000) {
  tempStore.set(key, {
    data,
    expires: Date.now() + ttl,
  });

  // Clean up expired entries
  setTimeout(() => {
    tempStore.delete(key);
  }, ttl);
}

export function getSecureData(key: string) {
  const entry = tempStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    tempStore.delete(key);
    return null;
  }

  return entry.data;
}

export function deleteSecureData(key: string) {
  tempStore.delete(key);
}
