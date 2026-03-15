# apps/web/Dockerfile

# ─── Dépendances ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# ─── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/schemas ./packages/schemas
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter schemas build

WORKDIR /app/apps/web
RUN pnpm build

# ─── Production ────────────────────────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80