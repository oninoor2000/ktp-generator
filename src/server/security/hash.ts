const enc = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return toHex(digest);
}

export async function hmacHex(
  secret: string,
  value: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toHex(signature);
}

const VISITOR_COOKIE = "kg_vid";

function randomId(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export interface VisitorCookie {
  visitorId: string;
  signature: string;
  cookieValue: string;
}

export async function issueVisitorCookie(
  secret: string,
): Promise<VisitorCookie> {
  const visitorId = randomId();
  const signature = await hmacHex(secret, visitorId);
  return { visitorId, signature, cookieValue: `${visitorId}.${signature}` };
}

export async function verifyVisitorCookie(
  secret: string,
  rawValue: string | undefined,
): Promise<{ valid: boolean; visitorId: string }> {
  if (!rawValue) return { valid: false, visitorId: "" };
  const dotIndex = rawValue.lastIndexOf(".");
  if (dotIndex <= 0) return { valid: false, visitorId: "" };
  const visitorId = rawValue.slice(0, dotIndex);
  const signature = rawValue.slice(dotIndex + 1);
  if (!visitorId || !signature) {
    return { valid: false, visitorId: "" };
  }
  const expected = await hmacHex(secret, visitorId);
  if (expected.length !== signature.length) {
    return { valid: false, visitorId };
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (mismatch !== 0) return { valid: false, visitorId };
  return { valid: true, visitorId };
}

export const VISITOR_COOKIE_NAME = VISITOR_COOKIE;

export function visitorCookieAttributes(isSecure: boolean): string[] {
  const attrs = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 180}`,
  ];
  if (isSecure) attrs.push("Secure");
  return attrs;
}
