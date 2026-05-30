#!/bin/bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Read app name and version from version.json
APP_NAME=$(node -e "process.stdout.write(require('./version.json').appName)")
VERSION=$(node -e "process.stdout.write(require('./version.json').version)")

IMAGE_REPO="ivplay4689/turinghatch"
FE_TAG="${APP_NAME}-fe-${VERSION}"
BE_TAG="${APP_NAME}-be-${VERSION}"

# VITE_API_URL must be set for production FE builds (baked in at build time by Vite)
# Pass via env var: VITE_API_URL=https://api.yourdomain.com ./scripts/docker-push.sh
if [ -z "${VITE_API_URL}" ]; then
  echo "⚠️  VITE_API_URL not set — using default http://localhost:9559/api"
  VITE_API_URL="http://localhost:9559/api"
fi

# Multi-platform: linux/amd64 + linux/arm64 (covers Intel/AMD, Apple Silicon, ARM servers)
PLATFORMS="linux/amd64,linux/arm64"

# Ensure buildx builder exists
if ! docker buildx inspect multiarch &>/dev/null; then
  echo "🔧 Creating buildx builder 'multiarch'..."
  docker buildx create --name multiarch --use --driver docker-container || true
fi
docker buildx use multiarch 2>/dev/null || docker buildx use default

echo "🐳 Building and pushing Docker images (${PLATFORMS})..."
echo "   Repo:    ${IMAGE_REPO}"
echo "   FE tag:  ${FE_TAG}"
echo "   BE tag:  ${BE_TAG}"
echo ""

echo "📦 Building backend..."
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_REPO}:${BE_TAG}" \
  --file backend/Dockerfile \
  --push \
  backend/

echo "📦 Building frontend..."
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_REPO}:${FE_TAG}" \
  --file frontend/Dockerfile \
  --build-arg VITE_API_URL="${VITE_API_URL}" \
  --push \
  frontend/

echo ""
echo "✅ Pushed:"
echo "   ${IMAGE_REPO}:${FE_TAG}"
echo "   ${IMAGE_REPO}:${BE_TAG}"
echo ""
echo "--- Run locally with these images ---"
echo "export FE_TAG=${FE_TAG} BE_TAG=${BE_TAG}"
echo "docker compose -f docker-compose.images.yml up -d"
echo "---"
