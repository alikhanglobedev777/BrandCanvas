FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @brandcanvas/contracts build && pnpm --filter @brandcanvas/ui build && pnpm --filter @brandcanvas/web build
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S brandcanvas && adduser -S brandcanvas -G brandcanvas
COPY --from=build --chown=brandcanvas:brandcanvas /app /app
USER brandcanvas
EXPOSE 3000
CMD ["pnpm","--filter","@brandcanvas/web","start"]
