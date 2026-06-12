# KTP Generator Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app from `/Users/oninoor/dev/ktp-off` inside this TanStack Start + Cloudflare Workers + D1 project, preserving the useful KTP/KTA generation/export features while replacing the old client/backend split with validated server functions, TanStack Query, TanStack Form, Zod, and comprehensive abuse protection.

**Architecture:** Treat the old app as product reference, not source-of-truth implementation. Move generation and regional selection to TanStack Start server functions backed by D1, keep browser-only preview/export/import behavior on the client, and isolate security decisions in a server-side risk engine that can run before generation. Store no generated fake identities by default; store only request/audit/security metadata.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, TanStack Form, Zod v4, React 19, Cloudflare Workers, Cloudflare D1, Drizzle, shadcn/ui, Faker `id_ID`, `pdf-lib`, strict browser CSV parsing, optional Cloudflare Turnstile and optional Cloudflare Enterprise Bot Management fields.

---

## Progress Snapshot

Completed in the current implementation:

- Task 1 baseline dependencies and assets.
- Task 2 domain types and validation, including schema tests and `clientStartedAt` freshness validation.
- Task 3 pure generation logic and unit tests.
- Task 4 D1 province list and random region query helpers plus tests.
- Task 6 request context and hashing helpers plus tests.
- Task 9 server-side generation handler and tests.
- Task 10 initial TanStack Query + TanStack Form workflow for `/` and `/kta`, including localStorage-backed preferences, a combobox-based province selector, challenge panel scaffold, and a basic preview surface.

Partially completed:

- Task 10 UI exists and builds, but challenge handling is still a simple message surface without Turnstile integration.
- Task 11 preview is only a basic in-memory table and summary; CSV upload/export, PDF export, pagination controls, and dedicated preview subcomponents are still pending.

Not started yet:

- Risk model, D1-backed rate limiter orchestration, Turnstile verification, cleanup jobs, admin security route, CSV domain layer, export helpers, and browser/component test coverage from later tasks.

## Companion Documents

Use these companion documents while executing this plan:

- `docs/superpowers/plans/2026-06-12-ktp-generator-layout-ux.md` - concrete layout, responsive behavior, UI states, accessibility, and visual QA requirements.
- `docs/superpowers/plans/2026-06-12-ktp-generator-test-matrix.md` - unit, integration, component, and browser smoke coverage by feature.

MiniMax AI execution rule: read the layout document before Task 10 and read the test matrix before writing tests for Tasks 2-14.

## Source Evaluation

Old app path: `/Users/oninoor/dev/ktp-off`

Current app path: `/Users/oninoor/Dev/ktp-generator`

Useful old app features to preserve:

- KTP route at `/` and KTA route at `/kta`.
- Generator settings: `dataCount`, `minAge`, `maxAge`, `gender`, multi-province selection.
- KTP data fields: NIK, name, birth place/date, gender, address, RT/RW, village, district, city/regency, province, religion, marital status, occupation, blood type, nationality, lifetime validity.
- KTA data fields: KTP-like fields plus family certificate number, head of family name, birth certificate number, and validity until age 17.
- CSV template download and CSV upload/import.
- Tabular preview with pagination, summary statistics, CSV export, and PDF export.
- KTP/KTA template images:
  - `/Users/oninoor/dev/ktp-off/public/KTP Template.png`
  - `/Users/oninoor/dev/ktp-off/public/KTA Template.png`
- Position configs:
  - `/Users/oninoor/dev/ktp-off/src/lib/constant/ktp-position-constant.ts`
  - `/Users/oninoor/dev/ktp-off/src/lib/constant/kta-postition-constant.ts`

Old logic to improve instead of copying blindly:

- Old random region generation calls an external backend (`/api/regions/random`). Replace with D1 reads from local `provinces`, `regencies`, `districts`, and `villages`.
- Old generation ignores the selected `gender` setting and always uses random gender. New server generation must honor `MALE`, `FEMALE`, and `BOTH`.
- Old preview summary counts compare `"Laki-laki"`/`"Perempuan"` but generation returns `"LAKI-LAKI"`/`"PEREMPUAN"`. New summary must use normalized enum values.
- Old CSV parsing is hand-written. New implementation should use a real parser or a smaller tested parser plus row-level Zod schemas.
- Old KTA CSV default can fall back to `"SEUMUR HIDUP"`, which conflicts with generated KTA validity until age 17. New KTA import must validate or derive validity consistently.
- Old app stores settings and position config in `localStorage`; keep that for user preferences, but keep generated data in React state/query cache only unless the user explicitly exports it.
- Old route-level reducer mixes persistence, generation, and UI state. New implementation should split domain, server, form, and presentation concerns.

Cloudflare notes:

- Current schema already includes `rate_limit_buckets`, `rate_limit_challenges`, `security_events`, and `generation_requests`.
- Cloudflare `cf.bot_management.score` is only available with Enterprise Bot Management enabled. Use it when present, but design the limiter to work without it.
- `cf.client.bot` indicates known good crawlers and is broadly usable as a verified-bot signal.
- Turnstile is the preferred challenge layer for suspicious generation attempts; server-side siteverify is mandatory for it to be meaningful.

## Target File Map

Create:

- `src/features/generator/domain/types.ts` - shared card, region, generated-data, and field-position types.
- `src/features/generator/domain/constants.ts` - religion, marital status, jobs, blood types, defaults, storage keys.
- `src/features/generator/domain/schemas.ts` - Zod request, generated-row, CSV row, and position-config schemas.
- `src/features/generator/domain/format.ts` - uppercase, date, NIK, KK, Akta, field label, and export formatting helpers.
- `src/features/generator/domain/generate.ts` - pure generation functions that accept regional rows and deterministic options.
- `src/features/generator/domain/generate.test.ts` - generation unit tests.
- `src/features/generator/domain/csv.ts` - CSV template, parse, validate, and serialize helpers.
- `src/features/generator/domain/csv.test.ts` - CSV import/export tests.
- `src/features/generator/domain/position.ts` - KTP/KTA default position configs ported from old app.
- `src/server/generation.ts` - TanStack Start server functions for generation.
- `src/server/security/request-context.ts` - isolated access to TanStack Start request/cookie/header helpers and Cloudflare metadata.
- `src/server/security/hash.ts` - HMAC/SHA hashing helpers for IP, visitor, UA, and challenge values.
- `src/server/security/risk-model.ts` - pure risk scoring rules.
- `src/server/security/risk-model.test.ts` - impossible travel, bot, and limit scoring tests.
- `src/server/security/rate-limiter.ts` - D1-backed limiter orchestration.
- `src/server/security/rate-limiter.test.ts` - mocked-D1 limiter tests.
- `src/server/security/turnstile.ts` - optional Turnstile siteverify helper.
- `src/server/security/cleanup.ts` - cleanup helper for expired challenge/bucket data.
- `src/features/generator/hooks/use-generator-preferences.ts` - SSR-safe localStorage settings/position persistence.
- `src/features/generator/hooks/use-generate-card-data.ts` - TanStack Query mutation wrapper around server function.
- `src/features/generator/components/generator-page.tsx` - shared page layout for KTP/KTA routes.
- `src/features/generator/components/generator-form.tsx` - TanStack Form implementation.
- `src/features/generator/components/province-multi-select.tsx` - query-backed province selector.
- `src/features/generator/components/data-preview.tsx` - preview table, pagination, summary, export actions.
- `src/features/generator/components/csv-upload.tsx` - CSV template download and import.
- `src/features/generator/components/pdf-export.ts` - browser-only PDF export helpers based on old `pdf-lib` behavior.
- `src/features/generator/components/csv-export.ts` - browser-only CSV export helpers.
- `src/features/generator/components/challenge-panel.tsx` - UI state for Turnstile/challenge-required responses.
- `src/routes/kta.tsx` - KTA route.
- `src/routes/admin.security.tsx` - optional local/admin security event viewer, protected behind env flag.

Modify:

- `package.json` - add missing dependencies and scripts.
- `src/db/schema.ts` - extend security/rate-limit schema for impossible travel and richer reputation.
- `drizzle/` - generate migration after schema changes.
- `src/server/regions.ts` - add province list and random region selection server helpers.
- `src/utils/regions.ts` - add D1 query helpers for region lists/random rows.
- `src/routes/index.tsx` - replace current summary-only page with KTP generator page.
- `src/routes/__root.tsx` - update SEO, `lang`, and keep QueryClient provider.
- `public/` - copy old template assets and selected static metadata.
- `wrangler.jsonc` - add vars needed by security layer if not supplied via secrets.

## Dependencies

Install:

```bash
pnpm add @faker-js/faker @tanstack/react-form pdf-lib papaparse
pnpm add -D @types/papaparse
```

Do not add React Hook Form or `@hookform/resolvers`; this rebuild must use TanStack Form.

Optional later:

```bash
pnpm add @marsidev/react-turnstile
```

Only add the Turnstile React package if the implementation uses Cloudflare Turnstile widget rendering in React. A plain `<script>`/widget wrapper is also acceptable.

## Security Model

The limiter must run before expensive generation and before D1 random-row selection where possible.

Signals:

- IP hash: from `CF-Connecting-IP` first, then trusted request IP helper fallback.
- Visitor hash: signed `kg_vid` cookie; generate when missing or invalid.
- User agent hash.
- Route/scope: `generate:KTP`, `generate:KTA`, `regions:list`, `csv:server` if server-side CSV validation is added.
- Requested count and cost units.
- Cloudflare metadata: country, colo, city, region, latitude, longitude, ASN, bot management score if present, verified bot if present.
- Behavioral history: recent requests, total generated count, failed challenges, country/colo jumps, UA churn, visitor/IP mismatch churn.
- Form honeypot/timing fields: hidden field must stay empty; minimum client interaction age for anonymous generation.
- Optional Turnstile token after challenge threshold.

Decisions:

- `allow`: request proceeds.
- `allow_with_audit`: request proceeds but security event is logged.
- `challenge`: request rejected with a structured challenge response. Client shows Turnstile or lightweight proof UI.
- `block`: request rejected for a cooldown window.

Recommended initial thresholds:

