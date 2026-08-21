FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY tsconfig.base.json ./
RUN bun install --frozen-lockfile
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN bunx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "bunx prisma migrate deploy && bun src/server.ts"]
