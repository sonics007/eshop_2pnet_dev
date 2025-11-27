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
    log_info "Vytváram admin používateľa..."

    cd "$PROJECT_DIR"

    if [ -f "scripts/createAdmin.js" ]; then
        node scripts/createAdmin.js
        log_success "Admin používateľ vytvorený"
    else
        log_warning "Script createAdmin.js nenájdený, preskakujem..."
    fi
}

# Vytvorenie systemd služby
create_systemd_service() {
    log_info "Chcete vytvoriť systemd službu pre automatický štart? (y/n): "
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    SERVICE_FILE="/etc/systemd/system/eshop.service"

    log_info "Vytváram systemd službu..."

    run_sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=ESHOP Next.js Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    run_sudo systemctl daemon-reload
    run_sudo systemctl enable eshop.service

    log_success "Systemd služba vytvorená a aktivovaná"
    if [ "$IS_ROOT" = true ]; then
        log_info "Použite: systemctl start eshop    # Spustiť"
        log_info "         systemctl stop eshop     # Zastaviť"
        log_info "         systemctl status eshop   # Stav"
    else
        log_info "Použite: sudo systemctl start eshop    # Spustiť"
        log_info "         sudo systemctl stop eshop     # Zastaviť"
        log_info "         sudo systemctl status eshop   # Stav"
    fi
}

# Build produkčnej verzie
build_production() {
    log_info "Chcete zostaviť produkčnú verziu? (y/n): "
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    log_info "Zostavujem produkčnú verziu..."
    cd "$PROJECT_DIR"
    npm run build

    log_success "Produkčná verzia zostavená"
}

# Konfigurácia firewall
configure_firewall() {
    log_info "Chcete nakonfigurovať firewall (ufw)? (y/n): "
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    if ! command -v ufw &> /dev/null; then
        log_info "Inštalujem ufw..."
        run_sudo apt-get install -y ufw
    fi

    log_info "Konfigurujem firewall..."
    run_sudo ufw allow 22/tcp      # SSH
    run_sudo ufw allow 80/tcp      # HTTP
    run_sudo ufw allow 443/tcp     # HTTPS
    run_sudo ufw allow 3000/tcp    # Next.js dev

    log_warning "Firewall pravidlá pripravené, ale NEAKTIVOVANÉ"
    if [ "$IS_ROOT" = true ]; then
        log_info "Pre aktiváciu spustite: ufw enable"
    else
        log_info "Pre aktiváciu spustite: sudo ufw enable"
    fi
}

# Inštalácia nginx ako reverse proxy (voliteľné)
install_nginx() {
    log_info "Chcete nainštalovať nginx ako reverse proxy? (y/n): "
    read -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    log_info "Inštalujem nginx..."
    run_sudo apt-get install -y nginx

    # Vytvorenie nginx konfigurácie
    NGINX_CONF="/etc/nginx/sites-available/eshop"

    run_sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    run_sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/eshop
    run_sudo rm -f /etc/nginx/sites-enabled/default
    run_sudo nginx -t && run_sudo systemctl restart nginx

    log_success "Nginx nainštalovaný a nakonfigurovaný"
}

# Finálna správa
print_final_message() {
    echo
    echo "============================================================================"
    log_success "Inštalácia dokončená!"
    echo "============================================================================"
    echo
    log_info "Pre spustenie vývojového servera:"
    echo "  cd $PROJECT_DIR"
    echo "  npm run dev"
    echo
    log_info "Pre spustenie produkčného servera:"
    echo "  cd $PROJECT_DIR"
    echo "  npm run build"
    echo "  npm start"
    echo
    log_info "Aplikácia bude dostupná na:"
    echo "  http://localhost:3000"
    echo
    if [ -f "/etc/systemd/system/eshop.service" ]; then
        log_info "Systemd služba:"
        echo "  sudo systemctl start eshop"
    fi
    echo
    log_info "Dokumentácia: $PROJECT_DIR/instalacia/README.md"
    echo "============================================================================"
}

# Hlavná inštalačná sekvencia
main() {
    echo "============================================================================"
    echo "  ESHOP - Automatická inštalácia pre Debian 12"
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
    print_final_message
}

# Spustenie inštalácie
main