- `generate` per visitor: 10 requests / 10 minutes, 60 requests / day.
- `generate` per IP: 30 requests / 10 minutes, 150 requests / day.
- Cost budget per visitor: 5,000 generated rows / day.
- Cost budget per IP: 15,000 generated rows / day.
- Challenge when requested count exceeds 500 for a low-reputation visitor.
- Challenge when risk score >= 50.
- Block when risk score >= 80 or repeated challenge failures >= 3 in 30 minutes.
- Treat a request cost as `ceil(requestedCount / 25)` with minimum 1.

Impossible travel rule:

- Store last successful request location per visitor hash.
- If latitude/longitude are available for current and previous request, calculate distance and speed.
- If speed exceeds 900 km/h and elapsed time is under 12 hours, add high risk.
- If only country/colo are available, add medium risk for rapid country or colo changes within 30 minutes.
- Do not hard-block solely on impossible travel; require at least one additional signal such as high volume, UA churn, bot score, or failed challenge.

Bot detection:

- If Cloudflare Bot Management score is present:
  - score <= 15: high risk.
  - score 16-29: medium risk.
  - score >= 30: no penalty.
- If `cf.client.bot`/verified bot is true, do not allow generation automatically. Verified crawlers should be allowed for GET pages and blocked/challenged for POST generation.
- Without Bot Management, score suspicious UA strings, missing browser headers, absent accept-language, abnormal fetch metadata, very fast first POST, and honeypot fill.

Privacy:

- Never store raw IP or full user agent.
- Store HMAC hashes using a secret from `RATE_LIMIT_SECRET`.
- Keep generated fake identity rows out of D1 unless a future feature explicitly requires saved batches.
- Store compact metadata JSON only for audit/risk debugging.

## Task 1: Baseline And Assets

**Files:**

- Modify: `package.json`
- Copy into: `public/KTP Template.png`
- Copy into: `public/KTA Template.png`
- Optional copy into: `public/template-ktp-example.csv`
- Optional copy into: `public/template-kta-example.csv`

- [ ] Add dependencies.

Run:

```bash
pnpm add @faker-js/faker @tanstack/react-form pdf-lib papaparse
pnpm add -D @types/papaparse
```

Expected: `package.json` and `pnpm-lock.yaml` update.

- [ ] Copy assets from the old app.

Run:

```bash
cp "/Users/oninoor/dev/ktp-off/public/KTP Template.png" public/
cp "/Users/oninoor/dev/ktp-off/public/KTA Template.png" public/
cp "/Users/oninoor/dev/ktp-off/public/template-ktp-example.csv" public/ || true
cp "/Users/oninoor/dev/ktp-off/public/template-kta-example.csv" public/ || true
```

Expected: both template PNGs exist in `public/`.

- [ ] Verify assets.

Run:

```bash
test -s "public/KTP Template.png" && test -s "public/KTA Template.png"
```

Expected: command exits with status 0.

- [ ] Commit.

```bash
git add package.json pnpm-lock.yaml public
git commit -m "chore: add generator dependencies and card templates"
```

## Task 2: Domain Types And Validation

**Files:**

- Create: `src/features/generator/domain/types.ts`
- Create: `src/features/generator/domain/constants.ts`
- Create: `src/features/generator/domain/schemas.ts`
- Create: `src/features/generator/domain/position.ts`
- Test: typecheck via `pnpm build`

- [ ] Create domain types.

Required shape:

```ts
export type CardType = "KTP" | "KTA";
export type GenderInput = "MALE" | "FEMALE" | "BOTH";
export type GeneratedGender = "LAKI-LAKI" | "PEREMPUAN";

export interface GeneratorSettings {
  cardType: CardType;
  dataCount: number;
  minAge: number;
  maxAge: number;
  gender: GenderInput;
  provinceIds: string[];
  honeypot?: string;
  clientStartedAt?: number;
  turnstileToken?: string;
}

export interface RegionalData {
  province: { id: string; name: string };
  regency: { id: string; name: string };
  district: { id: string; name: string };
  village: { id: string; name: string };
}

export interface KTPGeneratedData {
  nik: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  birthDatePlace: string;
  gender: GeneratedGender;
  address: string;
  rt: string;
  rw: string;
  rtRw: string;
  village: string;
  district: string;
  city: string;
  province: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  bloodType: string;
  nationality: "WNI";
  validityPeriod: "SEUMUR HIDUP";
}

export interface KTAGeneratedData
  extends Omit<KTPGeneratedData, "maritalStatus" | "occupation" | "validityPeriod"> {
  validityPeriod: string;
  familyCertificateNumber: string;
  headFamilyName: string;
  birthCertificateNumber: string;
}
```

- [ ] Create Zod schemas.

Rules:

- KTP age range: `minAge >= 17`, `maxAge <= 100`, `maxAge >= minAge`.
- KTA age range: `minAge >= 1`, `maxAge <= 16`, `maxAge >= minAge`.
- `dataCount`: `1..1000`.
- `provinceIds`: array of province IDs; empty means all provinces only if UI explicitly chooses “all”. Do not silently convert missing province to Jakarta.
- `honeypot`: must be empty or undefined.
- `clientStartedAt`: if present, must be a timestamp within the last hour.

Suggested schema pattern:

