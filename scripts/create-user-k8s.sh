#!/bin/bash
set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <email> <password>"
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"

BACKEND_POD=$(kubectl --context turinghatch-oci -n ruthless-execution get pod -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl --context turinghatch-oci -n ruthless-execution exec "$BACKEND_POD" -- node dist/scripts/create-user.js "$EMAIL" "$PASSWORD"
