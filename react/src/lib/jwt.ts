// ===== Base64URL Decode Helper =====

/**
 * Safely decodes a Base64URL string into a UTF-8 string.
 *
 * - JWT tokens are encoded with base64url (uses "-" and "_" instead of "+" and "/").
 * - Adds proper padding so decoding works across environments.
 * - Uses `Buffer` when running on Node.js (SSR), otherwise `atob` in the browser.
 */
function base64UrlDecode(input: string): string {
  // Add missing padding ("=") to make string length a multiple of 4
  const pad = (str: string) => str + "=".repeat((4 - (str.length % 4)) % 4);

  // Convert base64url → base64
  const base64 = pad(input.replace(/-/g, "+").replace(/_/g, "/"));

  if (typeof window === "undefined") {
    // Node.js environment (e.g., server-side rendering)
    return Buffer.from(base64, "base64").toString("utf-8");
  }

  // Browser environment
  return atob(base64);
}

// ===== Types =====

/**
 * Minimal JWT payload type.
 * You can extend this with your own claims as needed.
 */
export type JwtPayload = {
  exp?: number; // expiration time (seconds since epoch)
  iat?: number; // issued-at time
  [k: string]: any; // any additional claim
};

// ===== Parsers =====

/**
 * Parses a JWT string and returns its payload as an object.
 * @param token JWT token (3 parts: header.payload.signature)
 * @returns parsed payload object, or null if invalid
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json);
  } catch {
    return null; // malformed token
  }
}

/**
 * Checks whether a JWT is expired.
 * - Returns true if:
 *   • Token is invalid
 *   • `exp` claim is missing
 *   • Current time >= (exp - skewSeconds)
 *
 * @param token JWT string
 * @param skewSeconds clock skew tolerance (default: 30s)
 * @returns true if expired, false otherwise
 */
export function isExpired(token: string, skewSeconds = 30): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return true; // invalid token or no exp
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= payload.exp - skewSeconds;
}
