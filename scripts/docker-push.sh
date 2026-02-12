#!/bin/bash
set -e

# Tag format: fe-YYYY-MM-DD-HHMM-<git_sha_short> and be-YYYY-MM-DD-HHMM-<git_sha_short>
IMAGE_BASE=ivplay4689/ruthless-execution
DATETIME=$(date +%Y-%m-%d-%H%M)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "nosha")
FE_TAG="fe-${DATETIME}-${GIT_SHA}"
BE_TAG="be-${DATETIME}-${GIT_SHA}"

# Multi-platform: linux/amd64 (Intel/AMD, Windows WSL2, Intel Mac), linux/arm64 (Apple Silicon, ARM servers)
PLATFORMS="linux/amd64,linux/arm64"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Ensure a buildx builder exists for multi-platform (create if missing)
if ! docker buildx inspect multiarch &>/dev/null; then
  echo "🔧 Creating buildx builder 'multiarch' for multi-platform builds..."
  docker buildx create --name multiarch --use --driver docker-container || true
fi
docker buildx use multiarch 2>/dev/null || docker buildx use default

echo "🐳 Building and pushing Docker images (${PLATFORMS})..."
echo "   FE tag: $FE_TAG"
echo "   BE tag: $BE_TAG"
echo ""

# Build and push backend (multi-platform; --push writes manifest to registry)
echo "📦 Building backend..."
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_BASE}:${BE_TAG}" \
  --file backend/Dockerfile \
  --push \
  backend/

# Build and push frontend (API URL for local docker-compose)
echo "📦 Building frontend..."
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_BASE}:${FE_TAG}" \
  --build-arg VITE_API_URL=http://localhost:9559/api \
  --file Dockerfile.fe \
  --push \
  .

echo ""
echo "✅ Pushed:"
echo "   ${IMAGE_BASE}:${FE_TAG}"
echo "   ${IMAGE_BASE}:${BE_TAG}"
echo ""
echo "--- Copy and paste to run locally with these images ---"
echo "export FE_TAG=${FE_TAG} BE_TAG=${BE_TAG}"
echo "docker compose -f docker-compose.images.yml up -d"
echo "---"
echo ""
