import {
  VISITOR_COOKIE_NAME,
  hmacHex,
  issueVisitorCookie,
  verifyVisitorCookie,
  visitorCookieAttributes,
} from "./hash";

export interface SecurityRequestContext {
  ip: string;
  ipHash: string;
  visitorId: string;
  visitorHash: string;
  userAgent: string;
  userAgentHash: string;
  acceptLanguage?: string;
  country?: string;
  colo?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  asn?: number;
  botScore?: number;
  verifiedBot?: boolean;
  requestUrl: string;
  method: string;
  now: number;
}

export interface BuildContextArgs {
  request: Request;
  secret: string;
  /** When set, the helper appends a Set-Cookie header to this array on cookie issuance. */
  responseHeaders?: Headers;
  /** Allow tests to pin a deterministic timestamp. */
  now?: number;
}

function readCfHeader(
  request: Request,
  header: string,
): string | undefined {
  const value = request.headers.get(header);
  return value && value.length > 0 ? value : undefined;
}

function toNumber(input: string | undefined): number | undefined {
  if (!input) return undefined;
  const value = Number(input);
  return Number.isFinite(value) ? value : undefined;
}

function toBool(input: string | undefined): boolean | undefined {
  if (input === undefined) return undefined;
  return input === "true" || input === "1";
}

function buildCfRequest(
  request: Request,
): {
  ip: string;
  country?: string;
  colo?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  asn?: number;
  botScore?: number;
  verifiedBot?: boolean;
} {
  const cf = (request as unknown as {
    cf?: Record<string, unknown>;
  }).cf;
  const ip =
    readCfHeader(request, "cf-connecting-ip") ||
    readCfHeader(request, "x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";
  const get = (k: string): string | undefined => {
    const v = cf?.[k];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  return {
    ip,
    country: get("country"),
    colo: get("colo") ?? get("coloCode"),
    city: get("city"),
    region: get("region") ?? get("regionCode"),
    latitude: toNumber(get("latitude")),
    longitude: toNumber(get("longitude")),
    asn: toNumber(get("asn")),
    botScore: toNumber(get("botManagement")?.toString?.()) ?? undefined,
    verifiedBot:
      toBool(get("clientBot")) ??
      toBool(
        typeof cf?.["botManagement"] === "object"
          ? String((cf["botManagement"] as Record<string, unknown>).verified ?? "")
          : undefined,
      ),
  };
}

export async function buildSecurityRequestContext(
  args: BuildContextArgs,
): Promise<SecurityRequestContext> {
  const { request, secret, responseHeaders, now } = args;
  const url = new URL(request.url);
  const cf = buildCfRequest(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  const acceptLanguage =
    request.headers.get("accept-language") ?? undefined;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(/;\s*/)
      .filter((c) => c.length > 0)
      .map((c) => {
        const eq = c.indexOf("=");
        if (eq <= 0) return [c, ""];
        return [c.slice(0, eq), decodeURIComponent(c.slice(eq + 1))];
      }),
  );
  const rawVisitor = cookies[VISITOR_COOKIE_NAME];
  let visitorId: string;
  let cookieValid = false;
  if (rawVisitor) {
    const verified = await verifyVisitorCookie(secret, rawVisitor);
    if (verified.valid) {
      visitorId = verified.visitorId;
      cookieValid = true;
    } else {
      const issued = await issueVisitorCookie(secret);
      visitorId = issued.visitorId;
      if (responseHeaders) {
        responseHeaders.append(
          "Set-Cookie",
          [
            `${VISITOR_COOKIE_NAME}=${issued.cookieValue}`,
            ...visitorCookieAttributes(url.protocol === "https:"),
          ].join("; "),
        );
      }
    }
  } else {
    const issued = await issueVisitorCookie(secret);
    visitorId = issued.visitorId;
    if (responseHeaders) {
      responseHeaders.append(
        "Set-Cookie",
        [
          `${VISITOR_COOKIE_NAME}=${issued.cookieValue}`,
          ...visitorCookieAttributes(url.protocol === "https:"),
        ].join("; "),
      );
    }
  }

  const ipHash = await hmacHex(secret, cf.ip);
  const visitorHash = await hmacHex(secret, visitorId);
  const userAgentHash = await hmacHex(secret, userAgent);

  return {
    ip: cf.ip,
    ipHash,
    visitorId,
    visitorHash,
    userAgent,
    userAgentHash,
    acceptLanguage,
    country: cf.country,
    colo: cf.colo,
    city: cf.city,
    region: cf.region,
    latitude: cf.latitude,
    longitude: cf.longitude,
    asn: cf.asn,
    botScore: cf.botScore,
    verifiedBot: cf.verifiedBot,
    requestUrl: request.url,
    method: request.method,
    now: now ?? Date.now(),
  };
}

export { VISITOR_COOKIE_NAME };