```ts
export const generatorSettingsSchema = z
  .object({
    cardType: z.enum(["KTP", "KTA"]),
    dataCount: z.number().int().min(1).max(1000),
    minAge: z.number().int().min(1).max(100),
    maxAge: z.number().int().min(1).max(100),
    gender: z.enum(["MALE", "FEMALE", "BOTH"]),
    provinceIds: z.array(z.string().regex(/^\d{2}$/)).min(1),
    honeypot: z.string().max(0).optional().or(z.literal("")),
    clientStartedAt: z.number().int().positive().optional(),
    turnstileToken: z.string().min(1).max(4096).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.maxAge < value.minAge) {
      ctx.addIssue({ code: "custom", path: ["maxAge"], message: "Maximum age must be greater than or equal to minimum age" });
    }
    if (value.cardType === "KTP" && value.minAge < 17) {
      ctx.addIssue({ code: "custom", path: ["minAge"], message: "KTP minimum age is 17" });
    }
    if (value.cardType === "KTA" && value.maxAge > 16) {
      ctx.addIssue({ code: "custom", path: ["maxAge"], message: "KTA maximum age is 16" });
    }
  });
```

- [ ] Port constants and position configs from old app.

Keep field names aligned with the new domain types. Rename old typo file `kta-postition-constant.ts` to clean `position.ts`.

- [ ] Build.

Run:

```bash
pnpm build
```

Expected: build passes or fails only because later tasks have not yet updated routes. If it fails because imports are unused or schemas are invalid, fix in this task.

- [ ] Commit.

```bash
git add src/features/generator/domain package.json pnpm-lock.yaml
git commit -m "feat: define generator domain schemas"
```

## Task 3: Pure Generation Logic

**Files:**

- Create: `src/features/generator/domain/format.ts`
- Create: `src/features/generator/domain/generate.ts`
- Create: `src/features/generator/domain/generate.test.ts`
- Modify: `package.json` test script if needed

- [ ] Write failing generation tests.

Test cases:

- Female NIK adds 40 to birth day.
- Male NIK does not add 40.
- `gender: "MALE"` yields only `"LAKI-LAKI"`.
- `gender: "FEMALE"` yields only `"PEREMPUAN"`.
- KTP validity is `"SEUMUR HIDUP"`.
- KTA validity is the 17th birthday.
- Birth place strips `Kabupaten ` and `Kota ` prefixes.
- Generated text fields are uppercase.

Run:

```bash
pnpm test
```

Expected: tests fail because generation implementation does not exist.

- [ ] Implement pure helpers.

Required functions:

```ts
export function formatDateDDMMYYYY(date: Date): string;
export function uppercaseOfficial(value: string): string;
export function getBirthPlace(regencyName: string): string;
export function chooseGender(input: GenderInput): "male" | "female";
export function generatedGenderLabel(gender: "male" | "female"): GeneratedGender;
export function generateNik(args: {
  provinceId: string;
  regencyId: string;
  districtId: string;
  birthDate: Date;
  gender: "male" | "female";
  sequence: string;
}): string;
export function generateKtpRows(settings: GeneratorSettings, regions: RegionalData[]): KTPGeneratedData[];
export function generateKtaRows(settings: GeneratorSettings, regions: RegionalData[]): KTAGeneratedData[];
```

Use `@faker-js/faker/locale/id_ID`. Keep random generation injectable where tests need deterministic output.

- [ ] Run tests.

```bash
pnpm test
```

Expected: generation tests pass.

- [ ] Commit.

```bash
git add src/features/generator/domain package.json
git commit -m "feat: add card generation domain logic"
```

## Task 4: D1 Region Query Layer

**Files:**

- Modify: `src/utils/regions.ts`
- Modify: `src/utils/regions.test.ts`
- Modify: `src/server/regions.ts`

- [ ] Add tests for province list and random region selection.

Required behavior:

- `fetchProvincesFromDb(db)` returns all provinces ordered by name.
- `fetchRandomRegionalRowsFromDb(db, { provinceIds, count })` returns joined region rows with province, regency, district, and village.
- Selected province IDs filter villages by `villages.province_id`.
- `count` is clamped by validation before the query layer; query layer still parameterizes limit.

- [ ] Implement D1 helpers with prepared statements.

Use a query shaped like:

```sql
SELECT
  provinces.id AS province_id,
  provinces.name AS province_name,
  regencies.id AS regency_id,
  regencies.name AS regency_name,
  districts.id AS district_id,
  districts.name AS district_name,
  villages.id AS village_id,
  villages.name AS village_name
FROM villages
JOIN districts ON districts.id = villages.district_id
JOIN regencies ON regencies.id = villages.regency_id
JOIN provinces ON provinces.id = villages.province_id
WHERE villages.province_id IN (...)
ORDER BY RANDOM()
LIMIT ?
```

If `provinceIds` is very large, use all provinces by omitting `WHERE` or chunking placeholders. Do not interpolate untrusted IDs directly.

- [ ] Add server functions.

`src/server/regions.ts` should expose:

```ts
export const fetchProvinces = createServerFn({ method: "GET" }).handler(async () => {
  return fetchProvincesFromDb(env.DB);
});
```

Keep `fetchRegionSummary` for diagnostics or remove it only after routes no longer use it.

