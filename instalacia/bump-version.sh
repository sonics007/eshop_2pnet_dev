#!/bin/bash
# ============================================================================
# ESHOP - Version Bump Script
# ============================================================================
# Automaticky aktualizuje verziu vo všetkých relevantných súboroch
#
# Použitie:
#   ./bump-version.sh 0.0.3
#   ./bump-version.sh 0.1.0
#   ./bump-version.sh 1.0.0
# ============================================================================

set -e

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Kontrola parametrov
if [ -z "$1" ]; then
    log_error "Chýba nová verzia!"
    echo "Použitie: $0 <verzia>"
    echo "Príklad: $0 0.0.3"
    exit 1
fi

NEW_VERSION="$1"

# Validácia formátu verzie (semantic versioning)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Neplatný formát verzie: $NEW_VERSION"
    echo "Verzia musí byť ve formáte X.Y.Z (napr. 0.0.3)"
    exit 1
fi

# Kontrola, či sme v root priečinku projektu
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    log_error "Nie je možné nájsť package.json!"
    log_info "Spustite skript z priečinka instalacia/"
    exit 1
fi

cd "$PROJECT_DIR"

# Načítanie aktuálnej verzie
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           ESHOP - Version Bump                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo
log_info "Aktuálna verzia: $CURRENT_VERSION"
log_info "Nová verzia: $NEW_VERSION"
echo

# Potvrdenie
read -p "Pokračovať? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Zrušené"
    exit 0
fi

echo
log_info "Aktualizujem súbory..."

# 1. VERSION súbor
echo "$NEW_VERSION" > VERSION
log_success "VERSION"

# 2. package.json
if [ -f "package.json" ]; then
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
    log_success "package.json"
fi

# 3. README.md
if [ -f "README.md" ]; then
    sed -i "s/\*\*Verzia: .*\*\*/\*\*Verzia: $NEW_VERSION\*\*/" README.md
    sed -i "s/version-[0-9.]*-blue/version-$NEW_VERSION-blue/" README.md
    log_success "README.md"
fi

# 4. Inštalačné skripty
if [ -f "instalacia/install.sh" ]; then
    sed -i "s/VERSION=\".*\"/VERSION=\"$NEW_VERSION\"/" instalacia/install.sh
    log_success "instalacia/install.sh"
fi

if [ -f "instalacia/install-from-github.sh" ]; then
    sed -i "s/Verzia: [0-9.]*/Verzia: $NEW_VERSION/" instalacia/install-from-github.sh
    log_success "instalacia/install-from-github.sh"
fi

if [ -f "instalacia/quick-install.sh" ]; then
    sed -i "s/Verzia: [0-9.]*/Verzia: $NEW_VERSION/" instalacia/quick-install.sh
    log_success "instalacia/quick-install.sh"
fi

if [ -f "instalacia/README.md" ]; then
    sed -i "s/\*\*Verzia\*\*: [0-9.]*/\*\*Verzia\*\*: $NEW_VERSION/" instalacia/README.md
    log_success "instalacia/README.md"
fi

echo
log_success "Všetky súbory aktualizované!"
echo

# Pripomienka na CHANGELOG
log_warning "NEZABUDNITE:"
echo "  1. Aktualizovať CHANGELOG.md"
echo "  2. Pridať popis zmien pre verziu $NEW_VERSION"
echo "  3. Commitnúť zmeny:"
echo "     git add ."
echo "     git commit -m \"Verzia $NEW_VERSION\""
echo "     git tag -a v$NEW_VERSION -m \"Verzia $NEW_VERSION\""
echo "     git push && git push --tags"
echo

# Ponuka otvoriť CHANGELOG
read -p "Chcete otvoriť CHANGELOG.md? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v nano &> /dev/null; then
        nano CHANGELOG.md
    elif command -v vim &> /dev/null; then
        vim CHANGELOG.md
    else
        log_info "Editor nenájdený. Otvorte CHANGELOG.md manuálne."
    fi
fi

echo
log_success "Hotovo!"
