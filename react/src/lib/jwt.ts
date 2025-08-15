// Decode base64url safely
function base64UrlDecode(input: string): string {
  const pad = (str: string) => str + "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = pad(input.replace(/-/g, "+").replace(/_/g, "/"));
  if (typeof window === "undefined") {
    // Node (SSR) – לא רלוונטי אצלך, אבל שיהיה בטוח
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  return atob(base64);
}

export type JwtPayload = {
  exp?: number; // seconds since epoch
  iat?: number;
  [k: string]: any;
};

export function parseJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired (or invalid).
 * @param token JWT string
 * @param skewSeconds clock skew tolerance (default 30s)
 */
export function isExpired(token: string, skewSeconds = 30): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return true; // invalid token or no exp => treat as expired
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= (payload.exp - skewSeconds);
}