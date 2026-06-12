# Repository Guidelines

## Project

This is a TanStack Start app deployed on Cloudflare Workers with Cloudflare D1 for storage. Database schema lives in `src/db/schema.ts`, migrations live in `drizzle/`, and D1 helper scripts live in `scripts/`.

## Commands

- Install dependencies: `pnpm install`
- Run dev server: `pnpm dev`
- Build: `pnpm build`
- Generate migrations: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Seed remote D1: `pnpm db:seed`
- Seed local D1: `pnpm db:seed:local`

## Notes

- Region seed data comes from `cahyadsn/wilayah` and is transformed into the local `provinces`, `regencies`, `districts`, and `villages` tables.
- The committed seed file is `seeds/wilayah-seed.sql`; regenerate it from upstream with `pnpm exec tsx scripts/seed.ts --refresh`.
- Keep D1 seed logic reusable: parsing/building SQL should stay separate from executing Wrangler commands.
- Do not commit generated `.env` or local Wrangler state unless the user explicitly asks.
