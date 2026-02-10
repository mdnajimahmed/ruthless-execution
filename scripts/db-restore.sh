#!/bin/bash
set -euo pipefail

# Restore database from an S3 backup.
#
# Usage:
#   # Restore from latest backup:
#   ./scripts/db-restore.sh [container_name]
#
#   # Restore from a specific key:
#   BACKUP_KEY="ruthless-execution-db-backup-najim-macos/backup-goal_tracker-20260210-120000.sql.gz" ./scripts/db-restore.sh
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

BACKUP_KEY_ENV="${BACKUP_KEY:-}"

if [ -z "${BACKUP_KEY_ENV}" ]; then
  echo "🔍 No BACKUP_KEY provided. Finding latest backup in ${BUCKET}/${PREFIX}/ ..."
  # aws s3 ls output: DATE TIME SIZE KEY
  KEY_LINE="$(AWS_PROFILE="${AWS_PROFILE_ENV}" aws s3 ls "${BUCKET}/${PREFIX}/" | sort | tail -n 1 || true)"
  if [ -z "${KEY_LINE}" ]; then
    echo "❌ No backup files found in ${BUCKET}/${PREFIX}/"
    exit 1
  fi
  KEY="$(echo "${KEY_LINE}" | awk '{print $4}')"
else
  KEY="${BACKUP_KEY_ENV}"
fi

if [ -z "${KEY}" ]; then
  echo "❌ Could not determine backup key."
  exit 1
fi

S3_PATH="${BUCKET}/${PREFIX}/${KEY}"
TMPFILE="/tmp/${KEY##*/}"

echo "☁️  Downloading backup from ${S3_PATH} using AWS profile '${AWS_PROFILE_ENV}'..."
AWS_PROFILE="${AWS_PROFILE_ENV}" aws s3 cp "${S3_PATH}" "${TMPFILE}"

if [ ! -s "${TMPFILE}" ]; then
  echo "❌ Downloaded backup file is empty: ${TMPFILE}"
  exit 1
fi

echo "🧨 Terminating active connections and recreating database '${PGDB}' in container '${CONTAINER_NAME}'..."
# Terminate all other connections to the target DB so DROP DATABASE succeeds
docker exec "${CONTAINER_NAME}" psql -U "${PGUSER}" -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PGDB}' AND pid <> pg_backend_pid();"

docker exec "${CONTAINER_NAME}" psql -U "${PGUSER}" -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${PGDB};"
docker exec "${CONTAINER_NAME}" psql -U "${PGUSER}" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${PGDB};"

echo "📥 Restoring backup into '${PGDB}'..."
gunzip -c "${TMPFILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${PGUSER}" -d "${PGDB}"

rm -f "${TMPFILE}"

echo "✅ Restore completed from key:"
echo "   ${KEY}"

