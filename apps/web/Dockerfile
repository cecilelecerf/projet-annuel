# apps/web/Dockerfile

# ─── Dépendances ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
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
COPY tsconfig.base.json ./

ARG VITE_API_URL=/api
RUN echo "VITE_API_URL=${VITE_API_URL}" > /app/.env.prod

WORKDIR /app/packages/schemas
RUN pnpm build

WORKDIR /app/apps/web
RUN pnpm build

# ─── Production ────────────────────────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80