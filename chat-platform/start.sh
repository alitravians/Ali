#!/bin/sh
echo "Running database migrations..."
npx prisma migrate deploy
echo "Starting server..."
exec npx tsx server.ts
