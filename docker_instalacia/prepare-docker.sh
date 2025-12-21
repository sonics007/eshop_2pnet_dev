#!/bin/bash
# ============================================
# ESHOP - Príprava projektu pre Docker
# ============================================
#
# Tento skript pripraví projekt pre Docker deployment.
# Spusti ho v koreňovom adresári projektu.
#
# Použitie:
#   chmod +x docker_instalacia/prepare-docker.sh
#   ./docker_instalacia/prepare-docker.sh
#
# ============================================

set -e

echo "==================================="
echo "ESHOP - Príprava pre Docker"
echo "==================================="

# Kontrola či sme v správnom adresári
if [ ! -f "package.json" ]; then
    echo "CHYBA: Spusti tento skript z koreňového adresára projektu!"
    exit 1
fi

# Záloha pôvodného next.config.mjs
if [ -f "next.config.mjs" ]; then
    echo ">>> Zálohujem next.config.mjs..."
    cp next.config.mjs next.config.mjs.backup
fi

# Kopírovanie Docker súborov
echo ">>> Kopírujem Docker súbory..."
cp docker_instalacia/Dockerfile .
cp docker_instalacia/docker-compose.yml .
cp docker_instalacia/.dockerignore .
cp docker_instalacia/.env.example .
cp docker_instalacia/next.config.docker.mjs next.config.mjs

# Vytvorenie .env ak neexistuje
if [ ! -f ".env" ]; then
    echo ">>> Vytváram .env z .env.example..."
    cp .env.example .env
    echo "UPOZORNENIE: Uprav .env súbor pred spustením!"
fi

echo ""
echo "==================================="
echo "Príprava dokončená!"
echo "==================================="
echo ""
echo "Ďalšie kroky:"
echo "  1. Uprav .env súbor"
echo "  2. Spusti: docker compose up -d --build"
echo "  3. Otvor: http://localhost:3000"
echo ""
