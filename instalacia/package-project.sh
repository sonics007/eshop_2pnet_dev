#!/bin/bash
# ============================================================================
# ESHOP - Vytvorenie kompletného inštalačného balíka
# ============================================================================
# Tento skript vytvorí kompletný archív projektu pripravený na prenos

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."
OUTPUT_DIR="$SCRIPT_DIR/package"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="eshop-debian12-$TIMESTAMP.tar.gz"

echo "============================================================================"
echo "  ESHOP - Vytvorenie inštalačného balíka"
echo "============================================================================"
echo

log_info "Vytváram dočasný adresár..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/eshop"

log_info "Kopírujem súbory projektu..."

# Kopírovanie hlavných súborov a adresárov
cd "$PROJECT_DIR"
cp -r app "$OUTPUT_DIR/eshop/"
cp -r components "$OUTPUT_DIR/eshop/"
cp -r lib "$OUTPUT_DIR/eshop/"
cp -r prisma "$OUTPUT_DIR/eshop/"
cp -r public "$OUTPUT_DIR/eshop/" 2>/dev/null || mkdir -p "$OUTPUT_DIR/eshop/public"
cp -r scripts "$OUTPUT_DIR/eshop/"

# Kopírovanie inštalačných súborov (ale nie package adresár)
mkdir -p "$OUTPUT_DIR/eshop/instalacia"
cp instalacia/*.sh "$OUTPUT_DIR/eshop/instalacia/" 2>/dev/null || true
cp instalacia/*.md "$OUTPUT_DIR/eshop/instalacia/" 2>/dev/null || true
cp instalacia/*.conf "$OUTPUT_DIR/eshop/instalacia/" 2>/dev/null || true
cp instalacia/.env.production.example "$OUTPUT_DIR/eshop/instalacia/" 2>/dev/null || true

# Konfiguračné súbory
cp package.json "$OUTPUT_DIR/eshop/"
cp package-lock.json "$OUTPUT_DIR/eshop/" 2>/dev/null || true
cp next.config.mjs "$OUTPUT_DIR/eshop/"
cp tsconfig.json "$OUTPUT_DIR/eshop/"
cp tsconfig.scripts.json "$OUTPUT_DIR/eshop/" 2>/dev/null || true
cp tailwind.config.js "$OUTPUT_DIR/eshop/"
cp postcss.config.js "$OUTPUT_DIR/eshop/"
cp .eslintrc.json "$OUTPUT_DIR/eshop/" 2>/dev/null || true

# Dokumentácia
cp CLAUDE.md "$OUTPUT_DIR/eshop/" 2>/dev/null || true
cp STRUCTURE.md "$OUTPUT_DIR/eshop/" 2>/dev/null || true
cp README.md "$OUTPUT_DIR/eshop/" 2>/dev/null || true

# .env.example
cp .env.example "$OUTPUT_DIR/eshop/" 2>/dev/null || true

# .gitignore
cat > "$OUTPUT_DIR/eshop/.gitignore" <<'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/dev.db
prisma/dev.db-journal
*.db-journal

# backups
/backups
EOF

log_success "Súbory skopírované"

log_info "Vytváram archív..."
cd "$OUTPUT_DIR"
tar -czf "$PACKAGE_NAME" eshop/

PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
log_success "Archív vytvorený: $PACKAGE_NAME ($PACKAGE_SIZE)"

# Vymazanie dočasného adresára
rm -rf "$OUTPUT_DIR/eshop"

echo
echo "============================================================================"
log_success "Balík je pripravený!"
echo "============================================================================"
echo
log_info "Umiestnenie: $OUTPUT_DIR/$PACKAGE_NAME"
log_info "Veľkosť: $PACKAGE_SIZE"
echo
log_info "Prenos na Debian 12 server:"
echo "  scp $OUTPUT_DIR/$PACKAGE_NAME user@server:/tmp/"
echo
log_info "Rozbalenie a inštalácia na serveri:"
echo "  cd /opt"
echo "  tar -xzf /tmp/$PACKAGE_NAME"
echo "  cd eshop/instalacia"
echo "  chmod +x install.sh"
echo "  ./install.sh"
echo
echo "============================================================================"
