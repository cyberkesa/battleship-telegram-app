#!/bin/bash

echo "🚀 Starting database migration..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Push schema changes (if needed)
echo "📤 Pushing schema changes..."
npx prisma db push

echo "✅ Database migration completed!"
