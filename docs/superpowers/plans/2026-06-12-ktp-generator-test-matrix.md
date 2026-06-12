# KTP Generator Test Matrix

> Companion to `docs/superpowers/plans/2026-06-12-ktp-generator-rebuild.md`. Read this before writing tests for implementation tasks.

**Goal:** Define comprehensive but pragmatic test coverage for the KTP/KTA rebuild. Write tests before implementation for behavior-bearing code.

**Testing Strategy:** Maximize coverage around pure domain logic, validation, D1 query boundaries, generation server functions, and abuse controls. Keep visual/component tests focused on critical workflows. Do not spend time testing static shadcn wrappers or CSS-only details.

---

## Test Tools

Current baseline:

- Node built-in test runner via `tsx --test`.
- Existing command: `pnpm test`.

Recommended additions when UI/component tests begin:

```bash
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom playwright
```

Recommended scripts:

```json
{
  "test": "tsx --test scripts/seed.test.ts src/**/*.test.ts src/**/*.test.tsx",
  "test:unit": "tsx --test src/**/*.test.ts",
  "test:ui": "tsx --test src/**/*.test.tsx",
  "test:e2e": "playwright test",
  "test:all": "pnpm test && pnpm build && pnpm test:e2e"
}
```

Only add Playwright once the app can run enough for browser smoke testing.

## Test Boundaries

Unit tests:

- Pure functions only.
- No D1, no DOM, no network.
- Best for generation, CSV, formatting, risk scoring, hashing helper behavior.

Integration tests:

- One boundary at a time.
- Mock D1 for server functions and query helpers.
- Mock Turnstile fetch.
- Do not hit real Cloudflare services.

Component tests:

- Use React Testing Library.
- Test form validation, mutation state, challenge panel, import/export button states.
- Mock server functions and browser APIs.

Browser smoke tests:

- Use Playwright against `pnpm dev`.
- Test actual route rendering and end-user flows.
- Keep smoke tests few and high-signal.

Manual visual QA:

- Use the layout plan checklist after UI work.
- Manual checks are not a substitute for unit/integration tests.

## Coverage By Feature

| Feature | Unit Tests | Integration Tests | Component Tests | Browser Smoke |
| --- | --- | --- | --- | --- |
| Zod settings validation | Required | Server handler rejects invalid input | Form maps errors | Invalid ages blocked |
| Domain generation | Required | Server returns generated rows | Preview receives rows | Generate KTP/KTA |
| NIK/date/format helpers | Required | Covered through server generation | Not needed | Spot-check generated row |
| D1 region query | Query mapping with fake D1 | Required with mocked D1 | Province selector loading/error | Province list loads |
| Rate limiter/risk model | Required | Required with mocked D1 | Challenge panel state | Rapid generation challenges |
| Turnstile verifier | Required with mocked fetch | Required through limiter | Challenge solve/resubmit | Optional if configured |
| CSV import/export | Required | Optional server-free | Upload success/error | Import template/export CSV |
| PDF export mapping | Required for field mapping | Not needed unless server PDF added | Button disabled/progress | Export PDF opens/downloads |
| Preferences/localStorage | Required with storage shim | Not needed | Defaults and persistence | Reload keeps settings |
| Layout/responsive | Not unit-tested | Not needed | Minimal accessibility checks | Required visual smoke |
| Admin security page | Query formatting helpers | Required env-gated server fn | Basic render | Optional local-only |

## Task-Specific Test Requirements

### Task 2: Domain Types And Validation

Test file:

- `src/features/generator/domain/schemas.test.ts`

Required tests:

- `accepts valid KTP settings`
- `accepts valid KTA settings`
- `rejects KTP minimum age below 17`
- `rejects KTA maximum age above 16`
- `rejects max age lower than min age`
- `rejects data count above 1000`
- `rejects empty province selection`
- `rejects invalid province id format`
- `rejects filled honeypot`
- `accepts empty honeypot`
- `rejects stale clientStartedAt older than one hour` if schema enforces freshness directly

Example structure:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { generatorSettingsSchema } from "./schemas";

