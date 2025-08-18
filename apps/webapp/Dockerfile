# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps using workspaces cache
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/game-logic/package.json packages/game-logic/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/webapp/package.json apps/webapp/package.json

RUN npm ci --ignore-scripts

# Copy sources and build
COPY . .

# Build shared packages first so webapp can bundle them
RUN npm run -w packages/shared-types build \
 && npm run -w packages/game-logic build \
 && npm run -w packages/ui build \
 && npm run -w apps/webapp build

# Runtime stage (static)
FROM nginx:1.27-alpine AS runner

# SPA routing
COPY apps/webapp/nginx.conf /etc/nginx/conf.d/default.conf

# Static files
COPY --from=builder /app/apps/webapp/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

