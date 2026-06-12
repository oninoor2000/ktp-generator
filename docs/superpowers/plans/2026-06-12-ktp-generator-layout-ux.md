# KTP Generator Layout And UX Plan

> Companion to `docs/superpowers/plans/2026-06-12-ktp-generator-rebuild.md`. Read this before implementing Task 10 and Task 11.

**Goal:** Define the route layout, responsive structure, visible states, and interaction rules for the rebuilt KTP/KTA generator so implementation agents do not improvise the UI.

**Design Direction:** This is an operational data-generation tool, not a marketing landing page. The first screen must be the usable generator. Prioritize dense, scannable controls, clear validation, stable table/export actions, and restrained visual styling.

**Language Direction:** Visible generator UI copy should use Bahasa Indonesia consistently because the product generates Indonesian identity card data. Internal enum values, route paths, and implementation identifiers may remain in English where needed.

---

## Product Routes

Routes:

- `/` - KTP generator.
- `/kta` - KTA generator.
- `/admin/security` or `/admin/security` equivalent generated from `src/routes/admin.security.tsx` - env-gated diagnostics only.

Shared route layout:

- Top navigation remains visible on both generator routes.
- Main content starts immediately below navigation; no hero card or marketing section.
- Each route uses the same `GeneratorPage` component with `cardType="KTP"` or `cardType="KTA"`.
- Route state is isolated by card type:
  - KTP settings persist under KTP localStorage keys.
  - KTA settings persist under KTA localStorage keys.
  - Generated KTP rows do not appear on `/kta`.
  - Generated KTA rows do not appear on `/`.

## Page Shell

Desktop shell:

- Root `main`: full width, minimum screen height, `bg-background`, `text-foreground`.
- Inner container: `max-w-7xl`, centered, horizontal padding `px-4 sm:px-6 lg:px-8`, vertical padding `py-5 sm:py-6`.
- Header row:
  - Left: product name `KTP Generator`, route subtitle, small fake-data disclaimer.
  - Right: nav links, theme toggle.
  - Header has bottom border, not a floating card.
- Content grid:
  - Two columns at `lg` and above.
  - Left column fixed/controlled width around `420px`.
  - Right column flexible preview area.
  - Suggested class: `grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]`.

Tablet shell:

- Two columns may remain if viewport is at least `md` and content does not feel cramped.
- Prefer single column below `lg` if the province selector/table creates horizontal pressure.

Mobile shell:

- Single column.
- Form appears before preview.
- Header nav wraps cleanly.
- Primary actions use full-width buttons.
- Table area scrolls horizontally inside the preview section without causing the whole page to overflow.

## Visual Language

Use the current project's shadcn/ui components and CSS variables.

Rules:

- Keep cards at `rounded-md` or 8px radius maximum.
- Do not nest cards inside cards.
- Do not use decorative gradient orb/blob backgrounds.
- Do not make a landing-page hero.
- Do not make the palette a one-note blue/purple/pink gradient page.
- KTP and KTA can have small accent colors, but neutral UI should dominate.
- Use lucide icons in action buttons:
  - Generate: `Sparkles` or `Play`
  - CSV export: `FileSpreadsheet`
  - PDF export: `FileText`
  - Upload: `Upload`
  - Template download: `Download`
  - Challenge/security: `ShieldAlert`
  - Clear data: `Trash2`
- Avoid text-only icon substitutes when a standard icon exists.

Recommended accents:

- KTP: restrained cyan/emerald accent for selected chips and status.
- KTA: restrained rose/amber accent for selected chips and status.
- Security/challenge: amber for challenge, red for block, green for allowed/success.

## Header And Navigation

Header content:

- Product title: `KTP Generator`.
- Route label:
  - KTP: `Buat data KTP dummy untuk pengujian dan pengembangan.`
  - KTA: `Buat data KTA anak dummy untuk pengujian dan pengembangan.`
- Disclaimer: `Data yang dihasilkan bersifat palsu dan hanya boleh digunakan untuk pengujian, pengembangan, dan mockup.`

Navigation:

- Use two route links: `KTP` and `KTA`.
- Active route uses a clear active state with underline or filled subtle background.
- Theme toggle remains on the right on desktop and wraps under nav on narrow mobile if needed.
- Do not hide navigation behind a menu unless it becomes necessary on very narrow screens.

## Generator Form Layout

Component: `src/features/generator/components/generator-form.tsx`

Section structure:

- Top title row:
  - Icon.
  - `Generator Data KTP` or `Generator Data KTA`.
  - Short subtitle.
