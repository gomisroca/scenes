import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "upload_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.UPLOAD_PASSWORD;
  if (!secret) {
    throw new Error("UPLOAD_PASSWORD is not set. Add it to .env.local");
  }
  return secret;
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("hex");
}

const SESSION_PAYLOAD = "authenticated";

export function createSessionToken(): string {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || payload !== SESSION_PAYLOAD) return false;

  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function checkPassword(submitted: string): boolean {
  const expected = getSecret();
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);

  const maxLen = Math.max(a.length, b.length, 32);
  const aPadded = Buffer.concat([a], maxLen);
  const bPadded = Buffer.concat([b], maxLen);

  return a.length === b.length && timingSafeEqual(aPadded, bPadded);
}

export { COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
