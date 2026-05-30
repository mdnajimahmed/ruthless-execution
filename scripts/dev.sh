#!/bin/bash
set -e

# Ensure we run from project root (directory containing backend/, frontend/, scripts/)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "🚀 Starting local development environment (project root: $ROOT)..."

# Start dev PostgreSQL (isolated from production docker-compose.images.yml)
COMPOSE_FILE="docker-compose.dev.yml"
COMPOSE_PROJECT="month-goal-tracker-dev"
echo "📦 Starting PostgreSQL container (dev only, project: $COMPOSE_PROJECT)..."
docker-compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "✅ PostgreSQL is ready!"

# Ensure backend .env exists and has correct PORT
if [ ! -f "backend/.env" ]; then
  echo "📝 Creating backend/.env from .env.example..."
  cp backend/.env.example backend/.env
else
  # Update PORT in existing .env if it's set to 3001
  if grep -q "PORT=3001" backend/.env 2>/dev/null; then
    echo "📝 Updating PORT in backend/.env from 3001 to 3002..."
    sed -i '' 's/PORT=3001/PORT=3002/g' backend/.env 2>/dev/null || sed -i 's/PORT=3001/PORT=3002/g' backend/.env
  fi
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
(cd backend && npm install)

# Generate Prisma client
echo "🔧 Generating Prisma client..."
(cd backend && npm run prisma:generate)

# Create DB schema (db push for dev — no migration files required on first run)
echo "🗄️  Syncing database schema..."
(cd backend && npx prisma db push)

# Ensure default dev user exists (email: dev@local.dev, password: dev123456)
echo "👤 Ensuring default dev user (dev@local.dev / dev123456)..."
(cd backend && npm run create-user dev@local.dev dev123456) || true

# Kill any process using port 3002
echo "🔍 Checking port 3002..."
if lsof -ti:3002 > /dev/null 2>&1; then
  echo "⚠️  Port 3002 is in use. Killing existing process..."
  lsof -ti:3002 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Start backend in development mode
echo "🔧 Starting backend server on port 3002..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  (cd frontend && npm install)
fi

# Start frontend
echo "🎨 Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✅ Development environment is running!"
echo "   Frontend: http://localhost:8080 (or next available port)"
echo "   Backend:  http://localhost:3002"
echo "   Login:    dev@local.dev / dev123456"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; lsof -ti:3002 | xargs kill -9 2>/dev/null || true; docker-compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT down; exit" INT TERM

wait
