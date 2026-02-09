#!/bin/bash
# Test login with email and password. Usage: ./scripts/test-login.sh <email> <password>
# Requires: backend running on port 3002, and curl

set -e
EMAIL="${1:?Usage: ./scripts/test-login.sh <email> <password>}"
PASSWORD="${2:?Usage: ./scripts/test-login.sh <email> <password>}"
API_URL="${API_URL:-http://localhost:3002/api}"

echo "Testing login for: $EMAIL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Login successful (HTTP $HTTP_CODE)"
  echo "$BODY" | head -c 500
  echo ""
  if echo "$BODY" | grep -q '"token"'; then
    echo ""
    echo "Token received. User can log in with this email and password."
  fi
else
  echo "❌ Login failed (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi
