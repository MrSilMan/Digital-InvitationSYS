# syntax=docker/dockerfile:1

# Phase 1: development image only (`docker compose --profile app`).
# Phase 10 adds the production stages: standalone build, non-root runtime, HEALTHCHECK, worker target.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# glibc compatibility for native packages that expect it on Alpine (musl).
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
