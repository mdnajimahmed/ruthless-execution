#!/bin/bash
set -euo pipefail

# Clean application data from the DB, keeping schema.
# Intended for: backup -> clean -> restore flow.
#
# Usage:
#   ./scripts/db-clean.sh                # uses ruthless-execution-db, goal_tracker, postgres
#   ./scripts/db-clean.sh my-db-container
#
# Env overrides:
#   PGUSER (default: postgres)
#   PGDB   (default: goal_tracker)

CONTAINER_NAME="${1:-ruthless-execution-db}"
PGUSER="${PGUSER:-postgres}"
PGDB="${PGDB:-goal_tracker}"

echo "🧨 Cleaning data in database '${PGDB}' inside container '${CONTAINER_NAME}'..."

# Order is from children to parents, CASCADE as extra safety.
TABLES='"DayEntry","EisenhowerTask","BacklogItem","Goal","User"'

docker exec "${CONTAINER_NAME}" psql -U "${PGUSER}" -d "${PGDB}" \
  -c "TRUNCATE TABLE ${TABLES} CASCADE;"

echo "✅ Data cleaned (tables truncated): DayEntry, EisenhowerTask, BacklogItem, Goal, User"