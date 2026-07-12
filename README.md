# BrandCanvas

BrandCanvas is a multi-tenant e-commerce SaaS built as a pnpm + Turborepo monorepo. A BrandCanvas super admin provisions stores and seller accounts. Sellers use the shared administration portal to manage their store profile, brand assets, theme, products, and inventory.

## Applications and packages

- `apps/web`: Next.js App Router frontend for the administration portal and future storefronts
- `apps/api`: one NestJS API using the Fastify adapter
- `apps/worker`: background-worker bootstrap
- `packages/database`: PostgreSQL schema, Drizzle migrations, and database utilities
- `packages/contracts`: generated OpenAPI models, Fetch clients, and TanStack Query hooks
- `packages/ui`: centralized Material UI theme, layouts, and shared components

The frontend and backend use feature-based architecture. NestJS controllers and DTOs are the API source of truth; frontend API types and hooks are generated through OpenAPI and Orval.

## Requirements

- Node.js 22.12 or newer
- pnpm 10 or newer
- Git
- Docker Desktop with Docker Compose

## Initial PowerShell setup

```powershell
Set-Location "C:\Users\Solutyics\Desktop\BrandCanvas"
Copy-Item .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm contracts:sync
pnpm seed:super-admin
pnpm typecheck
pnpm build
pnpm dev
```

The repository already contains generated Drizzle migrations. Use `pnpm db:generate` only after deliberately changing `packages/database/src/schema.ts`.

## Local URLs

- Web: `http://localhost:3000`
- Admin and seller login: `http://localhost:3000/admin/login`
- Dashboard: `http://localhost:3000/admin/dashboard`
- Store settings: `http://localhost:3000/admin/store/settings`
- Brand assets: `http://localhost:3000/admin/store/branding`
- Theme editor: `http://localhost:3000/admin/store/theme`
- API health: `http://localhost:4000/api/v1/health`
- Swagger: `http://localhost:4000/docs`
- PostgreSQL host port: `5434`
- Redis host port: selected by setup from `6381–6390`

## Seller customization workflow

### Store settings

Seller owners and store administrators can update:

- display name and description
- support email and phone
- business address
- store policies
- default currency
- social links

Seller customization routes are protected by authentication, role checks, store membership, and active-store checks.

### Theme editor

The theme editor supports:

- primary, secondary, background, and text colors
- heading and body fonts
- header layout and style
- footer layout and text
- button and card radii
- product-card style
- local preview
- saved drafts
- immutable published versions
- rollback by republishing a historical version
- optimistic revision checks to prevent stale saves and publishes

### Logo and favicon uploads

Local development uses a storage abstraction backed by `.brandcanvas/store-assets`. Uploads:

- accept PNG, JPEG, and WebP only
- reject SVG and animated images
- validate declared type and decoded image signature
- enforce the configured file-size limit
- strip metadata by re-encoding through Sharp
- create server-controlled storage keys
- optimize logos to WebP
- create 64 × 64 PNG favicons

Configure these values in `.env` when needed:

```dotenv
STORE_ASSET_STORAGE_ROOT=../../.brandcanvas/store-assets
STORE_ASSET_PUBLIC_BASE_URL=http://localhost:4000/uploads
STORE_ASSET_MAX_BYTES=5000000
```

For production, replace the local adapter with an S3-compatible implementation of `StoreAssetStorage` and set a non-localhost public base URL.

## API contract workflow

After changing a controller, DTO, endpoint, or response shape:

```powershell
pnpm contracts:sync
pnpm --filter @brandcanvas/contracts typecheck
pnpm --filter @brandcanvas/contracts build
```

Never manually edit files under:

```text
packages/contracts/openapi
packages/contracts/src/generated
```

## Database migration workflow

After changing the Drizzle schema:

```powershell
pnpm db:generate
pnpm db:migrate
```

Never edit an already-applied migration. The seller-customization phase includes additive migrations for theme controls and complete store-profile settings.

## Validation

Run the complete seller-customization verification after contract generation and migration:

```powershell
pnpm verify:store-customization
```

Or run steps individually:

```powershell
pnpm contracts:check
pnpm --filter @brandcanvas/api test
pnpm --filter @brandcanvas/web test
pnpm typecheck
pnpm build
pnpm rules:check
```

`pnpm rules:check` rejects tracked environment backups, private key material, plain frontend stylesheets, direct frontend feature `fetch()` calls, and unapproved UI stacks.

## Security reminders

- Never commit `.env` files, backup environment files, passwords, JWT keys, or cookie secrets.
- Rotate any secret that has been pasted into chat, logs, screenshots, or issue trackers.
- Do not delete PostgreSQL or Redis volumes unless intentionally resetting local data.
- Public storefront work, carts, checkout, orders, payments, and production object storage remain future phases.
