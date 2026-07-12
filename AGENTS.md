# BrandCanvas Agent Instructions

## Product overview

BrandCanvas is a multi-tenant e-commerce SaaS.

The BrandCanvas super admin creates stores and seller accounts. Sellers receive credentials, sign in through the shared administration portal, customize their store, manage products and inventory, and process orders.

Customers visit seller-specific storefronts, browse products, add products to carts, place guest or authenticated orders, track orders, and contact sellers when authenticated.

## Repository structure

- `apps/web`: Next.js App Router frontend.
- `apps/api`: One NestJS backend using the Fastify adapter.
- `apps/worker`: Background jobs and BullMQ workers.
- `packages/database`: PostgreSQL schema, Drizzle configuration, migrations, and database utilities.
- `packages/contracts`: OpenAPI document, generated TypeScript models, generated Fetch clients, generated TanStack Query hooks, and API client utilities.
- `packages/ui`: Centralized Material UI theme, layouts, and generic reusable UI components.

## General working rules

1. Read this file and inspect the existing implementation before editing.
2. Do not assume files, database columns, endpoints, scripts, or dependencies exist.
3. Preserve working authentication, generated contracts, migrations, Docker services, and existing routes.
4. Do not reset the database, delete Docker volumes, or rewrite previously applied migrations.
5. Do not commit changes unless the user explicitly asks for a commit.
6. Do not expose passwords, cookie secrets, JWT keys, database URLs, or other secrets.
7. Present terminal commands in PowerShell syntax.
8. Make small, reviewable changes instead of rewriting unrelated code.
9. Before adding a production dependency, confirm it is necessary and explain why in the final summary.
10. Never hide errors with `any`, `@ts-ignore`, disabled validation, or unsafe type assertions.
11. Do not create mock success responses for unfinished backend functionality.
12. Do not leave duplicate old routes, files, components, or implementations after a migration.
13. Preserve current behavior unless the task explicitly changes it.
14. Review `git diff` before completing the task.

## Frontend architecture rules

1. Use feature-based architecture under `apps/web/src/features`.
2. Each business feature should normally contain:
   - `pages/`
   - `ui/`
   - `hooks/`
   - `model/`
   - `lib/`
   - `index.ts`
3. Next.js files under `src/app` must remain thin route entry points.
4. A route file should normally import and render a feature page.
5. Keep feature-specific components inside the feature.
6. Put generic reusable components in `packages/ui`.
7. Examples of shared UI:
   - buttons
   - headers
   - sidebars
   - search fields
   - dialogs
   - modals
   - tables
   - pagination
   - loading states
   - empty states
   - status chips
   - form fields
8. Use Material UI as the only UI system.
9. Do not introduce Tailwind CSS, Shadcn UI, CSS Modules, styled-jsx, Sass, or plain CSS files.
10. Style with the centralized MUI theme, `sx`, or MUI `styled`.
11. Do not hardcode repeated colors, spacing, typography, shadows, or border radii inside features.
12. Add reusable tokens and component defaults to `packages/ui/src/theme`.
13. Use TanStack Query for client-side server state.
14. Use React Hook Form for complex forms when appropriate.
15. Do not manually write request or response types that duplicate backend contracts.
16. Import API DTOs, enums, operations, and hooks from `@brandcanvas/contracts`.
17. UI-only component props and view models are allowed when they do not duplicate API contracts.
18. Do not manually write Fetch or Axios API functions when generated contract functions exist.
19. Keep feature barrel files explicit. Avoid broad wildcard exports that create circular dependencies.
20. All dashboard pages must be responsive and keyboard accessible.

## Backend architecture rules

1. Use feature modules under `apps/api/src/features`.
2. Each significant feature should normally contain:
   - `controllers/`
   - `services/`
   - `repositories/`
   - `mappers/`
   - `dto/`
   - feature module
   - public `index.ts`
3. Controllers handle HTTP concerns only.
4. Services contain business rules and workflow coordination.
5. Repositories contain database operations only.
6. Mappers convert database records to domain entities and API response DTOs.
7. Do not query Drizzle directly from controllers.
8. Do not return raw database rows from controllers.
9. Do not place business logic inside DTOs, controllers, or mappers.
10. Use dependency injection for repositories and infrastructure.
11. All public controllers must use stable Swagger/OpenAPI tags.
12. Define explicit request and response DTOs for public API operations.
13. Document response types with Swagger decorators.
14. Use centralized exception handling and stable machine-readable error codes.
15. Validate all route parameters, query parameters, and request bodies.
16. Use database transactions for multi-step writes that must succeed atomically.
17. Protect seller routes with authentication, role checks, store membership, and active-store checks.