test("rejects KTP minimum age below 17", () => {
  const result = generatorSettingsSchema.safeParse({
    cardType: "KTP",
    dataCount: 10,
    minAge: 16,
    maxAge: 60,
    gender: "BOTH",
    provinceIds: ["31"],
    honeypot: "",
  });

  assert.equal(result.success, false);
  assert.match(String(result.error), /KTP minimum age/i);
});
```

### Task 3: Pure Generation Logic

Test file:

- `src/features/generator/domain/generate.test.ts`

Required tests:

- `generateNik encodes male birth day without offset`
- `generateNik encodes female birth day with plus 40 offset`
- `generateNik uses province id and trailing regency/district codes`
- `getBirthPlace strips Kabupaten prefix`
- `getBirthPlace strips Kota prefix`
- `formatDateDDMMYYYY pads day and month`
- `generateKtpRows honors MALE gender setting`
- `generateKtpRows honors FEMALE gender setting`
- `generateKtpRows uppercases official text fields`
- `generateKtpRows sets lifetime validity`
- `generateKtaRows sets validity to seventeenth birthday`
- `generateKtaRows includes family certificate, head family, and birth certificate fields`
- `generateKtpRows returns one row per supplied region`

Use deterministic inputs where possible. If Faker randomness is hard to stabilize, inject a random provider.

### Task 4: D1 Region Query Layer

Test file:

- `src/utils/regions.test.ts`

Required tests:

- Existing `fetchRegionSummaryFromDb returns counts and sample provinces`.
- `fetchProvincesFromDb returns provinces ordered by name`.
- `fetchRandomRegionalRowsFromDb maps joined rows into nested RegionalData`.
- `fetchRandomRegionalRowsFromDb filters by selected province ids`.
- `fetchRandomRegionalRowsFromDb handles no rows`.
- `fetchRandomRegionalRowsFromDb uses bound parameters for province ids and limit`.

Mock D1 shape:

```ts
const db = {
  prepare(query: string) {
    return {
      bind(...values: unknown[]) {
        return {
          async all() {
            return result(fakeRows);
          },
        };
      },
      async all() {
        return result(fakeRows);
      },
    };
  },
};
```

Assertions:

- Inspect collected SQL for `?` placeholders.
- Inspect collected bind values for province IDs and limit.

### Task 5: Rate Limiter Schema

No behavioral unit test is required for static Drizzle table declarations, but run:

```bash
pnpm db:generate
pnpm build
```

Manual schema review:

- Tables exist in generated migration.
- Indexes exist for visitor/time and IP/time lookups.
- No raw IP or raw user agent column is added.

### Task 6: Request Context And Hashing

Test file:

- `src/server/security/hash.test.ts`

Required tests:

- `hmacHex returns stable lowercase hex for same secret and input`
- `hmacHex changes when secret changes`
- `hmacHex changes when input changes`
- `sha256Hex returns stable lowercase hex`
- `verify signed visitor cookie accepts valid signature`
- `verify signed visitor cookie rejects tampered visitor id`
- `verify signed visitor cookie rejects tampered signature`

Request context integration tests are optional because TanStack Start request helpers require runtime context. Keep that API isolated so most security logic can be tested without it.

### Task 7: Risk Model

Test file:

- `src/server/security/risk-model.test.ts`

Required tests:

- `allows low-risk normal generation`
- `allow_with_audit for medium request volume`
- `challenges when visitor exceeds ten minute request threshold`
- `blocks when daily visitor cost budget is exceeded`
- `blocks when daily IP cost budget is exceeded`
- `high bot score does not add bot penalty`
- `low bot score adds high bot penalty`
- `missing user agent adds suspicious header penalty`
- `missing accept language adds suspicious header penalty`
- `verified bot can read GET scope but cannot POST generation without challenge`
- `filled honeypot reaches block or challenge threshold`
- `too-fast first submit adds timing penalty`
- `valid Turnstile reduces challenge-level risk`
- `valid Turnstile does not override hard daily budget`
- `impossible travel alone does not hard block`
- `impossible travel plus UA churn reaches challenge threshold`
- `rapid country change without coordinates adds medium risk`
- `request cost scales with requested count`

Distance/speed expectations:

- Jakarta to New York within 10 minutes should trigger impossible travel.
- Jakarta to Bandung over 6 hours should not trigger impossible travel.

### Task 8: D1 Rate Limiter Orchestration

Test file:

- `src/server/security/rate-limiter.test.ts`

Required tests:

- `first normal generation is allowed and inserts decision audit`
- `allowed request updates visitor reputation`
- `challenge response records challenge decision`
- `blocked response records blocked decision`
- `excess visitor ten minute bucket challenges`
- `excess IP ten minute bucket challenges`
- `excess visitor daily cost blocks`
- `failed Turnstile challenge increments failed challenge count`
- `valid Turnstile allows challenge-level request`
- `valid Turnstile still blocks hard limit`
- `generation audit inserts generated count after successful generation`
- `cleanup deletes expired challenges`
- `cleanup deletes stale buckets`

Mocking rules:

- Use fake D1 with prepared statement recording.
- Use fake `verifyTurnstileToken`.
- Use fixed `now` timestamp.
- Do not call real Cloudflare APIs.

### Task 9: Generation Server Function

Test file:

- `src/server/generation.test.ts`

Required tests:

- `rejects invalid settings before querying regions`
- `returns challenge response before querying regions`
- `returns rate_limited response before querying regions`
- `queries D1 regions after allow decision`
- `generates KTP rows for valid KTP request`
- `generates KTA rows for valid KTA request`
- `audits successful generation request`
- `does not persist generated fake identity rows`
- `returns generated count metadata`
- `handles empty region result with safe error`

Mocking:

- Export a handler that accepts injected `db`, `secret`, and limiter function.
- Test server function wrapper lightly if possible, but handler coverage is the priority.

### Task 10: TanStack Query And Form UI

Test files:

- `src/features/generator/hooks/use-generator-preferences.test.ts`
- `src/features/generator/components/generator-form.test.tsx`
- `src/features/generator/components/province-multi-select.test.tsx`
- `src/features/generator/components/challenge-panel.test.tsx`

Required hook tests:

- `returns KTP defaults when localStorage is empty`
- `returns KTA defaults when localStorage is empty`
- `loads saved KTP settings`
- `loads saved KTA settings`
- `ignores invalid localStorage JSON and returns defaults`
- `saves settings without generated rows`

Required form tests:

- `renders KTP age defaults`
- `renders KTA age defaults`
- `shows validation error for KTP min age below 17`
- `shows validation error for KTA max age above 16`
- `requires at least one province`
- `submits normalized settings payload`
- `disables submit while generation is pending`
- `focuses first invalid field after invalid submit`

Required province selector tests:

- `shows loading state`
- `shows error state with retry`
- `selects and clears a province`
- `collapses selected chips after four selections`

Required challenge panel tests:

- `shows challenge-required message`
- `renders Turnstile container when site key exists`
- `shows cooldown message when Turnstile is unavailable`
- `does not expose risk score to normal users`

### Task 11: Preview, CSV, And PDF Export

Test files:

- `src/features/generator/domain/csv.test.ts`
- `src/features/generator/components/data-preview.test.tsx`
- `src/features/generator/components/csv-upload.test.tsx`
- `src/features/generator/components/pdf-export.test.ts`

Required CSV domain tests:

- `generates KTP template with expected headers`
- `generates KTA template with expected headers`
- `parses Excel-safe NIK formula`
- `parses quoted comma inside address`
- `strict mode rejects invalid NIK`
- `repair mode replaces invalid NIK and records warning`
- `rejects invalid gender`
- `rejects invalid blood type`
- `derives KTA validity from birth date when missing`
- `serializes KTP rows with Excel-safe NIK`
- `serializes KTA rows with Excel-safe NIK and KK`

Required preview tests:

- `empty state shows CSV upload`
- `generated state shows export buttons`
- `CSV and PDF buttons disabled with no data`
- `summary counts uppercase LAKI-LAKI and PEREMPUAN`
- `paginates rows`
- `clear data calls confirmation or clear callback`

Required CSV upload tests:

- `rejects non CSV file extension`
- `imports valid KTP CSV`
- `imports valid KTA CSV`
- `shows first five errors`
- `shows warning count`
- `downloads template for current card type`

Required PDF export tests:

- `maps KTP field values to template labels`
- `maps KTA field values to template labels`
- `converts percentage position to PDF coordinates`
- `uses alignment offset for center and right text`
- `throws clear error when template fetch fails`

Do not assert exact binary PDF bytes. Test mapping and error behavior.

### Task 12: SEO, Navigation, And Static Metadata

Test file:

- `src/routes/__root.test.tsx` if route head can be tested cleanly.

Required tests if practical:

- `root document uses lang id`
- `navigation links include KTP and KTA`
- `active route has non-color-only indicator`

If route head testing is awkward, cover this with browser smoke and manual review.

### Task 13: Security Admin Diagnostics

Test files:

- `src/server/security/admin.test.ts`
- `src/routes/admin.security.test.tsx` if component test setup exists.

Required tests:

- `returns unauthorized or not found when SECURITY_ADMIN_ENABLED is not true`
- `returns latest security events when enabled`
- `returns latest rate limit decisions when enabled`
- `returns decision aggregates for last 24 hours`
- `does not expose raw IP or raw user agent`
- `handles malformed metadata JSON without crashing`

### Task 14: Final Verification

Required command sequence:

```bash
pnpm test
pnpm build
pnpm dev
```

If Playwright exists:

```bash
pnpm test:e2e
```

## Browser Smoke Tests

Recommended Playwright file:

- `tests/e2e/generator.spec.ts`

Required smoke cases:

- `KTP route generates one row`
- `KTP route rejects min age below 17`
- `KTP route honors male gender selection`
- `KTP route exports CSV`
- `KTA route generates one row`
- `KTA route rejects max age above 16`
- `KTA route honors female gender selection`
- `KTA route imports template CSV`
- `rapid generation eventually shows challenge or rate limit state`
- `mobile viewport has no body horizontal overflow`

Suggested Playwright assertions:

```ts
await expect(page.getByRole("heading", { name: /Generator Data KTP/i })).toBeVisible();
await page.getByRole("button", { name: /Generate/i }).click();
await expect(page.getByText(/rows generated|data .* berhasil/i)).toBeVisible();
```

Mobile overflow assertion:

```ts
const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
expect(hasOverflow).toBe(false);
```

## Manual Integration Checks

Run manually if automated browser tests are not added yet:

- Seeded D1 is available locally.
- `/` loads province selector data.
- `/kta` loads province selector data.
- KTP generation works for 1, 10, and 100 rows.
- KTA generation works for 1, 10, and 100 rows.
- Gender filters produce only selected gender.
- CSV export preserves NIK as text in spreadsheet software.
- CSV upload imports the committed example templates.
- PDF export downloads and visually places text on template.
- Rate limiter challenges or blocks rapid repeated generation.
- Filled honeypot challenges or blocks.
- No raw IP or user agent is visible in admin diagnostics.

## Tests To Avoid

Avoid these unless a regression proves they are necessary:

- Snapshot tests for entire pages.
- Tests for shadcn component internals.
- Exact CSS class tests except active route/accessibility state where no better assertion exists.
- Exact random Faker output tests.
- Exact PDF binary output tests.
- Real network calls to Turnstile or Cloudflare during automated tests.

## Minimum Merge Gate

Before considering the rebuild complete:

- All domain tests pass.
- All security/rate limiter tests pass.
- Server generation tests pass.
- At least one component test covers the form validation flow.
- At least one component test covers preview/export disabled/enabled states.
- Browser smoke passes for KTP and KTA happy paths.
- `pnpm build` passes.

If time is constrained, prioritize in this order:

1. Zod validation and generation unit tests.
2. Risk model and limiter tests.
3. Server generation integration tests.
4. CSV import/export tests.
5. Form and preview component tests.
6. Browser smoke tests.
7. Admin diagnostics tests.
