FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY tsconfig.base.json ./
RUN bun install --frozen-lockfile
COPY apps/web apps/web
WORKDIR /app/apps/web
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
