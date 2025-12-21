#!/bin/sh
set -e

echo "==================================="
echo "ESHOP Docker Entrypoint"
echo "==================================="

# Wait for any external services if needed
sleep 2

# Check if database exists
DB_PATH="/app/data/eshop.db"
if [ ! -f "$DB_PATH" ]; then
    echo ">>> Inicializujem databázu..."
    npx prisma migrate deploy
    npx prisma db seed
    echo ">>> Databáza pripravená"
else
    echo ">>> Databáza existuje, aplikujem migrácie..."
    npx prisma migrate deploy
fi

echo ">>> Spúšťam aplikáciu..."
exec node server.js
