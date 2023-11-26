#!/bin/sh

start_ts=$(date +%s)
while ! nc -z db 5432; do
  now_ts=$(date +%s)
  if [ $(( now_ts - start_ts )) -gt 30 ]; then
    echo "Timeout while waiting for database."
    exit 1
  fi

  sleep 2;
done;

MIGRATION_STATUS=$(npx prisma migrate status)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
  echo "No migrations needed."
else
  echo "Running migrations..."
  yarn prisma migrate deploy
fi
rm -rf prisma/

exec "$@"
