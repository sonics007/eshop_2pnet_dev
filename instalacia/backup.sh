#!/bin/bash
# ============================================================================
# ESHOP - Zálohovací skript
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Konfigurácia
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."
BACKUP_BASE_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo "============================================================================"
echo "  ESHOP - Záloha"
echo "============================================================================"
echo

# Vytvorenie záložného adresára
mkdir -p "$BACKUP_BASE_DIR/database"
mkdir -p "$BACKUP_BASE_DIR/full"

# Záloha databázy
if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
    log_info "Zálohujem databázu..."
    DB_BACKUP="$BACKUP_BASE_DIR/database/eshop-db-$TIMESTAMP.db"

    sqlite3 "$PROJECT_DIR/prisma/dev.db" ".backup '$DB_BACKUP'"

    # Kompresia
    gzip "$DB_BACKUP"

    DB_SIZE=$(du -h "$DB_BACKUP.gz" | cut -f1)
    log_success "Databáza zálohovaná: $DB_BACKUP.gz ($DB_SIZE)"
else
    log_error "Databáza nenájdená: $PROJECT_DIR/prisma/dev.db"
fi

# Plná záloha projektu (voliteľné)
read -p "Vytvoriť plnú zálohu projektu? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Vytváram plnú zálohu projektu..."
    FULL_BACKUP="$BACKUP_BASE_DIR/full/eshop-full-$TIMESTAMP.tar.gz"

    cd "$PROJECT_DIR/.."
    tar -czf "$FULL_BACKUP" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='backups' \
        --exclude='.git' \
        "$(basename "$PROJECT_DIR")"

    FULL_SIZE=$(du -h "$FULL_BACKUP" | cut -f1)
    log_success "Plná záloha vytvorená: $FULL_BACKUP ($FULL_SIZE)"
fi

# Vymazanie starých záloh
log_info "Mažem zálohy staršie ako $RETENTION_DAYS dní..."
find "$BACKUP_BASE_DIR/database" -name "*.db.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_BASE_DIR/full" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
log_success "Staré zálohy vymazané"

# Zoznam existujúcich záloh
echo
log_info "Existujúce zálohy databázy:"
ls -lh "$BACKUP_BASE_DIR/database/" | tail -n 5

echo
log_info "Existujúce plné zálohy:"
ls -lh "$BACKUP_BASE_DIR/full/" | tail -n 3

echo
echo "============================================================================"
log_success "Zálohovanie dokončené!"
echo "============================================================================"