## OpenAPI and contract rules

1. NestJS DTOs and controllers are the API source of truth.
2. Generate the OpenAPI document from the backend.
3. Generate frontend types, API functions, TanStack Query hooks, and schemas through Orval.
4. Never manually edit anything under generated contract directories.
5. Never copy generated DTO types into frontend feature files.
6. After changing a controller, DTO, response, parameter, or endpoint, run:
   - `pnpm contracts:sync`
7. Ensure generated exports are accessible through `@brandcanvas/contracts`.
8. Do not work around a contract-generation failure by creating fake placeholder DTOs.
9. Generated files must remain deterministic.
10. CI and local checks must fail when contracts are stale.

## Multi-tenancy and authorization rules

1. Every seller-owned resource must be scoped to a trusted `storeId` or `tenantId`.
2. Never trust a tenant or store identifier sent by the frontend without authorization checks.
3. Resolve seller store access from the authenticated user and membership.
4. A seller must never read or modify another seller's data.
5. Super-admin access must be explicit and auditable.
6. Inactive, suspended, or archived stores must not allow seller dashboard access.
7. Deactivating a store must invalidate relevant seller sessions.
8. Public storefronts must expose only active and published stores.
9. Add tenant-isolation tests for every new seller-owned feature.

## Authentication and security rules

1. Preserve the current HttpOnly cookie authentication design.
2. Preserve short-lived access tokens and rotating refresh sessions.
3. Preserve JWT key IDs and key-ring support.
4. Preserve CSRF protection for authenticated mutations.
5. Hash passwords securely; never store or log plain passwords.
6. Never expose session tokens to browser JavaScript.
7. Apply rate limiting to login, refresh, password reset, and sensitive endpoints.
8. Validate file uploads by actual type, extension, size, and authorization.
9. Never allow arbitrary JavaScript, HTML, CSS, or executable files in seller theme settings.
10. Avoid returning sensitive internal error details to clients.

## Database and inventory rules

1. PostgreSQL is the source of truth.
2. Use Drizzle for schema, queries, migrations, and transactions.
3. Generate additive migrations; never edit an applied migration.
4. Monetary values must use integer minor units or precise database numeric types, never floating-point JavaScript arithmetic.
5. Inventory must support:
   - stock quantity
   - reserved quantity
   - available quantity
   - low-stock threshold
6. Do not permanently reduce stock when a product is merely added to a cart.
7. Use stock reservations during checkout.
8. Permanently deduct inventory only at the correct order/payment transition.
9. Prevent inventory from becoming negative with atomic database operations.
10. Record every inventory change in an inventory movement audit table.
11. Restore inventory correctly for cancelled orders and sellable returns.
12. Calculate in-stock, low-stock, and out-of-stock status from inventory values.

## Testing rules

1. Add or update tests for changed business behavior.
2. Include authorization and tenant-isolation tests.
3. Include failure-path tests, not only success-path tests.
4. For inventory and checkout, include concurrency and idempotency tests.
5. Do not claim a feature is complete without running the relevant checks.
6. Run the narrowest relevant tests first, then full validation.

## Required validation commands

Run these when relevant:

- `pnpm contracts:sync`
- `pnpm typecheck`
- `pnpm build`
- package-specific tests
- end-to-end tests when present

For database schema changes also run:

- `pnpm db:generate`
- `pnpm db:migrate`

## Definition of done

A task is complete only when:

1. The requested behavior is implemented end to end.
2. Existing behavior has not regressed.
3. Database changes include valid migrations.
4. OpenAPI and generated contracts are synchronized.
5. Frontend uses generated contracts rather than handwritten API types.
6. Authorization and tenant isolation are enforced in the backend.
7. Loading, empty, success, and error states are handled.
8. Relevant tests pass.
9. `pnpm typecheck` passes.
10. `pnpm build` passes.
11. The final response lists:
    - what changed
    - important files changed
    - migrations created
    - commands executed
    - test/build results
    - remaining risks or unfinished work
