# ESHOP - B2B E-commerce Platform

**Verzia: 0.0.3** | [Changelog](CHANGELOG.md)

Modulárny B2B eshop postavený na Next.js 14 s App Router a TypeScript.

![Version](https://img.shields.io/badge/version-0.0.3-blue)
[![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.1-2D3748?logo=prisma)](https://www.prisma.io/)

## ✨ Funkcie

- 🏗️ **Modulárna architektúra** - Každý modul je samostatný
- 🔐 **Autentifikácia** - Admin s 2FA + zákaznícka auth
- 💬 **Interný chat** - Live chat s email notifikáciami
- 📦 **Produktový katalóg** - Kategórie, varianty
- 🛒 **Objednávky** - Kompletný checkout flow
- 🧾 **Faktúry** - PDF generovanie
- 🎨 **Admin panel** - Konfigurácia vizuálu a obsahu

## 🚀 Najrýchlejšia inštalácia - Debian 12

```bash
curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/quick-install.sh | bash
```

**To je všetko!** Automaticky stiahne a nainštaluje všetko potrebné. ⏱️ ~5 minút

### Alternatívne metódy inštalácie

**Metóda 1: Git clone + automatická inštalácia**
```bash
git clone https://github.com/sonics007/eshop_2pnet_dev.git
cd eshop_2pnet_dev/instalacia
chmod +x install.sh
./install.sh
```

**Metóda 2: Jeden príkaz (celý proces)**
```bash
curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/install-from-github.sh | bash
```

**Podrobný návod:** [instalacia/INSTALL-FROM-GITHUB.md](instalacia/INSTALL-FROM-GITHUB.md)

## 💻 Lokálny vývoj

```bash
git clone https://github.com/sonics007/eshop_2pnet_dev.git
cd eshop_2pnet_dev
npm install
cp .env.example .env
npx prisma migrate dev
node scripts/createAdmin.js
npm run dev
```

Aplikácia: http://localhost:3000

## 📚 Dokumentácia

- [CLAUDE.md](CLAUDE.md) - Projektová dokumentácia
- [STRUCTURE.md](STRUCTURE.md) - Štruktúra projektu
- [CHANGELOG.md](CHANGELOG.md) - História zmien
- [instalacia/README.md](instalacia/README.md) - Inštalačný návod
- [instalacia/INSTALL-FROM-GITHUB.md](instalacia/INSTALL-FROM-GITHUB.md) - Inštalácia z GitHubu
- [instalacia/TROUBLESHOOTING.md](instalacia/TROUBLESHOOTING.md) - Riešenie problémov
- [instalacia/VERSIONING.md](instalacia/VERSIONING.md) - Verzionovanie projektu

## 🛠️ Tech Stack

- Next.js 14, TypeScript, Prisma, SQLite
- React 18, Tailwind CSS
- 2FA, JWT, bcryptjs

## 📦 Moduly

Modulárna architektúra v `lib/modules/`:
- auth (admin/customer)
- chat, products, orders, invoices
- site (visual, links, menu)
- users, logging, flexibee

## 🔄 Aktualizácia a správa

```bash
# Aktualizácia na novú verziu
cd /opt/eshop/instalacia
./deploy.sh

# Zálohovanie
./backup.sh

# Správa služby
sudo systemctl start/stop/restart eshop
```

## 📞 Podpora

- Issues: https://github.com/sonics007/eshop_2pnet_dev/issues
- Web: https://www.2pnet.cz

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
