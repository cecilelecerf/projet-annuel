FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/schemas ./packages/schemas
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

WORKDIR /app/apps/api
RUN pnpm prisma generate 
RUN pnpm build

FROM node:22-alpine AS prod
RUN npm install -g prisma@7.4.0
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma/schemas ./apps/api/dist/prisma/schemas
COPY --from=build /app/apps/api/prisma/migrations ./apps/api/dist/prisma/migrations 

COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]