- [ ] Run tests.

```bash
pnpm test
```

Expected: existing seed/region tests and new region tests pass.

- [ ] Commit.

```bash
git add src/utils/regions.ts src/utils/regions.test.ts src/server/regions.ts
git commit -m "feat: query regional data from D1"
```

## Task 5: Comprehensive Rate Limiter Schema

**Files:**

- Modify: `src/db/schema.ts`
- Generate: `drizzle/*.sql`

- [ ] Extend schema.

Add tables:

```ts
export const visitorReputations = sqliteTable(
  "visitor_reputations",
  {
    visitorHash: text("visitor_hash").primaryKey().notNull(),
    score: integer().notNull().default(0),
    successfulRequests: integer("successful_requests").notNull().default(0),
    challengedRequests: integer("challenged_requests").notNull().default(0),
    blockedRequests: integer("blocked_requests").notNull().default(0),
    failedChallenges: integer("failed_challenges").notNull().default(0),
    lastCountry: text("last_country"),
    lastColo: text("last_colo"),
    lastLatitude: numeric("last_latitude"),
    lastLongitude: numeric("last_longitude"),
    lastSeenAt: integer("last_seen_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("visitor_reputations_updated_at_idx").on(table.updatedAt)],
);
```

Add table:

```ts
export const rateLimitDecisions = sqliteTable(
  "rate_limit_decisions",
  {
    id: text().primaryKey().notNull(),
    visitorHash: text("visitor_hash"),
    ipHash: text("ip_hash"),
    userAgentHash: text("user_agent_hash"),
    scope: text().notNull(),
    decision: text().notNull(),
    riskScore: integer("risk_score").notNull(),
    reasonsJson: text("reasons_json").notNull(),
    requestCost: integer("request_cost").notNull(),
    country: text(),
    colo: text(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("rate_limit_decisions_created_at_idx").on(table.createdAt),
    index("rate_limit_decisions_visitor_created_at_idx").on(table.visitorHash, table.createdAt),
    index("rate_limit_decisions_ip_created_at_idx").on(table.ipHash, table.createdAt),
  ],
);
```

Add indexes to existing tables:

- `rate_limit_buckets(scope, updated_at)`
- `generation_requests(visitor_hash, created_at)`
- `generation_requests(ip_hash, created_at)`

- [ ] Generate migration.

Run:

```bash
pnpm db:generate
```

Expected: new migration file in `drizzle/` and updated drizzle metadata.

- [ ] Run tests/build.

```bash
pnpm test
pnpm build
```

Expected: both pass after fixing type exports.

- [ ] Commit.

```bash
git add src/db/schema.ts drizzle
git commit -m "feat: extend security audit schema"
```

## Task 6: Request Context And Hashing

**Files:**

- Create: `src/server/security/request-context.ts`
- Create: `src/server/security/hash.ts`
- Modify: `wrangler.jsonc`
- Modify: `.env.example`

- [ ] Add `RATE_LIMIT_SECRET` to local docs/config.

`.env.example`:

```env
RATE_LIMIT_SECRET=replace-with-32-byte-random-secret
TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=
SECURITY_ADMIN_ENABLED=false
```

`wrangler.jsonc` vars:

```jsonc
"vars": {
  "SECURITY_ADMIN_ENABLED": "false"
}
```

Keep real secrets in Wrangler secrets, not committed files:

```bash
pnpm exec wrangler secret put RATE_LIMIT_SECRET
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY
```

- [ ] Implement request context wrapper.

Use TanStack Start helpers from `@tanstack/react-start/server`, including `getRequest`, `getRequestHeader`, `getCookie`, and `setCookie`.

The context returned to the limiter must include:

```ts
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
```

Cookie rules:

- Name: `kg_vid`
- Value: `visitorId.signature`
- `httpOnly: true`
- `secure: true` outside local dev
- `sameSite: "lax"`
- `maxAge: 60 * 60 * 24 * 180`

- [ ] Implement hashing.

Use Web Crypto APIs available in Workers:

```ts
export async function hmacHex(secret: string, value: string): Promise<string>;
export async function sha256Hex(value: string): Promise<string>;
```

For privacy-sensitive values, prefer HMAC with `RATE_LIMIT_SECRET`.

- [ ] Add tests where pure functions allow it.

Test signature verification and stable HMAC output using a fixed test secret.

- [ ] Commit.

```bash
git add src/server/security .env.example wrangler.jsonc
git commit -m "feat: add security request context"
```

## Task 7: Risk Model

**Files:**

- Create: `src/server/security/risk-model.ts`
- Create: `src/server/security/risk-model.test.ts`

- [ ] Write failing tests.

Cases:

- Low bot score creates high-risk reason.
- Verified bot on POST generation is challenged or blocked.
- Honeypot filled adds high risk.
- Missing UA and missing accept-language add risk.
- Impossible travel with 900+ km/h plus UA churn reaches challenge threshold.
- Impossible travel alone does not hard-block.
- Requesting 1000 rows costs more than requesting 10 rows.

- [ ] Implement pure model.

Required exports:

