# BrandCanvas production deployment

1. Provision managed PostgreSQL, Redis and S3-compatible object storage. Local filesystem storage is only a single-node fallback.
2. Copy `.env.example` to a secret-managed `.env.production`; rotate all authentication secrets and use internal service URLs for `DATABASE_URL` and `REDIS_URL`.
3. Run `pnpm install --frozen-lockfile`, `pnpm contracts:check`, tests and builds in CI.
4. Back up PostgreSQL before every migration. Run `pnpm db:migrate` as a single release job before starting new application containers.
5. Build the three Docker images and deploy behind a TLS reverse proxy. Set `TRUST_PROXY=true` only when the proxy is trusted and strips client-supplied forwarded headers.
6. Keep API and web origins in `WEB_ORIGINS`; use secure cookies and HTTPS in production.
7. Mount persistent local assets only for single-node deployments. Multi-node production must replace the local storage adapter with S3/R2 and a CDN.
8. Monitor `/api/v1/health`, `/api/v1/ready`, worker failures, queue depth, database connections and Redis availability.

## Backup

Use a provider snapshot plus an encrypted logical backup:

```bash
pg_dump --format=custom "$DATABASE_URL" > brandcanvas-$(date +%F).dump
```

Retain daily and monthly backups in a separate account/bucket and test restores regularly.

## Restore

Create an empty database at the required PostgreSQL version, stop writers, then run:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" brandcanvas-YYYY-MM-DD.dump
```

Run migrations, validate `/ready`, then restart API, worker and web services.
