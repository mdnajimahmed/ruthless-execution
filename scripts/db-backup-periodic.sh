#!/bin/bash
set -euo pipefail

# Simple periodic backup scheduler.
# Runs db-backup.sh in a loop with a configurable interval.
#
# Usage:
#   # Every hour (default):
#   ./scripts/db-backup-periodic.sh
#   # Custom interval and container:
#   INTERVAL_SECONDS=1800 CONTAINER_NAME=ruthless-execution-db ./scripts/db-backup-periodic.sh
#
# This is intended to be run in a tmux/screen session, or wrapped by cron/systemd.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

INTERVAL_SECONDS="${INTERVAL_SECONDS:-3600}"
CONTAINER_NAME="${CONTAINER_NAME:-ruthless-execution-db}"

echo "⏱  Starting periodic backups every ${INTERVAL_SECONDS}s from container '${CONTAINER_NAME}'..."

while true; do
  echo "▶️  Backup run at $(date -Iseconds)"
  if ! "${SCRIPT_DIR}/db-backup.sh" "${CONTAINER_NAME}"; then
    echo "⚠️  Backup run failed at $(date -Iseconds)" >&2
  fi
  echo "💤 Sleeping for ${INTERVAL_SECONDS}s..."
  sleep "${INTERVAL_SECONDS}"
done

