# Changelog

Všetky významné zmeny v tomto projekte budú zdokumentované v tomto súbore.

Formát je založený na [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
a tento projekt dodržiava [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-11-27

### Pridané
- ✅ **Interaktívne vytvorenie admin používateľa**
  - Skript sa pýta na email, heslo a meno
  - Defaultné hodnoty pre rýchlu inštaláciu
  - Zobrazenie prihlasovacích údajov po vytvorení
  - Upozornenie na zmenu hesla

### Zmenené
- 📝 Vylepšená funkcia `create_admin_user()` v install.sh
- 📝 Používateľsky prívetivejší inštalačný proces
- 📝 Automatické nastavenie databázových oprávnení (chmod 666 dev.db, chmod 777 prisma/)

### Opravené
- 🐛 Chyba pri vytváraní admin používateľa (chýbali parametre)
- 🐛 Databázové oprávnenia - Prisma nemohol otvoriť databázu (Error code 14)
- 🐛 Chyba "getcwd: cannot access parent directories" pri curl inštalácii

## [0.0.2] - 2025-11-27

### Pridané
- ✅ **Root podpora pre LXC kontajnery**
  - Automatická detekcia root používateľa
  - Funkcia `run_sudo()` pre inteligentné použitie sudo
  - Upravené všetky inštalačné skripty (quick-install.sh, install-from-github.sh, install.sh)

- ✅ **Troubleshooting dokumentácia**
  - Nový súbor `instalacia/TROUBLESHOOTING.md`
  - Diagnostický skript `instalacia/diagnostics.sh`
  - Riešenia pre ENOSPC, permission errors, port conflicts, atď.

- ✅ **Automatické spustenie servera**
  - Funkcia `start_server()` v install.sh
  - Voliteľné spustenie servera po inštalácii
  - Automatická detekcia systemd služby
  - Zobrazenie IP adresy a URLs

- ✅ **Verzionovanie projektu**
  - Súbor `VERSION` s aktuálnou verziou
  - `CHANGELOG.md` pre sledovanie zmien
  - Aktualizovaná verzia v package.json a README.md

### Zmenené
- 📝 Aktualizované požiadavky na disk v README.md (16-20 GB pre LXC)
- 📝 Upravená dokumentácia INSTALL-FROM-GITHUB.md s upozorneniami pre LXC
- 🔧 Všetky sudo príkazy nahradené `run_sudo()` volaním

### Opravené
- 🐛 Problémy s inštaláciou ako root v LXC kontajneroch
- 🐛 Chýbajúce inštrukcie pre riešenie problémov s miestom na disku

## [0.0.1] - 2025-11-25

### Pridané
- 🎉 **Iniciálne vydanie projektu**
- 🏗️ Modulárna architektúra v `lib/modules/`
- 🔐 Admin autentifikácia s 2FA
- 🔐 Zákaznícka autentifikácia
- 💬 Interný chat systém s email notifikáciami
- 📦 Produktový katalóg s kategóriami
- 🛒 Objednávkový systém
- 🧾 Generovanie faktúr
- 🎨 Admin panel
- 📊 Site settings modul (visual, links, menu)
- 🔌 FlexiBee integrácia
- 📝 Logging modul

### Inštalácia
- 📦 Komplexný inštalačný balík v `instalacia/`
- 🚀 Automatický inštalačný skript `install.sh`
- 📜 Deploy skript `deploy.sh`
- 💾 Backup skript `backup.sh`
- 📦 Vytvorenie distribučného balíka `package-project.sh`
- 📖 Kompletná dokumentácia (README.md, CLAUDE.md, STRUCTURE.md)

### Technológie
- Next.js 14.1.0 (App Router)
- TypeScript 5.3
- Prisma 6.1.0 + SQLite
- React 18.2.0
- Tailwind CSS 3.3.5
- bcryptjs + JWT
- otplib (2FA)

---

## Formát zmien

### Typy zmien
- `Pridané` - Nové funkcie
- `Zmenené` - Zmeny v existujúcich funkciách
- `Zastarané` - Funkcie, ktoré budú odstránené
- `Odstranené` - Odstránené funkcie
- `Opravené` - Opravy chýb
- `Bezpečnosť` - Bezpečnostné záplaty

### Symboly
- ✅ Dokončené
- 🚀 Nová funkcia
- 🐛 Oprava chyby
- 📝 Dokumentácia
- 🔧 Konfigurácia
- 🎨 UI/UX
- ⚡ Výkon
- 🔐 Bezpečnosť
- 🗑️ Odstránené

---

**Repository**: https://github.com/sonics007/eshop_2pnet_dev
**Issues**: https://github.com/sonics007/eshop_2pnet_dev/issues