- Fields:
  - `Jumlah Data`
  - `Usia Minimum`
  - `Usia Maksimum`
  - `Jenis Kelamin`
  - `Provinsi`
  - Hidden honeypot.
  - Hidden `clientStartedAt`.
- Primary action:
  - Generate button.
  - Full width inside the form.
  - Shows spinner and `Sedang membuat...`/`Memuat data...` while pending.

Field layout:

- Data count: full width.
- Age fields: two columns on `sm` and above, one column on mobile.
- Gender: segmented control or select.
  - Recommended: segmented control with `MALE`, `FEMALE`, `BOTH` labels as `Laki-laki`, `Perempuan`, `Keduanya`.
- Province selector:
  - Multi-select combobox.
  - Shows selected province chips.
  - Search input inside popover.
  - Select all and clear actions if easy to implement without complexity.

Validation UX:

- Client validation runs before submit.
- Server validation errors are mapped back to field-level messages where possible.
- Error text appears below the field with `aria-describedby`.
- Invalid inputs receive `aria-invalid`.
- Submit remains enabled unless a request is pending, but invalid submit should focus the first invalid field.

Defaults:

- KTP: 10 rows, min age 18, max age 60, gender both, Jakarta selected if present.
- KTA: 10 rows, min age 1, max age 16, gender both, Jakarta selected if present.
- If Jakarta is missing from D1, select the first province by name and do not crash.

## Province Selector States

Loading:

- Disabled trigger.
- Spinner or skeleton text: `Memuat provinsi...`.

Loaded:

- Trigger shows selected count:
  - `1 province selected`
  - `3 provinces selected`
- Selected chips appear below trigger or inside trigger if compact.

Empty/error:

- If D1 province list fails, show alert with retry button.
- Do not allow generation without at least one valid province.

Large selection:

- If more than 4 chips are selected, collapse visual chips to first 3 plus `+N`.
- Keep all selected values available to screen readers via text.

## Preview Layout

Component: `src/features/generator/components/data-preview.tsx`

Empty state:

- Appears in the preview column.
- Shows concise message:
  - KTP: `Belum ada data KTP. Hasilkan data atau impor template CSV.`
  - KTA: `Belum ada data KTA. Hasilkan data atau impor template CSV.`
- Includes CSV upload/template area below the message.
- Do not use large decorative illustration.

Generated state:

- Header row:
  - Left: `Preview Data KTP` / `Preview Data KTA`.
  - Subtext: `<count> data berhasil dibuat`.
  - Right: CSV export, PDF export, clear data buttons.
- Table:
  - Horizontal scroll container.
  - Sticky header if straightforward.
  - `#` column.
  - Fields differ by card type.
  - Do not truncate NIK by default; allow horizontal scroll.
- Pagination:
  - Default 10 rows/page.
  - Buttons: previous/next icons or compact text.
  - Current range text: `Menampilkan 1-10 dari 100`.
- Summary:
  - Four compact metric blocks:
    - Total rows.
    - Male count.
    - Female count.
    - Province count.
  - Metrics must count uppercase generated gender values.

Preview table fields:

KTP:

- `nik`
- `name`
- `birthDatePlace`
- `gender`
- `address`
- `rtRw`
- `village`
- `district`
- `city`
- `province`
- `religion`
- `maritalStatus`
- `occupation`
- `bloodType`

KTA:

- `nik`
- `name`
- `birthDatePlace`
- `gender`
- `familyCertificateNumber`
- `headFamilyName`
- `birthCertificateNumber`
- `religion`
- `nationality`
- `address`
- `rtRw`
- `village`
- `district`
- `city`
- `province`
- `validityPeriod`
- `bloodType`

## CSV Upload Layout

Component: `src/features/generator/components/csv-upload.tsx`

Placement:

- In empty preview state, visible below empty message.
- In generated state, available as a secondary action in the preview area if space allows.

Controls:

- Upload CSV button.
- Download template button.
- Hidden file input.

States:

- Idle: both buttons enabled.
- Parsing: upload button disabled, spinner visible.
- Success: show imported row count and warning count.
- Error: show first 5 errors and a count of remaining errors.
- Warnings: show first 5 warnings and a count of remaining warnings.

Instruction text:

- Keep concise.
- Mention date format and Excel-safe NIK format.
- Avoid a long ordered tutorial in the primary screen if it crowds the layout.

## Export UX

CSV export:

