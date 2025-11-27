#!/bin/bash
# ============================================================================
# ESHOP - Automatický inštalačný skript pre Debian 12
# ============================================================================

set -e  # Zastaviť pri chybe

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcie pre formátovaný výstup
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kontrola root - pre LXC kontajner je root OK
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warning "Inštalácia ako root (OK pre LXC kontajner)"
        IS_ROOT=true
    else
        IS_ROOT=false
    fi
}

# Funkcia pre sudo (preskočiť ak je root)
run_sudo() {
    if [ "$IS_ROOT" = true ]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Kontrola operačného systému
check_os() {
    log_info "Kontrolujem operačný systém..."

    if [ -f /etc/debian_version ]; then
        DEBIAN_VERSION=$(cat /etc/debian_version | cut -d. -f1)
        if [ "$DEBIAN_VERSION" -eq 12 ]; then
            log_success "Debian 12 detekovaný"
        else
            log_warning "Detekovaný Debian $DEBIAN_VERSION (odporúčaný Debian 12)"
        fi
    else
        log_error "Tento skript je určený pre Debian 12"
        exit 1
    fi
}

# Inštalácia systémových závislostí
install_system_dependencies() {
    log_info "Inštalujem systémové závislosti..."

    run_sudo apt-get update
    run_sudo apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        sqlite3 \
        ca-certificates \
        gnupg

    log_success "Systémové závislosti nainštalované"
}

# Inštalácia Node.js 20.x
install_nodejs() {
    log_info "Kontrolujem Node.js..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            log_success "Node.js $(node -v) už je nainštalovaný"
            return
        fi
    fi

    log_info "Inštalujem Node.js 20.x..."

    # Pridanie NodeSource repository
    if [ "$IS_ROOT" = true ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    log_success "Node.js $(node -v) nainštalovaný"
    log_success "npm $(npm -v) nainštalovaný"
}

# Konfigurácia projektu
setup_project() {
    log_info "Nastavujem projekt..."

    # Získanie absolútnej cesty k instalačnému adresáru
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_DIR="$SCRIPT_DIR/.."

    cd "$PROJECT_DIR"

    # Vytvorenie .env súboru, ak neexistuje
    if [ ! -f .env ]; then
        log_info "Vytváram .env súbor..."
        cp .env.example .env

        # Generovanie náhodného JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env

        log_success ".env súbor vytvorený"
    else
        log_warning ".env súbor už existuje, preskakujem..."
    fi

    log_success "Projekt nastavený"
}

# Inštalácia npm závislostí
install_npm_dependencies() {
    log_info "Inštalujem npm závislosti..."

    cd "$PROJECT_DIR"
    npm install

    log_success "npm závislosti nainštalované"
}

# Inicializácia databázy
setup_database() {
    log_info "Inicializujem databázu..."

    cd "$PROJECT_DIR"

    # Generovanie Prisma klienta
    npx prisma generate

    # Spustenie migrácií
    if [ -f "prisma/dev.db" ]; then
        log_warning "Databáza už existuje, preskakujem migrácie..."
    else
        npx prisma migrate dev --name init
        log_success "Databázové migrácie dokončené"
    fi

    # Nastavenie správnych oprávnení pre databázu
    if [ -f "prisma/dev.db" ]; then
        chmod 666 "prisma/dev.db"
        chmod 777 "prisma"
        log_success "Databázové oprávnenia nastavené"
    fi

    # Seed databázy (voliteľné)
    read -p "Chcete naplniť databázu ukážkovými dátami? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run db:seed
        log_success "Databáza naplnená ukážkovými dátami"
    fi
}

# Vytvorenie admin používateľa
create_admin_user() {
    log_info "Vytváram admin používateľa automaticky..."

    cd "$PROJECT_DIR"

    if [ ! -f "scripts/createAdmin.js" ]; then
        log_warning "Script createAdmin.js nenájdený, preskakujem..."
        return
    fi

    # Defaultné hodnoty - automaticky použité
    ADMIN_EMAIL="admin@eshop.local"
    ADMIN_PASSWORD="Admin123!"
    ADMIN_NAME="Administrator"

    if node scripts/createAdmin.js "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$ADMIN_NAME"; then
        log_success "Admin používateľ vytvorený"
        echo
        log_info "==================================================="
        log_info "Prihlasovacie údaje pre admin panel:"
        echo "  Email:    $ADMIN_EMAIL"
        echo "  Heslo:    $ADMIN_PASSWORD"
        log_info "==================================================="
        echo
        log_warning "DÔLEŽITÉ: Zmeňte heslo po prvom prihlásení!"
        echo
    else
        log_error "Nepodarilo sa vytvoriť admin používateľa"
        log_info "Môžete ho vytvoriť neskôr príkazom:"
        echo "  cd $PROJECT_DIR"
        echo "  node scripts/createAdmin.js email@example.com heslo \"Meno\""
    fi
}

# Vytvorenie systemd služby
create_systemd_service() {
    # Preskočené pre dev setup - nie je potrebné
    log_info "Systemd služba preskočená (spúšťa sa dev server)..."
    return
}

# Build produkčnej verzie
build_production() {
    # Preskočené pre dev setup - nie je potrebné
    log_info "Production build preskočený (spúšťa sa dev server)..."
    return
}

# Konfigurácia firewall
configure_firewall() {
    # Preskočené pre dev setup - nie je potrebné
    log_info "Firewall preskočený (voliteľné nastavenie)..."
    return
}

# Inštalácia nginx ako reverse proxy (voliteľné)
install_nginx() {
    # Preskočené pre dev setup - nie je potrebné
    log_info "Nginx preskočený (voliteľné nastavenie)..."
    return
}

# Spustenie servera
start_server() {
    echo
    log_info "Spúšťam server automaticky po inštalácii..."
    log_info "(Pre preskočenie použite Ctrl+C)"
    sleep 2
    echo

    cd "$PROJECT_DIR"

    # Ak existuje systemd služba, použiť ju
    if [ -f "/etc/systemd/system/eshop.service" ]; then
        log_info "Spúšťam server cez systemd..."
        run_sudo systemctl start eshop

        # Pauza na spustenie
        sleep 3

        # Kontrola statusu
        if run_sudo systemctl is-active --quiet eshop; then
            log_success "Server úspešne spustený!"

            # Získanie IP adresy
            SERVER_IP=$(hostname -I | awk '{print $1}')

            echo
            log_info "Aplikácia beží na:"
            echo "  http://$SERVER_IP:3000"
            echo "  http://localhost:3000"
            echo
            log_info "Admin panel:"
            echo "  http://$SERVER_IP:3000/admin"
            echo
            log_info "Správa služby:"
            if [ "$IS_ROOT" = true ]; then
                echo "  systemctl stop eshop     # Zastaviť"
                echo "  systemctl restart eshop  # Reštartovať"
                echo "  systemctl status eshop   # Stav"
            else
                echo "  sudo systemctl stop eshop     # Zastaviť"
                echo "  sudo systemctl restart eshop  # Reštartovať"
                echo "  sudo systemctl status eshop   # Stav"
            fi
            echo
            log_info "Logy:"
            if [ "$IS_ROOT" = true ]; then
                echo "  journalctl -u eshop -f"
            else
                echo "  sudo journalctl -u eshop -f"
            fi
        else
            log_error "Server sa nepodarilo spustiť!"
            log_info "Skúste manuálne:"
            if [ "$IS_ROOT" = true ]; then
                echo "  systemctl start eshop"
                echo "  journalctl -u eshop -n 50"
            else
                echo "  sudo systemctl start eshop"
                echo "  sudo journalctl -u eshop -n 50"
            fi
        fi
    else
        # Spustenie v development mode
        log_info "Spúšťam vývojový server..."

        # KRITICKÉ: Nastavenie databázových oprávnení tesne pred spustením
        log_info "Overujem databázové oprávnenia..."
        if [ -f "prisma/dev.db" ]; then
            chmod 666 "prisma/dev.db" 2>/dev/null || run_sudo chmod 666 "prisma/dev.db"
            chmod 777 "prisma" 2>/dev/null || run_sudo chmod 777 "prisma"

            # Zobrazenie skutočných oprávnení pre diagnostiku
            log_info "Databázové oprávnenia:"
            ls -la prisma/dev.db | awk '{print "  " $1 " " $3 ":" $4 " " $9}'
            log_success "Oprávnenia nastavené"
        else
            log_error "Databáza prisma/dev.db neexistuje!"
        fi

        echo
        log_warning "Server beží v popredí. Pre zastavenie použite Ctrl+C"
        echo

        # Získanie IP adresy
        SERVER_IP=$(hostname -I | awk '{print $1}')

        echo
        log_info "Aplikácia bude dostupná na:"
        echo "  http://$SERVER_IP:3000"
        echo "  http://localhost:3000"
        echo
        log_info "Admin panel:"
        echo "  http://$SERVER_IP:3000/admin"
        echo
        echo "Spúšťam..."
        echo

        npm run dev
    fi
}

# Finálna správa
print_final_message() {
    echo
    echo "============================================================================"
    log_success "Inštalácia dokončená!"
    echo "============================================================================"
    echo

    SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

    log_info "Aplikácia je pripravená na použitie!"
    echo
    log_info "URLs:"
    echo "  Homepage:    http://$SERVER_IP:3000"
    echo "  Admin panel: http://$SERVER_IP:3000/admin"
    echo

    if [ -f "/etc/systemd/system/eshop.service" ]; then
        log_info "Systemd služba je nakonfigurovaná"
        log_info "Server bol spustený automaticky"
    else
        log_info "Pre spustenie servera:"
        echo "  cd $PROJECT_DIR"
        echo "  npm run dev          # Development mode"
        echo "  npm start            # Production mode"
    fi
    echo
    log_info "Dokumentácia:"
    echo "  $PROJECT_DIR/instalacia/README.md"
    echo "  $PROJECT_DIR/instalacia/TROUBLESHOOTING.md"
    echo "============================================================================"
}

# Hlavná inštalačná sekvencia
main() {
    # Načítanie verzie
    VERSION="0.0.3"
    if [ -f "../VERSION" ]; then
        VERSION=$(cat ../VERSION 2>/dev/null || echo "0.0.3")
    fi

    echo "============================================================================"
    echo "  ESHOP - Automatická inštalácia pre Debian 12"
    echo "  Verzia: $VERSION"
    echo "============================================================================"
    echo

    check_root
    check_os
    install_system_dependencies
    install_nodejs
    setup_project
    install_npm_dependencies
    setup_database
    create_admin_user
    build_production
    create_systemd_service
    configure_firewall
    install_nginx
    start_server
    print_final_message
}

# Spustenie inštalácie
main
