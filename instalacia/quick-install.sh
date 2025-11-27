#!/bin/bash
# ============================================================================
# ESHOP - Rýchla inštalácia (1 príkaz)
# ============================================================================
# Spustite tento príkaz na Debian 12 serveri:
#
# bash <(curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/quick-install.sh)
#
# Alebo:
#   git clone https://github.com/sonics007/eshop_2pnet_dev.git
#   cd eshop_2pnet_dev/instalacia
#   ./install.sh
#
# ============================================================================

set -e

# Presun do bezpečného adresára (ak sme v neexistujúcom)
cd /tmp 2>/dev/null || cd /

REPO="sonics007/eshop_2pnet_dev"
DIR="/opt/eshop"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          ESHOP - Rýchla inštalácia z GitHubu           ║"
echo "║                    Verzia: 0.0.3                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo

# Kontrola root - pre LXC kontajner je root OK
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Inštalácia ako root (OK pre LXC kontajner)"
    IS_ROOT=true
else
    IS_ROOT=false
fi

# Funkcia pre sudo (preskočiť ak je root)
run_sudo() {
    if [ "$IS_ROOT" = true ]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Inštalácia git
if ! command -v git &> /dev/null; then
    echo "📦 Inštalujem git..."
    run_sudo apt-get update -qq
    run_sudo apt-get install -y git
fi

# Stiahnutie projektu
echo "⬇️  Sťahujem z GitHub..."
if [ -d "$DIR" ]; then
    echo "⚠️  Adresár $DIR už existuje!"
    read -p "Odstrániť a stiahnuť znova? (y/n): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] && run_sudo rm -rf "$DIR" || exit 1
fi

run_sudo git clone "https://github.com/$REPO.git" "$DIR"

# Nastavenie vlastníctva (iba ak nie je root)
if [ "$IS_ROOT" = false ]; then
    sudo chown -R $USER:$USER "$DIR"
fi

echo "✅ Projekt stiahnutý"
echo

# Spustenie inštalácie
echo "🚀 Spúšťam inštaláciu..."
cd "$DIR/instalacia"
chmod +x install.sh
./install.sh
# Cache refresh št 27. nov 2025 14:42:33
