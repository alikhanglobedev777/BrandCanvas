# BrandCanvas

BrandCanvas is a multi-tenant e-commerce SaaS starter built as a pnpm + Turborepo monorepo.

## Included applications

- `apps/web`: Next.js storefront, seller dashboard, and super-admin UI
- `apps/api`: one NestJS API using the Fastify adapter
- `apps/worker`: background-worker bootstrap for BullMQ/Redis
- `packages/contracts`: shared Zod request and domain contracts
- `packages/database`: PostgreSQL schema and Drizzle tooling

## Requirements

- Node.js 22.12 or newer
- pnpm 10 or newer
- Git
- Docker Desktop with Docker Compose

## PowerShell setup

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Or run the included setup script:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup.ps1
```

## Local URLs

- Web: http://localhost:3000
- Seller/super-admin login placeholder: http://localhost:3000/admin/login
- Dashboard placeholder: http://localhost:3000/admin/dashboard
- API health: http://localhost:4000/api/v1/health
- PostgreSQL host port: 5434
- Redis host port: selected automatically from 6381–6390

## First development milestones

1. Implement super-admin authentication and seller provisioning.
2. Implement store status guards and session revocation.
3. Add store theme draft/publish workflow.
4. Add product, variant, inventory, and stock movement services.
5. Add cart, checkout, order, and stock reservation transactions.
