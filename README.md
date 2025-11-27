# ESHOP - B2B E-commerce Platform

Modulárny B2B eshop postavený na Next.js 14 s App Router a TypeScript.

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

## 🚀 Rýchla inštalácia - Debian 12

```bash
# Stiahnuť projekt
git clone https://github.com/sonics007/eshop_2pnet_dev.git
cd eshop_2pnet_dev

# Automatická inštalácia
cd instalacia
chmod +x install.sh
./install.sh
```

**Detaily:** [instalacia/README.md](instalacia/README.md)

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
- [instalacia/README.md](instalacia/README.md) - Inštalačný návod

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

## 📞 Podpora

- Issues: https://github.com/sonics007/eshop_2pnet_dev/issues
- Web: https://www.2pnet.cz

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
