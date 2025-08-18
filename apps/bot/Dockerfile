# Build and run Telegram bot
FROM node:20-alpine AS base
WORKDIR /app

# Install workspace deps
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/bot/package.json apps/bot/package.json

RUN npm ci --ignore-scripts

# Copy sources
COPY . .

# Build shared types and bot
RUN npm run -w packages/shared-types build \
 && npm run -w apps/bot build

# Runtime
ENV NODE_ENV=production
WORKDIR /app/apps/bot

CMD ["node", "dist/main.js"]

