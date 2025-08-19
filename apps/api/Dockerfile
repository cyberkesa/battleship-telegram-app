# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base
RUN apk update && apk upgrade --no-cache

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root and workspace manifests for better caching
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/game-logic/package.json packages/game-logic/package.json
COPY packages/contracts/package.json packages/contracts/package.json

# Install dependencies (workspaces)
RUN npm ci --ignore-scripts --no-audit --no-fund

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages using workspace scripts (ensure dist/types exists)
RUN npm run -w packages/shared-types build \
	&& npm run -w packages/game-logic build \
	&& npm run -w packages/contracts build

# Generate Prisma client for API schema
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build only the API workspace
RUN npx tsc -p apps/api/tsconfig.json

# Production image, copy all the files and run the app
FROM base AS runner
RUN apk update && apk upgrade --no-cache

# Create user and set workdir to API package
RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nestjs
WORKDIR /app/apps/api

ENV NODE_ENV production
ENV PORT 3000

# Copy built artifacts and necessary files
COPY --from=builder /app/node_modules /app/node_modules
# Copy only built package artifacts to shrink image size
COPY --from=builder /app/packages/shared-types/package.json /app/packages/shared-types/package.json
COPY --from=builder /app/packages/shared-types/dist /app/packages/shared-types/dist
COPY --from=builder /app/packages/game-logic/package.json /app/packages/game-logic/package.json
COPY --from=builder /app/packages/game-logic/dist /app/packages/game-logic/dist
COPY --from=builder /app/packages/contracts/package.json /app/packages/contracts/package.json
COPY --from=builder /app/packages/contracts/dist /app/packages/contracts/dist
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

# Ownership and non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Start the application (Railway will use startCommand from railway.json)
# Ensure DB schema is up-to-date before starting
CMD ["sh", "-lc", "npm run start:prod:migrate"]