```ts
export type RateLimitDecision = "allow" | "allow_with_audit" | "challenge" | "block";

export interface RiskInput {
  scope: string;
  requestedCount: number;
  context: SecurityRequestContext;
  reputation?: VisitorReputationSnapshot;
  recent: {
    visitorRequests10m: number;
    visitorRequests24h: number;
    ipRequests10m: number;
    ipRequests24h: number;
    visitorCost24h: number;
    ipCost24h: number;
  };
  form: {
    honeypotFilled: boolean;
    clientElapsedMs?: number;
    hasTurnstileToken: boolean;
    turnstileValid?: boolean;
  };
}

export interface RiskResult {
  decision: RateLimitDecision;
  riskScore: number;
  requestCost: number;
  reasons: string[];
  retryAfterSeconds?: number;
  challengeRequired: boolean;
}
```

Decision mapping:

- `riskScore < 25`: `allow`
- `25 <= riskScore < 50`: `allow_with_audit`
- `50 <= riskScore < 80`: `challenge`
- `riskScore >= 80`: `block`

Override:

- Valid Turnstile can reduce risk by up to 35 points but must not override hard limits or known abuse.
- Daily cost budget exceeded blocks regardless of risk score.

- [ ] Run tests.

```bash
pnpm test
```

Expected: all risk tests pass.

- [ ] Commit.

```bash
git add src/server/security/risk-model.ts src/server/security/risk-model.test.ts
git commit -m "feat: add generator risk model"
```

## Task 8: D1 Rate Limiter Orchestration

**Files:**

- Create: `src/server/security/rate-limiter.ts`
- Create: `src/server/security/rate-limiter.test.ts`
- Create: `src/server/security/turnstile.ts`
- Create: `src/server/security/cleanup.ts`

- [ ] Write mocked-D1 tests.

Cases:

- First normal generation is allowed and audited.
- Excess visitor 10-minute count returns challenge.
- Excess daily cost returns block.
- Failed challenge increments reputation failure count.
- Valid Turnstile token allows a request that would otherwise challenge.
- Decision inserts into `rate_limit_decisions`.
- Generation request audit inserts into `generation_requests` after successful generation.

- [ ] Implement limiter API.

Required function:

```ts
export async function evaluateGenerationLimit(args: {
  db: D1Database;
  secret: string;
  scope: "generate:KTP" | "generate:KTA";
  settings: GeneratorSettings;
}): Promise<RiskResult & { context: SecurityRequestContext }>;
```

Use D1 prepared statements. Keep all SQL in this module or small helpers. Do not scatter security writes across route components.

- [ ] Implement Turnstile verifier.

Function:

```ts
export async function verifyTurnstileToken(args: {
  secretKey: string | undefined;
  token: string | undefined;
  remoteIp?: string;
}): Promise<boolean>;
```

If no secret is configured, return `false` and add a warning security event when challenge mode is reached.

- [ ] Implement cleanup helper.

Delete:

- Expired challenges.
- Buckets older than 48 hours.
- Decisions older than 30 days if keeping audit small is preferred.

Do not run cleanup on every request. Trigger cleanup probabilistically, for example 1% of successful generation requests.

- [ ] Run tests.

```bash
pnpm test
```

Expected: limiter tests pass.

- [ ] Commit.

```bash
git add src/server/security
git commit -m "feat: enforce generation rate limits"
```

## Task 9: Generation Server Function

**Files:**

- Create: `src/server/generation.ts`
- Modify: `src/server/regions.ts`
- Modify: `src/utils/regions.ts`

- [ ] Implement server function.

Required behavior:

- Parse input with `generatorSettingsSchema`.
- Evaluate rate limit before D1 region randomization.
- If decision is `challenge` or `block`, throw/return a typed response the client can render.
- Fetch random regional rows from D1.
- Generate KTP/KTA rows with pure domain generator.
- Insert successful request audit into `generation_requests`.
- Return generated rows and sanitized metadata.

Response shape:

```ts
export type GenerateCardDataResponse =
  | { ok: true; data: Array<KTPGeneratedData | KTAGeneratedData>; meta: { generated: number; requestId: string } }
  | { ok: false; reason: "challenge_required"; riskScore: number; reasons: string[]; retryAfterSeconds?: number }
  | { ok: false; reason: "rate_limited"; riskScore: number; reasons: string[]; retryAfterSeconds: number };
```

- [ ] Add server-function tests if existing test harness supports it.

If direct server-function tests are awkward, test the underlying handler function:

```ts
export async function generateCardDataHandler(args: {
  db: D1Database;
  secret: string;
  input: unknown;
}): Promise<GenerateCardDataResponse>;
```

- [ ] Run tests/build.

```bash
pnpm test
pnpm build
```

Expected: both pass.

- [ ] Commit.

```bash
git add src/server/generation.ts src/server/regions.ts src/utils/regions.ts
git commit -m "feat: generate card data through server functions"
```

## Task 10: TanStack Query And Form UI

**Files:**

- Create: `src/features/generator/hooks/use-generator-preferences.ts`
- Create: `src/features/generator/hooks/use-generate-card-data.ts`
- Create: `src/features/generator/components/generator-page.tsx`
- Create: `src/features/generator/components/generator-form.tsx`
- Create: `src/features/generator/components/province-multi-select.tsx`
- Create: `src/features/generator/components/challenge-panel.tsx`
- Modify: `src/routes/index.tsx`
- Create: `src/routes/kta.tsx`

