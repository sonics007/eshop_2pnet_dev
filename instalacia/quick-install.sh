#!/bin/bash
# ============================================================================
# ESHOP - Rýchla inštalácia (1 príkaz)
# ============================================================================
# Spustite tento príkaz na Debian 12 serveri:
#
# curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/quick-install.sh | bash
#
# ============================================================================

set -e

REPO="sonics007/eshop_2pnet_dev"
DIR="/opt/eshop"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          ESHOP - Rýchla inštalácia z GitHubu           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo

# Kontrola root
if [ "$EUID" -eq 0 ]; then
    echo "❌ NEPOUŽÍVAJTE root! Spustite ako bežný používateľ."
    exit 1
fi

# Inštalácia git
if ! command -v git &> /dev/null; then
    echo "📦 Inštalujem git..."
    sudo apt-get update -qq
    sudo apt-get install -y git
fi

# Stiahnutie projektu
echo "⬇️  Sťahujem z GitHub..."
if [ -d "$DIR" ]; then
    echo "⚠️  Adresár $DIR už existuje!"
    read -p "Odstrániť a stiahnuť znova? (y/n): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] && sudo rm -rf "$DIR" || exit 1
fi

sudo git clone "https://github.com/$REPO.git" "$DIR"
sudo chown -R $USER:$USER "$DIR"

echo "✅ Projekt stiahnutý"
echo

# Spustenie inštalácie
echo "🚀 Spúšťam inštaláciu..."
cd "$DIR/instalacia"
chmod +x install.sh
./install.sh
