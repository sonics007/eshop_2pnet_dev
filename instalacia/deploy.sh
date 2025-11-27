#!/bin/bash
# ============================================================================
# ESHOP - Deployment skript (pre aktualizácie)
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Získanie project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."

echo "============================================================================"
echo "  ESHOP - Deployment / Aktualizácia"
echo "============================================================================"
echo

# Záloha databázy pred aktualizáciou
log_info "Vytváram zálohu databázy..."
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
    BACKUP_FILE="$BACKUP_DIR/dev-$(date +%Y%m%d-%H%M%S).db"
    cp "$PROJECT_DIR/prisma/dev.db" "$BACKUP_FILE"
    log_success "Záloha vytvorená: $BACKUP_FILE"
else
    log_warning "Databáza nenájdená, preskakujem zálohu"
fi

# Zastavenie služby
if systemctl is-active --quiet eshop; then
    log_info "Zastavujem službu eshop..."
    sudo systemctl stop eshop
    log_success "Služba zastavená"
else
    log_warning "Služba eshop nie je spustená"
fi

# Stiahnutie zmien (ak git)
if [ -d "$PROJECT_DIR/.git" ]; then
    log_info "Sťahujem najnovšiu verziu z git..."
    cd "$PROJECT_DIR"
    git pull
    log_success "Git pull dokončený"
fi

# Aktualizácia závislostí
log_info "Aktualizujem závislosti..."
cd "$PROJECT_DIR"
npm install
log_success "Závislosti aktualizované"

# Generovanie Prisma klienta
log_info "Generujem Prisma klienta..."
npx prisma generate
log_success "Prisma klient vygenerovaný"

# Migrácia databázy
log_info "Spúšťam databázové migrácie..."
npx prisma migrate deploy
log_success "Migrácie dokončené"

# Build novej verzie
log_info "Zostavujem novú verziu..."
npm run build
log_success "Build dokončený"

# Spustenie služby
if systemctl is-enabled --quiet eshop; then
    log_info "Spúšťam službu eshop..."
    sudo systemctl start eshop
    sleep 3

    if systemctl is-active --quiet eshop; then
        log_success "Služba úspešne spustená"
    else
        log_error "Služba sa nepodarilo spustiť!"
        log_info "Kontrola logov: sudo journalctl -u eshop -n 50"
        exit 1
    fi
fi

# Reštart nginx
if systemctl is-active --quiet nginx; then
    log_info "Reštartujem nginx..."
    sudo systemctl reload nginx
    log_success "Nginx reštartovaný"
fi

echo
echo "============================================================================"
log_success "Deployment dokončený!"
echo "============================================================================"
echo
log_info "Stav služby:"
sudo systemctl status eshop --no-pager -l

echo
log_info "Posledné logy:"
sudo journalctl -u eshop -n 10 --no-pager

echo
echo "============================================================================"
