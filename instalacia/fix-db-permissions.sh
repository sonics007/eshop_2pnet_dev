#!/bin/bash
# ============================================================================
# ESHOP - Oprava databázových oprávnení a diagnostika
# ============================================================================

set -e

# Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Presun do projektu
cd "$(dirname "$0")/.." || exit 1

echo "============================================================================"
echo "  ESHOP - Diagnostika a oprava databázových oprávnení"
echo "============================================================================"
echo

# 1. Zastaviť všetky Node.js procesy
log_info "Zastavujem všetky Node.js procesy..."
pkill -9 node 2>/dev/null || true
sleep 1
log_success "Node.js procesy zastavené"

# 2. Vyčistiť Next.js cache (môže obsahovať starý Prisma client)
log_info "Vyčisťujem Next.js cache..."
rm -rf .next
log_success "Cache vyčistený"

# 3. Kontrola databázových súborov
log_info "Kontrola databázových súborov..."
echo

if [ -f "prisma/dev.db" ]; then
    log_info "Databázový súbor existuje:"
    ls -lah prisma/dev.db

    # Kontrola lock súborov
    if [ -f "prisma/dev.db-shm" ] || [ -f "prisma/dev.db-wal" ]; then
        log_warning "Našiel som SQLite lock súbory, odstraňujem..."
        rm -f prisma/dev.db-shm prisma/dev.db-wal
        log_success "Lock súbory odstránené"
    fi
else
    log_error "Databáza prisma/dev.db neexistuje!"
    exit 1
fi

echo
log_info "Adresár prisma/:"
ls -ldh prisma/

# 4. Nastavenie oprávnení
log_info "Nastavujem oprávnenia..."
echo

# Databázový súbor - všetky procesy môžu čítať/písať
chmod 666 prisma/dev.db

# Adresár - plný prístup
chmod 777 prisma/

# Rodičovské adresáre - musia byť executable
chmod 755 .

log_success "Oprávnenia nastavené"
echo

# 5. Overenie oprávnení
log_info "Overenie oprávnení:"
echo "Databáza:"
ls -lah prisma/dev.db | awk '{print "  " $1 " " $3 ":" $4 " " $NF}'
echo "Adresár:"
ls -ldh prisma/ | awk '{print "  " $1 " " $3 ":" $4 " " $NF}'
echo "Projekt root:"
ls -ld . | awk '{print "  " $1 " " $3 ":" $4 " " $NF}'

# 6. Test prístupu k databáze
echo
log_info "Test prístupu k databáze..."
if sqlite3 prisma/dev.db "SELECT count(*) FROM sqlite_master;" >/dev/null 2>&1; then
    log_success "SQLite môže otvoriť databázu"
else
    log_error "SQLite nemôže otvoriť databázu!"
fi

# 7. Regenerovanie Prisma clienta
echo
log_info "Regenerujem Prisma client..."
npx prisma generate >/dev/null 2>&1
log_success "Prisma client regenerovaný"

# 8. Finálne info
echo
echo "============================================================================"
log_success "Diagnostika a oprava dokončená!"
echo "============================================================================"
echo
log_info "Teraz spustite server:"
echo "  npm run dev"
echo
log_warning "Ak problém pretrváva, skúste:"
echo "  lsof prisma/dev.db          # Zistite ktorý proces drží súbor"
echo "  strace -e openat npm run dev  # Sledujte syscally pri otváraní súboru"
