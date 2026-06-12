import assert from "node:assert/strict";
import { test } from "node:test";

import { generateCardDataHandler } from "./generation";

function result<T>(results: T[]): D1Result<T> {
  return {
    results,
    success: true,
    meta: {} as D1Meta & Record<string, unknown>,
  };
}

function makeDb(args?: {
  regionRows?: unknown[];
}) {
  const state = {
    queries: [] as string[],
    binds: [] as unknown[][],
    auditRuns: 0,
    auditQuery: "",
    auditParams: [] as unknown[],
    regionQueryCount: 0,
  };

  const db = {
    prepare(query: string) {
      state.queries.push(query);

      if (/INSERT INTO generation_requests/i.test(query)) {
        state.auditQuery = query;
        return {
          bind(...params: unknown[]) {
            state.auditParams = params;
            return {
              async run() {
                state.auditRuns += 1;
                return { success: true, meta: {} } as D1Result<never>;
              },
            };
          },
        };
      }

      return {
        bind(...params: unknown[]) {
          state.binds.push(params);
          state.regionQueryCount += 1;
          return {
            async all() {
              return result(
                (args?.regionRows ?? [
                  {
                    province_id: "31",
                    province_name: "DKI JAKARTA",
                    regency_id: "3171",
                    regency_name: "KOTA JAKARTA PUSAT",
                    district_id: "317101",
                    district_name: "GAMBIR",
                    village_id: "3171011001",
                    village_name: "GAMBIR",
                  },
                ]) as never[],
              );
            },
          };
        },
      };
    },
  };

  return { db: db as never, state };
}

test("rejects invalid settings before querying regions", async () => {
  const { db, state } = makeDb();

  await assert.rejects(
    () =>
      generateCardDataHandler({
        db,
        secret: "test-secret",
        input: {
          cardType: "KTP",
          dataCount: 10,
          minAge: 16,
          maxAge: 60,
          gender: "BOTH",
          provinceIds: ["31"],
          honeypot: "",
        },
      }),
    /KTP minimum age/i,
  );

  assert.equal(state.regionQueryCount, 0);
});

test("returns challenge response before querying regions", async () => {
  const { db, state } = makeDb();

  const response = await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTP",
      dataCount: 10,
      minAge: 18,
      maxAge: 60,
      gender: "BOTH",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({
      ok: false,
      reason: "challenge_required",
      riskScore: 55,
      reasons: ["high volume"],
      retryAfterSeconds: 120,
    }),
  });

  assert.deepEqual(response, {
    ok: false,
    reason: "challenge_required",
    riskScore: 55,
    reasons: ["high volume"],
    retryAfterSeconds: 120,
  });
  assert.equal(state.regionQueryCount, 0);
});

test("returns rate_limited response before querying regions", async () => {
  const { db, state } = makeDb();

  const response = await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTA",
      dataCount: 10,
      minAge: 1,
      maxAge: 16,
      gender: "BOTH",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({
      ok: false,
      reason: "rate_limited",
      riskScore: 90,
      reasons: ["blocked"],
      retryAfterSeconds: 600,
    }),
  });

  assert.deepEqual(response, {
    ok: false,
    reason: "rate_limited",
    riskScore: 90,
    reasons: ["blocked"],
    retryAfterSeconds: 600,
  });
  assert.equal(state.regionQueryCount, 0);
});

test("queries D1 regions after allow decision", async () => {
  const { db, state } = makeDb();

  await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTP",
      dataCount: 2,
      minAge: 18,
      maxAge: 60,
      gender: "BOTH",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({ ok: true }),
  });

  assert.equal(state.regionQueryCount, 1);
  assert.deepEqual(state.binds[0], ["31", 2]);
});

test("generates KTP rows for valid KTP request", async () => {
  const { db } = makeDb();

  const response = await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTP",
      dataCount: 2,
      minAge: 18,
      maxAge: 60,
      gender: "MALE",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({ ok: true }),
  });

  assert.equal(response.ok, true);
  if (response.ok) {
    assert.equal(response.data.length, 2);
    assert.equal(response.meta.generated, 2);
    assert.equal(response.data[0]?.gender, "LAKI-LAKI");
    assert.equal(response.data[0]?.validityPeriod, "SEUMUR HIDUP");
  }
});

test("generates KTA rows for valid KTA request", async () => {
  const { db } = makeDb();

  const response = await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTA",
      dataCount: 1,
      minAge: 1,
      maxAge: 16,
      gender: "FEMALE",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({ ok: true }),
  });

  assert.equal(response.ok, true);
  if (response.ok) {
    assert.equal(response.data.length, 1);
    assert.equal(response.data[0]?.gender, "PEREMPUAN");
    assert.ok("familyCertificateNumber" in response.data[0]);
  }
});

test("audits successful generation request", async () => {
  const { db, state } = makeDb();

  const response = await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTP",
      dataCount: 3,
      minAge: 18,
      maxAge: 60,
      gender: "BOTH",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({ ok: true }),
  });

  assert.equal(response.ok, true);
  assert.equal(state.auditRuns, 1);
  assert.match(state.auditQuery, /INSERT INTO generation_requests/i);
});

test("does not persist generated fake identity rows", async () => {
  const { db, state } = makeDb();

  await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTP",
      dataCount: 2,
      minAge: 18,
      maxAge: 60,
      gender: "BOTH",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({ ok: true }),
  });

  assert.equal(state.queries.some((query) => /INSERT INTO generation_requests/i.test(query)), true);
  assert.equal(state.queries.some((query) => /INSERT INTO .*nik|INSERT INTO .*name/i.test(query)), false);
});

test("returns generated count metadata", async () => {
  const { db } = makeDb();

  const response = await generateCardDataHandler({
    db,
    secret: "test-secret",
    input: {
      cardType: "KTP",
      dataCount: 4,
      minAge: 18,
      maxAge: 60,
      gender: "BOTH",
      provinceIds: ["31"],
      honeypot: "",
      clientStartedAt: Date.now() - 1_000,
    },
    evaluateRateLimit: async () => ({ ok: true }),
  });

  assert.equal(response.ok, true);
  if (response.ok) {
    assert.equal(response.meta.generated, 4);
    assert.match(response.meta.requestId, /^[0-9a-f-]{8,}$/i);
  }
});

test("handles empty region result with safe error", async () => {
  const { db } = makeDb({ regionRows: [] });

  await assert.rejects(
    () =>
      generateCardDataHandler({
        db,
        secret: "test-secret",
        input: {
          cardType: "KTP",
          dataCount: 4,
          minAge: 18,
          maxAge: 60,
          gender: "BOTH",
          provinceIds: ["31"],
          honeypot: "",
          clientStartedAt: Date.now() - 1_000,
        },
        evaluateRateLimit: async () => ({ ok: true }),
      }),
    /No regional data available/i,
  );
});