- Disabled when no data.
- Downloads immediately.
- Toast success/failure.
- File naming:
  - `Data_KTP_<yyyy-mm-dd>.csv`
  - `Data_KTA_<yyyy-mm-dd>.csv`

PDF export:

- Disabled when no data.
- Shows progress for large batches.
- Must not freeze the UI for 100+ rows.
- Uses template PNG from `public/`.
- File naming:
  - `KTP_Data_<count>_<yyyy-mm-dd>.pdf`
  - `KTA_Data_<count>_<yyyy-mm-dd>.pdf`

Clear data:

- Secondary/destructive button.
- Confirm if generated row count is greater than 0.
- Clears local React state only, not preferences.

## Challenge And Rate Limit UX

Component: `src/features/generator/components/challenge-panel.tsx`

Challenge required:

- Appears above or inside the form action area.
- Does not replace the whole page.
- Shows:
  - `Additional verification required`
  - Brief reason: `This request looks unusual or exceeds anonymous generation limits.`
  - Turnstile widget if site key is configured.
  - Retry button after token is solved.

Rate limited:

- Shows cooldown message.
- Disable generate until `retryAfterSeconds` expires if provided.
- Do not repeatedly auto-submit.

Blocked:

- Shows clear blocked state.
- Do not expose sensitive security reasons or exact scoring.
- User-facing message: `Generation is temporarily unavailable for this browser or network. Try again later.`

Security event visibility:

- Normal users should not see risk score.
- Developers can inspect risk score only in admin diagnostics or console during local dev.

## Loading And Error States

Initial page loading:

- Header renders immediately.
- Form may show skeleton for province selector.
- Preview empty state can render before provinces load.

Generation pending:

- Disable fields that would change submitted payload.
- Keep navigation usable.
- Show pending state in generate button.

Server validation error:

- Map known field errors to fields.
- Unknown server errors show an alert above the form.

D1/region failure:

- Show alert in form area.
- Disable generate.
- Provide retry for province query.

PDF asset missing:

- Toast error: `Template image could not be loaded.`
- Do not crash page.

## Accessibility Requirements

Required:

- `html lang="id"` in root document.
- Every input has an accessible label.
- Every error message is associated with the field.
- Keyboard navigation works for province selector, tabs/nav, buttons, and file upload.
- Focus moves to first invalid field on failed submit.
- Toasts are not the only place important errors appear; persistent inline errors are required for validation/challenge/rate limit.
- Color is not the only indicator of active route, validation error, or challenge state.
- Buttons have stable dimensions while loading.

Recommended:

- Use `aria-live="polite"` for generation status and export progress.
- Use `aria-busy` on form/preview sections while pending.

## Responsive Acceptance Checklist

Desktop `1440x900`:

- Form and preview visible side by side.
- Header nav and theme toggle fit in one row.
- Table does not overflow the page; only table container scrolls horizontally.
- Export buttons remain visible.

Laptop `1280x800`:

- Form column is not wider than necessary.
- Preview remains readable.
- No nested scroll traps except table horizontal scroll.

Tablet `768x1024`:

- Single-column layout is acceptable.
- Form appears before preview.
- Province popover does not exceed viewport width.

Mobile `390x844`:

- No horizontal page overflow.
- Buttons fit text without clipping.
- Selected province chips wrap or collapse.
- Table scroll is discoverable.
- Header/nav wraps without overlapping.

Small mobile `320x568`:

- Text does not overlap.
- Primary button remains usable.
- Challenge panel and validation errors fit.

## Visual QA Steps

Run after Task 11:

```bash
pnpm dev
```

Open the dev URL and capture/check these viewports:

- `1440x900`
- `768x1024`
- `390x844`
- `320x568`

Manual checks:

- KTP route empty state.
- KTP route with generated data.
- KTA route empty state.
- KTA route with generated data.
- Province selector open.
- Validation errors visible.
- Challenge panel visible if mocked/triggered.
- PDF export progress for at least 25 rows.

Layout fails if:

- The page has unintended horizontal overflow on mobile.
- Text overlaps another element.
- Button text clips.
- Table overflow makes the whole body scroll horizontally.
- The first screen is marketing copy instead of the usable generator.
- Error/challenge state is visible only in toast.

## Implementation Notes

- Start with semantic structure, then apply styling.
- Keep the UI close to the current project's shadcn style rather than the old app's heavy gradients.
- Do not port old React Hook Form components. Rebuild form fields around TanStack Form.
- Keep route layout shared; avoid two near-duplicate route components.
- Prefer smaller focused components over one large generator page file.
