# KTP Generator

TanStack Start app for generating Indonesian KTP test data from seeded regional reference data.

Region data is generated from [`cahyadsn/wilayah`](https://github.com/cahyadsn/wilayah) into `seeds/wilayah-seed.sql`, then seeded into Cloudflare D1.

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
```

## Database

```sh
pnpm db:migrate
pnpm db:seed
pnpm db:seed:local
```

Refresh the committed region seed from upstream:

```sh
pnpm exec tsx scripts/seed.ts --refresh
```
