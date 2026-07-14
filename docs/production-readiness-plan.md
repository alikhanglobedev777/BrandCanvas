# BrandCanvas Production-Readiness Plan

Last audited: 2026-07-15

## Current-state summary

The repository currently provides:

- HttpOnly-cookie authentication with access and rotating refresh sessions for the shared administration portal.
- Super-admin store and seller provisioning, store status management, and seller session invalidation foundations.
- Seller store profile settings, secure local image processing/storage for store assets, structured theme drafts, publishing, and rollback.
- Seller catalog foundations for categories, collections, products, options, variants, and inventory adjustments.
- Generated OpenAPI clients and TanStack Query hooks used by the Next.js administration UI.
- Development PostgreSQL and Redis services through Docker Compose.

The repository does not yet provide the complete public storefront, cart, checkout, order, customer-account, discount, shipping, messaging, payment, subscription, analytics, background-job, production deployment, observability, or end-to-end test workflows required for production readiness.

## Milestone order and status

| Milestone | Scope                                                | Status   |
| --------- | ---------------------------------------------------- | -------- |
| 0         | Current-state audit and catalog repair               | Complete |
| 1         | Product images and complete inventory ledger         | Complete |
| 2         | Public multi-tenant storefront                       | Next     |
| 3         | Guest and authenticated carts                        | Pending  |
| 4         | Checkout and inventory reservations                  | Pending  |
| 5         | Orders and automatic inventory deduction/restoration | Pending  |
| 6         | Customer authentication and account area             | Pending  |
| 7         | Discounts and shipping                               | Pending  |
| 8         | Seller/customer messaging                            | Pending  |
| 9         | Payments, COD, and refunds                           | Pending  |
| 10        | SaaS plans, subscriptions, and analytics             | Pending  |
| 11        | Background jobs and notifications                    | Pending  |
| 12        | Production hardening and deployment                  | Pending  |
| 13        | Tests and CI/CD                                      | Pending  |

## Milestone 0 exit criteria

- Existing migration history is preserved and schema drift generation reports no unexpected change.
- Catalog prices use integer minor units across database, API contracts, and frontend consumers.
- Catalog relationships enforce store ownership at the database boundary.
- Categories, collections, products, options, variants, archive/restore, and inventory adjustment workflows remain functional.
- Duplicate collection ordering and invalid cross-store relationships are rejected.
- Generated contracts are deterministic.
- Focused tests, repository rules, typecheck, and production build pass.

## Milestone 1 exit criteria

- Product images are normalized, store-scoped, safely processed, deterministically ordered, variant-assignable, and stored outside PostgreSQL.
- Inventory items, movements, and reservations enforce tenant ownership and quantity invariants at the database boundary.
- Every inventory write records exact stock and reserved before/after values in an immutable ledger.
- Manual adjustments and reservation transitions use transactions, row locks, conditional updates, and idempotency keys.
- Seller product-image and inventory APIs use active-store and catalog/inventory permission guards.
- Generated contracts are deterministic and consumed by the responsive Material UI product gallery and inventory routes.
- Database, API, and web tests, repository rules, typecheck, and production build pass.

## Execution policy

Each later milestone must be implemented as one end-to-end vertical slice, including additive migrations, trusted tenant resolution, generated contracts, accessible frontend states, failure-path and tenant-isolation tests, and the narrowest relevant validation before full validation. A later milestone must not start while the current milestone has unexplained failures.

## External decisions required later

- Production S3-compatible storage provider, bucket policy, public/private asset delivery, and credentials.
- Customer email provider and sender-domain configuration.
- Online payment provider selection and credentials; no online payment path will report success before this is supplied.
- Production domains, storefront hostname convention, CORS origins, and cookie domain policy.
- Hosting platform, monitoring/error-reporting provider, and backup retention requirements.
