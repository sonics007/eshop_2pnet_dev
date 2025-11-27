#!/bin/bash
# ============================================================================
# ESHOP - Univerzálny inštalačný skript z GitHubu
# ============================================================================
# Tento skript stiahnete a spustíte na Debian 12 serveri
# Automaticky stiahne projekt z GitHubu a spustí inštaláciu
#
# Použitie:
#   wget -O - https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/install-from-github.sh | bash
#
# Alebo:
#   curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/install-from-github.sh | bash
#
# ============================================================================

set -e

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Konfigurácia
GITHUB_REPO="sonics007/eshop_2pnet_dev"
GITHUB_BRANCH="main"
INSTALL_DIR="${INSTALL_DIR:-/opt/eshop}"

# Funkcie
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_step() {
    echo
    echo -e "${CYAN}${BOLD}▸ $1${NC}"
    echo "────────────────────────────────────────────────────────────"
}

print_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    ESHOP INSTALLER                          ║
║              Automatická inštalácia z GitHubu               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo "Repository: https://github.com/$GITHUB_REPO"
    echo "Branch: $GITHUB_BRANCH"
    echo "Inštalačný adresár: $INSTALL_DIR"
    echo
}

# Kontrola root
check_not_root() {
    if [ "$EUID" -eq 0 ]; then
        log_error "NEPOUŽÍVAJTE root alebo sudo!"
        log_info "Spustite ako bežný používateľ: bash $0"
        log_info "Skript sa sám spýta na sudo heslo, keď bude potrebné."
        exit 1
    fi
}

# Kontrola OS
check_os() {
    log_step "Kontrola operačného systému"

    if [ ! -f /etc/debian_version ]; then
        log_error "Tento skript je určený pre Debian"
        exit 1
    fi

    DEBIAN_VERSION=$(cat /etc/debian_version | cut -d. -f1)

    if [ "$DEBIAN_VERSION" -eq 12 ]; then
        log_success "Debian 12 (Bookworm) detekovaný"
    else
        log_warning "Detekovaný Debian $DEBIAN_VERSION"
        log_warning "Skript je testovaný na Debian 12"
        read -p "Pokračovať? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Inštalácia základných nástrojov
install_prerequisites() {
    log_step "Inštalácia základných nástrojov"

    log_info "Aktualizujem zoznam balíčkov..."
    sudo apt-get update -qq

    log_info "Inštalujem git a curl..."
    sudo apt-get install -y git curl wget

    log_success "Základné nástroje nainštalované"
}

# Stiahnutie projektu z GitHubu
download_project() {
    log_step "Sťahovanie projektu z GitHubu"

    # Kontrola, či adresár už existuje
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "Adresár $INSTALL_DIR už existuje!"
        read -p "Chcete ho odstrániť a stiahnuť znova? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Odstráňujem starý adresár..."
            sudo rm -rf "$INSTALL_DIR"
        else
            log_error "Inštalácia zrušená"
            exit 1
        fi
    fi

    # Vytvorenie parent adresára, ak neexistuje
    PARENT_DIR=$(dirname "$INSTALL_DIR")
    if [ ! -d "$PARENT_DIR" ]; then
        log_info "Vytváram adresár $PARENT_DIR..."
        sudo mkdir -p "$PARENT_DIR"
    fi

    # Stiahnutie projektu
    log_info "Klonovanie z https://github.com/$GITHUB_REPO..."
    sudo git clone -b "$GITHUB_BRANCH" "https://github.com/$GITHUB_REPO.git" "$INSTALL_DIR"

    # Nastavenie vlastníctva
    log_info "Nastavujem oprávnenia..."
    sudo chown -R $USER:$USER "$INSTALL_DIR"

    log_success "Projekt stiahnutý do $INSTALL_DIR"
}

# Kontrola inštalačného skriptu
verify_install_script() {
    log_step "Kontrola inštalačných súborov"

    if [ ! -f "$INSTALL_DIR/instalacia/install.sh" ]; then
        log_error "Inštalačný skript nenájdený!"
        log_error "Očakávaný: $INSTALL_DIR/instalacia/install.sh"
        exit 1
    fi

    log_success "Inštalačné súbory nájdené"
}

# Spustenie hlavného inštalačného skriptu
run_installation() {
    log_step "Spúšťam hlavný inštalačný skript"

    cd "$INSTALL_DIR/instalacia"
    chmod +x install.sh

    echo
    log_info "Budete presmerovaný na hlavný inštalačný skript..."
    log_info "Odpovedajte na otázky podľa svojich potrieb."
    echo

    sleep 3

    # Spustenie inštalačného skriptu
    ./install.sh
}

# Záverečná správa
print_final_message() {
    echo
    echo "════════════════════════════════════════════════════════════"
    echo
    log_success "Sťahovanie z GitHubu dokončené!"
    echo
    log_info "Projekt umiestnený v: $INSTALL_DIR"
    log_info "Dokumentácia: $INSTALL_DIR/CLAUDE.md"
    log_info "Inštalačné skripty: $INSTALL_DIR/instalacia/"
    echo

    if systemctl is-enabled --quiet eshop 2>/dev/null; then
        echo "════════════════════════════════════════════════════════════"
        log_success "Aplikácia je nainštalovaná a spustená!"
        echo
        log_info "Aplikácia beží na: http://$(hostname -I | awk '{print $1}'):3000"
        log_info "Admin panel: http://$(hostname -I | awk '{print $1}'):3000/admin"
        echo
        log_info "Správa služby:"
        echo "  sudo systemctl start eshop    # Spustiť"
        echo "  sudo systemctl stop eshop     # Zastaviť"
        echo "  sudo systemctl status eshop   # Stav"
        echo
        log_info "Logy: sudo journalctl -u eshop -f"
        echo "════════════════════════════════════════════════════════════"
    fi
}

# Spracovanie chyby
handle_error() {
    echo
    log_error "Inštalácia zlyhala!"
    log_info "Kontrola logov: sudo journalctl -u eshop -n 50"
    log_info "Manuálna inštalácia: cd $INSTALL_DIR/instalacia && ./install.sh"
    exit 1
}

# Nastavenie error handlera
trap handle_error ERR

# ============================================================================
# HLAVNÁ INŠTALAČNÁ SEKVENCIA
# ============================================================================

main() {
    print_banner

    # Úvodné informácie
    echo "Tento skript:"
    echo "  1. Stiahne projekt z GitHubu"
    echo "  2. Nainštaluje všetky závislosti"
    echo "  3. Nakonfiguruje databázu"
    echo "  4. Vytvorí admin používateľa"
    echo "  5. Voliteľne nastaví systemd službu, nginx, firewall"
    echo
    log_warning "Odhadovaný čas: 5-10 minút"
    echo

    read -p "Pokračovať s inštaláciou? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Inštalácia zrušená"
        exit 0
    fi

    # Spustenie krokov
    check_not_root
    check_os
    install_prerequisites
    download_project
    verify_install_script
    run_installation
    print_final_message
}

# Spustenie
main "$@"
