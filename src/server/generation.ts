import { createServerFn } from "@tanstack/react-start";

import { generateRows } from "~/features/generator/domain/generate";
import {
  generatorSettingsSchema,
  type GeneratorSettingsInput,
} from "~/features/generator/domain/schemas";
import type {
  GeneratedRow,
  KTAGeneratedData,
  KTPGeneratedData,
} from "~/features/generator/domain/types";
import { fetchRandomRegionalRowsFromDb } from "~/utils/regions";

export type GenerateCardDataResponse =
  | {
      ok: true;
      data: Array<KTPGeneratedData | KTAGeneratedData>;
      meta: { generated: number; requestId: string };
    }
  | {
      ok: false;
      reason: "challenge_required";
      riskScore: number;
      reasons: string[];
      retryAfterSeconds?: number;
    }
  | {
      ok: false;
      reason: "rate_limited";
      riskScore: number;
      reasons: string[];
      retryAfterSeconds: number;
    };

export type RateLimitResult =
  | { ok: true }
  | {
      ok: false;
      reason: "challenge_required" | "rate_limited";
      riskScore: number;
      reasons: string[];
      retryAfterSeconds?: number;
    };

export interface GenerateCardDataHandlerArgs {
  db: D1Database;
  secret: string;
  input: unknown;
  evaluateRateLimit?: (input: GeneratorSettingsInput) => Promise<RateLimitResult>;
}

async function auditSuccessfulGeneration(args: {
  db: D1Database;
  requestId: string;
  settings: GeneratorSettingsInput;
  rows: GeneratedRow[];
}) {
  const { db, requestId, settings, rows } = args;
  await db
    .prepare(
      `INSERT INTO generation_requests (
        id,
        visitor_hash,
        ip_hash,
        user_agent_hash,
        region_scope,
        province_id,
        regency_id,
        district_id,
        village_id,
        gender,
        min_age,
        max_age,
        requested_count,
        generated_count,
        decision,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      requestId,
      null,
      null,
      null,
      settings.cardType,
      settings.provinceIds[0] ?? null,
      null,
      null,
      null,
      settings.gender,
      settings.minAge,
      settings.maxAge,
      settings.dataCount,
      rows.length,
      "allow",
      Date.now(),
    )
    .run();
}

export async function generateCardDataHandler(
  args: GenerateCardDataHandlerArgs,
): Promise<GenerateCardDataResponse> {
  const { db, input, evaluateRateLimit } = args;
  const settings = generatorSettingsSchema.parse(input);

  const decision = evaluateRateLimit
    ? await evaluateRateLimit(settings)
    : ({ ok: true } satisfies RateLimitResult);

  if (!decision.ok) {
    if (decision.reason === "challenge_required") {
      return {
        ok: false,
        reason: "challenge_required",
        riskScore: decision.riskScore,
        reasons: decision.reasons,
        retryAfterSeconds: decision.retryAfterSeconds,
      };
    }
    return {
      ok: false,
      reason: "rate_limited",
      riskScore: decision.riskScore,
      reasons: decision.reasons,
      retryAfterSeconds: decision.retryAfterSeconds ?? 60,
    };
  }

  const regions = await fetchRandomRegionalRowsFromDb(db, {
    provinceIds: settings.provinceIds,
    count: settings.dataCount,
  });

  if (regions.length === 0) {
    throw new Error("No regional data available for the selected provinces");
  }

  const data = generateRows(settings, regions);
  const requestId = crypto.randomUUID();

  await auditSuccessfulGeneration({
    db,
    requestId,
    settings,
    rows: data,
  });

  return {
    ok: true,
    data,
    meta: {
      generated: data.length,
      requestId,
    },
  };
}

export const generateCardData = createServerFn({ method: "POST" })
  .validator((data: unknown) => generatorSettingsSchema.parse(data))
  .handler(async ({ data }) => {
    const { env } = await import("cloudflare:workers");
    const rateLimitSecret = (env as { RATE_LIMIT_SECRET?: string }).RATE_LIMIT_SECRET;
    return generateCardDataHandler({
      db: env.DB,
      secret: rateLimitSecret ?? "",
      input: data,
    });
  });
