FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @brandcanvas/database build && pnpm --filter @brandcanvas/worker build
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production WORKER_ENABLED=true
RUN addgroup -S brandcanvas && adduser -S brandcanvas -G brandcanvas
COPY --from=build --chown=brandcanvas:brandcanvas /app /app
USER brandcanvas
CMD ["node","apps/worker/dist/main.js"]
