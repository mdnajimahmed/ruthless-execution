#!/bin/bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Read app name and version from root package.json
APP_NAME=$(node -e "process.stdout.write(require('./package.json').name)")
VERSION=$(node -e "process.stdout.write(require('./package.json').version)")

IMAGE_REPO="ivplay4689/turinghatch"
FE_TAG="${APP_NAME}-fe-${VERSION}"
BE_TAG="${APP_NAME}-be-${VERSION}"

# VITE_API_URL is baked into the FE image at build time by Vite.
# Pass it via env var before calling this script:
#   VITE_API_URL=https://api.yourdomain.com ./scripts/docker-push.sh
# For local docker-compose testing, the default (localhost) is fine.
VITE_API_URL="${VITE_API_URL:-http://localhost:9559/api}"

# Platforms:
#   linux/amd64  — macOS Intel, Windows, Linux x86
#   linux/arm64  — macOS Apple Silicon, Oracle Cloud Ampere (free tier), ARM servers
PLATFORMS="linux/amd64,linux/arm64"

# Ensure a multi-platform buildx builder exists.
# The default 'docker' driver does not support multi-platform; we need 'docker-container'.
if ! docker buildx inspect multiarch &>/dev/null; then
  echo "Creating buildx builder 'multiarch' (one-time setup)..."
  docker buildx create --name multiarch --driver docker-container --use
else
  docker buildx use multiarch
fi

# Bootstrap the builder (no-op if already running)
docker buildx inspect --bootstrap multiarch > /dev/null

echo "Building and pushing Docker images"
echo "  Repo : ${IMAGE_REPO}"
echo "  BE   : ${BE_TAG}"
echo "  FE   : ${FE_TAG} (VITE_API_URL=${VITE_API_URL})"
echo "  Arch : ${PLATFORMS}"
echo ""

echo "--- Backend ---"
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_REPO}:${BE_TAG}" \
  --file backend/Dockerfile \
  --push \
  backend/

echo "--- Frontend ---"
docker buildx build \
  --platform "${PLATFORMS}" \
  --tag "${IMAGE_REPO}:${FE_TAG}" \
  --file frontend/Dockerfile \
  --build-arg VITE_API_URL="${VITE_API_URL}" \
  --push \
  frontend/

echo ""
echo "Done. Images pushed:"
echo "  ${IMAGE_REPO}:${BE_TAG}"
echo "  ${IMAGE_REPO}:${FE_TAG}"
echo ""
echo "To run locally:"
echo "  export FE_TAG=${FE_TAG} BE_TAG=${BE_TAG}"
echo "  docker compose -f docker-compose.images.yml up -d"