- [ ] Read the layout companion document.

Read:

```bash
sed -n '1,260p' docs/superpowers/plans/2026-06-12-ktp-generator-layout-ux.md
```

Expected: implementation follows the route layout, responsive grid, UI states, and accessibility rules from that document.

- [ ] Implement preferences hook.

Keep settings and position configs in localStorage with SSR guard:

```ts
const canUseStorage = typeof window !== "undefined";
```

Keys:

- `ktp-generator-settings`
- `kta-generator-settings`
- `ktp-generator-position-config`
- `kta-generator-position-config`

- [ ] Implement query hooks.

Use TanStack Query:

- `useQuery({ queryKey: ["provinces"], queryFn: () => fetchProvinces() })`
- `useMutation({ mutationFn: generateCardData })`

Do not call generation in a reducer. Use mutation state for pending/error/success.

- [ ] Implement TanStack Form.

Fields:

- `dataCount`
- `minAge`
- `maxAge`
- `gender`
- `provinceIds`
- hidden `honeypot`
- hidden `clientStartedAt`
- optional `turnstileToken`

Validation:

- Use the same Zod schema as the server, adapted for form field errors.
- KTP defaults: 10 rows, ages 18-60, both genders, Jakarta selected if it exists in D1.
- KTA defaults: 10 rows, ages 1-16, both genders, Jakarta selected if it exists in D1.

- [ ] Implement pages.

`src/routes/index.tsx`:

```tsx
export const Route = createFileRoute("/")({
  component: () => <GeneratorPage cardType="KTP" />,
});
```

`src/routes/kta.tsx`:

```tsx
export const Route = createFileRoute("/kta")({
  component: () => <GeneratorPage cardType="KTA" />,
});
```

- [ ] Implement challenge handling.

When generation response is `challenge_required`:

- Show `challenge-panel.tsx`.
- If Turnstile site key is configured, render Turnstile and resubmit with token.
- If Turnstile is not configured, show a clear cooldown/rate-limit message and avoid an endless retry button.

- [ ] Run.

```bash
pnpm build
```

Expected: build passes.

- [ ] Commit.

```bash
git add src/features/generator src/routes/index.tsx src/routes/kta.tsx
git commit -m "feat: build generator form workflow"
```

Implementation note:

- The visible generator UI now uses Bahasa Indonesia consistently for route copy, form labels, preview labels, challenge messaging, and province selector text. Internal enums and field identifiers remain unchanged.

## Task 11: Preview, CSV, And PDF Export

**Files:**

- Create: `src/features/generator/components/data-preview.tsx`
- Create: `src/features/generator/components/csv-upload.tsx`
- Create: `src/features/generator/components/csv-export.ts`
- Create: `src/features/generator/components/pdf-export.ts`
- Create: `src/features/generator/domain/csv.ts`
- Create: `src/features/generator/domain/csv.test.ts`

- [ ] Write CSV tests.

Cases:

- KTP template round-trips.
- KTA template round-trips.
- Excel NIK format `="3201234567890123"` parses to 16 digits.
- Invalid NIK is replaced only when import mode allows repair; strict mode should reject it.
- KTA missing validity derives 17th birthday when birth date is valid.
- Commas inside quoted fields parse correctly.

- [ ] Implement CSV using `papaparse`.

Required exports:

```ts
export function generateCsvTemplate(cardType: CardType): string;
export function parseImportedCsv(text: string, cardType: CardType): CSVImportResult;
export function serializeGeneratedRows(rows: Array<KTPGeneratedData | KTAGeneratedData>): string;
```

- [ ] Implement data preview.

Features:

- Empty state with CSV upload.
- Table fields differ by KTP/KTA.
- Pagination default 10 rows/page.
- Summary uses uppercase gender values.
- Buttons use lucide icons for CSV and PDF export.

- [ ] Implement PDF export.

Port old template overlay math but keep browser-only code out of server modules.

Rules:

- Dynamically import `pdf-lib` inside click handler or helper to keep initial JS smaller.
- Fetch `/KTP Template.png` or `/KTA Template.png`.
- Use default position configs.
- Keep progress callback for batches.
- Preserve file names:
  - `KTP_Data_<count>_<yyyy-mm-dd>.pdf`
  - `KTA_Data_<count>_<yyyy-mm-dd>.pdf`

- [ ] Browser smoke test.

Run:

```bash
pnpm dev
```

Open the local URL. Test:

- Generate 3 KTP rows.
- Export CSV.
- Export PDF.
- Import KTP template CSV.
- Switch to `/kta`.
- Generate 3 KTA rows.
- Export CSV/PDF.

- [ ] Commit.

```bash
git add src/features/generator
git commit -m "feat: add preview and export workflow"
```

## Task 12: SEO, Navigation, And Static Metadata

**Files:**

- Modify: `src/routes/__root.tsx`
- Modify/Create: navigation component if needed under `src/components/`
- Copy/modify: `public/robots.txt`
- Copy/modify: `public/sitemap.xml`
- Copy/modify: `public/structured-data.json`
- Copy/modify: `public/humans.txt`

