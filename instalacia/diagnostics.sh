#!/bin/bash
# ============================================================================
# ESHOP - Diagnostický skript
# ============================================================================
# Zhromažďuje informácie o systéme pre riešenie problémov
#
# Použitie:
#   ./diagnostics.sh
#   ./diagnostics.sh > diagnostics.txt
# ============================================================================

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          ESHOP - Diagnostické informácie                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo
echo "Dátum: $(date)"
echo "Hostname: $(hostname)"
echo

# ============================================================================
# Systémové informácie
# ============================================================================
echo "────────────────────────────────────────────────────────────"
echo "SYSTÉMOVÉ INFORMÁCIE"
echo "────────────────────────────────────────────────────────────"

echo
echo "OS:"
if [ -f /etc/os-release ]; then
    cat /etc/os-release
else
    uname -a
fi

echo
echo "Kernel:"
uname -r

echo
echo "Architektúra:"
uname -m

# ============================================================================
# Miesto na disku
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "MIESTO NA DISKU"
echo "────────────────────────────────────────────────────────────"
echo
df -h

echo
echo "Inodes:"
df -i

# ============================================================================
# Pamäť
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "PAMÄŤ"
echo "────────────────────────────────────────────────────────────"
echo
free -h

# ============================================================================
# CPU
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "CPU"
echo "────────────────────────────────────────────────────────────"
echo
lscpu 2>/dev/null || cat /proc/cpuinfo | grep "model name" | head -1

# ============================================================================
# Node.js a npm
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "NODE.JS A NPM"
echo "────────────────────────────────────────────────────────────"

if command -v node &> /dev/null; then
    echo
    echo "Node.js verzia:"
    node -v
    echo
    echo "npm verzia:"
    npm -v
    echo
    echo "Node.js cesta:"
    which node
    echo
    echo "npm cesta:"
    which npm
else
    echo
    echo "❌ Node.js nie je nainštalovaný!"
fi

# ============================================================================
# Git
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "GIT"
echo "────────────────────────────────────────────────────────────"

if command -v git &> /dev/null; then
    echo
    echo "Git verzia:"
    git --version
else
    echo
    echo "❌ Git nie je nainštalovaný!"
fi

# ============================================================================
# Projekt ESHOP
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "PROJEKT ESHOP"
echo "────────────────────────────────────────────────────────────"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/.."

if [ -d "$PROJECT_DIR" ]; then
    echo
    echo "Projektový adresár: $PROJECT_DIR"
    echo

    cd "$PROJECT_DIR"

    echo "Veľkosť projektu:"
    du -sh . 2>/dev/null || echo "Nepodarilo sa zistiť"

    echo
    echo "Veľkosť node_modules:"
    if [ -d "node_modules" ]; then
        du -sh node_modules 2>/dev/null || echo "Počítam..."
    else
        echo "node_modules neexistuje"
    fi

    echo
    echo "Veľkosť .next:"
    if [ -d ".next" ]; then
        du -sh .next 2>/dev/null || echo "Počítam..."
    else
        echo ".next neexistuje"
    fi

    echo
    echo "Package.json existuje:"
    [ -f "package.json" ] && echo "✓ Áno" || echo "✗ Nie"

    echo
    echo ".env existuje:"
    [ -f ".env" ] && echo "✓ Áno" || echo "✗ Nie"

    echo
    echo "Databáza existuje:"
    if [ -f "prisma/dev.db" ]; then
        echo "✓ Áno"
        echo "Veľkosť databázy:"
        du -sh prisma/dev.db
    else
        echo "✗ Nie"
    fi

    # NPM packages
    if [ -d "node_modules" ] && command -v npm &> /dev/null; then
        echo
        echo "Nainštalované hlavné balíčky:"
        npm list --depth=0 2>/dev/null | head -20
    fi
else
    echo
    echo "❌ Projekt ESHOP nenájdený v: $PROJECT_DIR"
fi

# ============================================================================
# Bežiace procesy
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "BEŽIACE PROCESY"
echo "────────────────────────────────────────────────────────────"

echo
echo "Node.js procesy:"
ps aux | grep node | grep -v grep || echo "Žiadne Node.js procesy"

echo
echo "npm procesy:"
ps aux | grep npm | grep -v grep || echo "Žiadne npm procesy"

# ============================================================================
# Systemd služby
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "SYSTEMD SLUŽBY"
echo "────────────────────────────────────────────────────────────"

if systemctl list-units --type=service | grep -q eshop; then
    echo
    echo "ESHOP service status:"
    systemctl status eshop --no-pager || echo "Service neexistuje"
else
    echo
    echo "ESHOP service nie je vytvorený"
fi

# ============================================================================
# Nginx
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "NGINX"
echo "────────────────────────────────────────────────────────────"

if command -v nginx &> /dev/null; then
    echo
    echo "Nginx verzia:"
    nginx -v 2>&1
    echo
    echo "Nginx status:"
    systemctl status nginx --no-pager 2>/dev/null || echo "Nginx nie je spustený"
    echo
    echo "Nginx test konfigurácie:"
    nginx -t 2>&1 || echo "Konfigurácia má chyby"
else
    echo
    echo "Nginx nie je nainštalovaný"
fi

# ============================================================================
# Firewall
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "FIREWALL"
echo "────────────────────────────────────────────────────────────"

if command -v ufw &> /dev/null; then
    echo
    echo "UFW status:"
    ufw status 2>/dev/null || echo "Potrebné sudo"
else
    echo
    echo "UFW nie je nainštalovaný"
fi

# ============================================================================
# Sieťové porty
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "SIEŤOVÉ PORTY"
echo "────────────────────────────────────────────────────────────"

echo
echo "Počúvajúce porty:"
if command -v ss &> /dev/null; then
    ss -tlnp 2>/dev/null | grep -E ":(80|443|3000)" || echo "Porty 80, 443, 3000 nie sú otvorené"
elif command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | grep -E ":(80|443|3000)" || echo "Porty 80, 443, 3000 nie sú otvorené"
else
    echo "ss ani netstat nie je dostupný"
fi

# ============================================================================
# Logy (posledných 20 riadkov)
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "SYSTÉMOVÉ LOGY (posledných 20 riadkov)"
echo "────────────────────────────────────────────────────────────"

if systemctl list-units --type=service | grep -q eshop; then
    echo
    echo "ESHOP service logy:"
    journalctl -u eshop -n 20 --no-pager 2>/dev/null || echo "Logy nedostupné"
fi

# ============================================================================
# Záver
# ============================================================================
echo
echo "────────────────────────────────────────────────────────────"
echo "KONIEC DIAGNOSTIKY"
echo "────────────────────────────────────────────────────────────"
echo
echo "Pre uloženie do súboru:"
echo "  ./diagnostics.sh > diagnostics.txt"
echo
echo "Pre odoslanie podpore:"
echo "  https://github.com/sonics007/eshop_2pnet_dev/issues"
echo
