FROM node:24-slim AS build

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN DATABASE_URL="file:./unused-at-build-time.db" pnpm exec prisma generate
RUN pnpm build

FROM node:24-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.output ./.output
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/electron/database.mjs ./electron/database.mjs
COPY scripts/apply-migrations.mjs ./scripts/apply-migrations.mjs
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && \
    mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