- [ ] Update metadata.

Use Indonesian product copy:

- Title: `KTP Generator`
- Description: `Generate dummy KTP and KTA Indonesia data for testing and development using seeded regional reference data.`
- `html lang="id"`

- [ ] Add simple top navigation.

Links:

- `/` label `KTP`
- `/kta` label `KTA`

Keep `ModeToggle`.

- [ ] Add disclaimer in UI footer or small aside.

Text intent: generated data is fake and only for testing/development. Keep it visible but not dominant.

- [ ] Build.

```bash
pnpm build
```

Expected: build passes.

- [ ] Commit.

```bash
git add src/routes/__root.tsx src/components public
git commit -m "feat: add generator navigation and metadata"
```

## Task 13: Security Admin Diagnostics

**Files:**

- Create: `src/routes/admin.security.tsx`
- Create: `src/server/security/admin.ts`

- [ ] Implement env-gated server function.

If `SECURITY_ADMIN_ENABLED !== "true"`, return 404 or unauthorized.

Diagnostics:

- Last 100 `security_events`.
- Last 100 `rate_limit_decisions`.
- Aggregates by decision in last 24h.
- Top reason counts in last 24h.

- [ ] Implement route.

This is a utilitarian internal page. Do not expose raw IP/UA. Show hashes and metadata JSON only.

- [ ] Build.

```bash
pnpm build
```

Expected: build passes.

- [ ] Commit.

```bash
git add src/routes/admin.security.tsx src/server/security/admin.ts
git commit -m "feat: add security diagnostics"
```

## Task 14: Final Verification

**Files:** all touched files.

- [ ] Read the test matrix companion document.

Read:

```bash
sed -n '1,320p' docs/superpowers/plans/2026-06-12-ktp-generator-test-matrix.md
```

Expected: final verification covers every required unit, integration, component, and browser smoke test listed there.

- [ ] Run unit tests.

```bash
pnpm test
```

Expected: all tests pass.

- [ ] Run build.

```bash
pnpm build
```

Expected: production build passes.

- [ ] Run D1 migration locally.

```bash
pnpm db:migrate
```

Expected: migrations apply to configured local/remote target according to the existing Drizzle setup. If this command targets remote D1 in current config, stop and verify environment before applying.

- [ ] Run dev server and browser smoke.

```bash
pnpm dev
```

Smoke matrix:

- `/` loads with KTP form.
- `/kta` loads with KTA form.
- Province list loads from D1.
- KTP generation for 1, 10, and 100 rows succeeds.
- KTA generation for 1, 10, and 100 rows succeeds.
- KTP min age below 17 is rejected client and server side.
- KTA max age above 16 is rejected client and server side.
- `gender: MALE` produces no `PEREMPUAN` rows.
- `gender: FEMALE` produces no `LAKI-LAKI` rows.
- CSV export opens in spreadsheet software without scientific NIK notation.
- PDF export renders text on the template.
- CSV import handles the example templates.
- Rapid repeated generation eventually challenges or blocks.
- Filled honeypot blocks/challenges.

- [ ] Inspect git diff.

```bash
git status --short
git diff --stat
```

Expected: only intentional files changed.

- [ ] Final commit if any verification fixes were made.

```bash
git add .
git commit -m "test: verify generator rebuild"
```

## Definition Of Done

- KTP and KTA generation are implemented in this TanStack Start app, not dependent on the old external backend API.
- All request input is validated with Zod on the server.
- Forms use TanStack Form.
- Async server interactions use TanStack Query.
- D1 region data is used for regional fields.
- Generation honors selected card type, age range, gender, and selected provinces.
- Generated fake identity rows are not persisted by default.
- Rate limiting includes IP, visitor, user agent, request cost, bot signals, honeypot/timing signals, impossible travel, challenge state, and audit logging.
- Cloudflare Bot Management is optional, not required.
- Turnstile is supported as a challenge path when configured.
- CSV import/export and PDF export work from the browser.
- Old useful assets are present in `public/`.
- Layout and UI behavior match `docs/superpowers/plans/2026-06-12-ktp-generator-layout-ux.md`.
- Test coverage matches `docs/superpowers/plans/2026-06-12-ktp-generator-test-matrix.md`.
- `pnpm test` and `pnpm build` pass.

## Execution Notes For MiniMax AI

- Start at Task 1 and do not skip tests.
- Do not copy old files wholesale unless the task explicitly says to port constants/assets. Prefer the new file map and new types.
- Keep server code out of browser components. Anything importing `cloudflare:workers`, D1, request headers, cookies, or secrets belongs under `src/server/` or `src/utils/` server-safe helpers.
- Keep browser export code out of server modules. Anything touching `Blob`, `document`, `URL.createObjectURL`, or `File` belongs in client components/helpers.
- Do not store real generated identities in D1. Audit request metadata only.
- Use parameterized D1 queries. Never interpolate user-provided province IDs into SQL strings.
- If Turnstile credentials are missing, the app should still build and run; challenge responses should show a cooldown/rate-limit message instead of crashing.
- If Cloudflare geolocation fields are missing in local dev, impossible-travel checks should produce no risk rather than failing.
- After every task, run the exact verification command listed and fix failures before moving on.
