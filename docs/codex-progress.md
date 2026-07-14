# BrandCanvas Codex Progress

Updated: 2026-07-15

## Completed milestones

- Milestone 0 — catalog repair: integer minor-unit money contracts, database-enforced catalog tenant relationships, deterministic collection ordering validation, additive migration `0006_fresh_warbird.sql`, synchronized contracts, tests, typecheck, build, and rules validation.
- Milestone 1 — product images and complete inventory ledger: normalized product images, immutable movements, reservations, seller APIs, generated clients, product gallery UI, inventory list/detail screens, additive migration `0007_lean_santa_claus.sql`, and full validation.

## Current milestone

- Milestone 2 — public multi-tenant storefront.
- No Milestone 2 implementation has started.

## Milestone 1 production changes

- Added normalized `product_images` and `inventory_reservations` tables.
- Added trusted product ownership to inventory items and complete before/after, reserved, actor, reference, idempotency, and metadata fields to inventory movements.
- Added a database trigger that rejects inventory movement updates and deletes.
- Added transactional, store-scoped product image and inventory repositories, services, mappers, DTOs, controllers, authorization, and stable errors.
- Extended the local store-asset abstraction with server-generated product image storage keys and safe Sharp re-encoding.
- Generated Seller Product Images and Seller Inventory DTOs, Fetch functions, query keys, and TanStack Query hooks.
- Added the product image gallery to product details and completed `/admin/inventory` plus `/admin/inventory/[productId]`.

## Migrations created and applied

- `packages/database/drizzle/0006_fresh_warbird.sql` — catalog money and tenant-integrity repair; applied successfully.
- `packages/database/drizzle/0007_lean_santa_claus.sql` — product images, inventory ownership, complete immutable ledger fields, reservations, constraints, indexes, backfills, and immutability trigger; applied successfully.

## Validation results

- `pnpm db:generate` — passed; no schema drift after migration generation.
- `pnpm db:migrate` — passed; migrations applied successfully.
- `pnpm contracts:sync` — passed twice after the final API shape; 130 generated files had identical SHA-256 hashes after the second run.
- `pnpm --filter @brandcanvas/database test` — passed: 1 file, 22 tests.
- `pnpm --filter @brandcanvas/api test` — passed: 12 files, 61 tests.
- `pnpm --filter @brandcanvas/web test` — passed: 6 files, 15 tests.
- `pnpm typecheck` — passed: 9/9 Turbo tasks.
- `pnpm build` — passed: 6/6 Turbo tasks; Next.js emitted both inventory routes.
- `pnpm rules:check` — passed.
- `git diff --check` — passed before this documentation update and must be rerun in the final diff review.

## Remaining limitations and risks

- Product assets currently use the existing local filesystem provider. Production still needs the S3-compatible provider/CDN decision recorded in the readiness plan.
- Reservation expiry is transactionally implemented as an authenticated operation, but automatic expiry needs a worker in the checkout/background-jobs milestones.
- Reservation conversion is the order-integration foundation; checkout and order state machines do not exist yet.
- Unit and schema tests cover stable conflict/idempotency responses and the immutability trigger; the repository uses row locks and conditional updates, but a dedicated multi-connection PostgreSQL contention suite and browser E2E suite remain future hardening work.

## Exact next action

Implement Milestone 2 as an end-to-end public multi-tenant storefront slice: trusted host/store resolution, active/published visibility, public catalog contracts, responsive storefront routes, product gallery consumption, tenant-isolation tests, generated contracts, and production validation.

## Credentials or external decisions still required

- No new credential is required for the local Milestone 2 implementation.
- Production storage, mail, payments, domains, hosting, monitoring, and backup decisions remain required before production launch.
