#!/bin/bash
set -euo pipefail

# Manual database backup script.
# Usage:
#   ./scripts/db-backup.sh [container_name]
#
# Defaults:
#   AWS profile: bvc
#   S3 bucket:  s3://poc-135129372575/ruthless-execution-db-backup-najim-macos/
#   Container:  ruthless-execution-db
#   DB name:    goal_tracker
#   DB user:    postgres

AWS_PROFILE_ENV="${AWS_PROFILE:-bvc}"
BUCKET="s3://poc-135129372575"
PREFIX="ruthless-execution-db-backup-najim-macos"

CONTAINER_NAME="${1:-ruthless-execution-db}"
PGUSER="${PGUSER:-postgres}"
PGDB="${PGDB:-goal_tracker}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILENAME="backup-${PGDB}-${TIMESTAMP}.sql.gz"
TMPFILE="/tmp/${FILENAME}"

echo "🔁 Backing up database '${PGDB}' from container '${CONTAINER_NAME}'..."

# Create compressed dump from inside the Postgres container
docker exec "${CONTAINER_NAME}" pg_dump -U "${PGUSER}" -d "${PGDB}" | gzip > "${TMPFILE}"

if [ ! -s "${TMPFILE}" ]; then
  echo "❌ Backup file is empty: ${TMPFILE}"
  exit 1
fi

S3_PATH="${BUCKET}/${PREFIX}/${FILENAME}"
echo "☁️  Uploading backup to ${S3_PATH} using AWS profile '${AWS_PROFILE_ENV}'..."
AWS_PROFILE="${AWS_PROFILE_ENV}" aws s3 cp "${TMPFILE}" "${S3_PATH}"

rm -f "${TMPFILE}"

echo "✅ Backup completed."
echo "   S3 path: ${S3_PATH}"

