#!/bin/bash
# ============================================
# ESHOP - Vytvorenie čistého Docker repozitára
# ============================================
#
# Tento skript vytvorí čistú kópiu projektu
# pripravenú pre Docker deployment.
#
# Použitie:
#   chmod +x docker_instalacia/create-docker-repo.sh
#   ./docker_instalacia/create-docker-repo.sh /cesta/k/novemu/repo
#
# ============================================

set -e

# Cieľový adresár
TARGET_DIR="${1:-./eshop-docker}"

echo "==================================="
echo "ESHOP - Vytvorenie Docker repozitára"
echo "==================================="
echo "Cieľ: $TARGET_DIR"
echo ""

# Kontrola či sme v správnom adresári
if [ ! -f "package.json" ]; then
    echo "CHYBA: Spusti tento skript z koreňového adresára projektu!"
    exit 1
fi

# Kontrola či cieľ neexistuje
if [ -d "$TARGET_DIR" ]; then
    echo "CHYBA: Adresár $TARGET_DIR už existuje!"
    exit 1
fi

# Vytvorenie cieľového adresára
mkdir -p "$TARGET_DIR"

echo ">>> Kopírujem zdrojové súbory..."

# Kopírovanie základných súborov
cp -r app "$TARGET_DIR/"
cp -r components "$TARGET_DIR/"
cp -r lib "$TARGET_DIR/"
cp -r prisma "$TARGET_DIR/"
cp -r public "$TARGET_DIR/"
cp -r scripts "$TARGET_DIR/"
cp -r types "$TARGET_DIR/"
cp -r data "$TARGET_DIR/"

# Kopírovanie konfiguračných súborov
cp package.json "$TARGET_DIR/"
cp package-lock.json "$TARGET_DIR/"
cp tsconfig.json "$TARGET_DIR/"
cp tailwind.config.js "$TARGET_DIR/"
cp postcss.config.js "$TARGET_DIR/"
cp .eslintrc.json "$TARGET_DIR/"

# Kopírovanie Docker súborov
cp docker_instalacia/Dockerfile "$TARGET_DIR/"
cp docker_instalacia/docker-compose.yml "$TARGET_DIR/"
cp docker_instalacia/.dockerignore "$TARGET_DIR/"
cp docker_instalacia/.env.example "$TARGET_DIR/"
cp docker_instalacia/next.config.docker.mjs "$TARGET_DIR/next.config.mjs"
cp docker_instalacia/README.md "$TARGET_DIR/"

# Vytvorenie .gitignore
cat > "$TARGET_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
test-results/
playwright-report/

# Next.js
.next/
out/

# Production
build/

# Misc
.DS_Store
*.pem
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local

# TypeScript
*.tsbuildinfo

# IDE
.idea/
.vscode/
*.swp
*.swo

# Data
data/*.db
prisma/*.db
EOF

# Inicializácia git repozitára
cd "$TARGET_DIR"
git init
git add .
git commit -m "Initial commit - ESHOP Docker"

echo ""
echo "==================================="
echo "Repozitár vytvorený!"
echo "==================================="
echo ""
echo "Umiestnenie: $TARGET_DIR"
echo ""
echo "Ďalšie kroky:"
echo "  1. cd $TARGET_DIR"
echo "  2. cp .env.example .env"
echo "  3. Uprav .env súbor"
echo "  4. docker compose up -d --build"
echo ""
echo "Pre push do GitHub:"
echo "  git remote add origin https://github.com/your-username/eshop.git"
echo "  git push -u origin main"
echo ""
