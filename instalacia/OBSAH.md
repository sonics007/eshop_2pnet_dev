# 📦 ESHOP - Kompletný inštalačný balík pre Debian 12

## ✅ Čo máte k dispozícii

### 📁 Štruktúra zložky `instalacia/`

```
instalacia/
├── 📦 package/
│   └── eshop-debian12-YYYYMMDD-HHMMSS.tar.gz  ← KOMPLETNÝ PROJEKT
│
├── 🚀 SKRIPTY
│   ├── install.sh              ← Hlavný inštalačný skript
│   ├── deploy.sh               ← Aktualizačný skript
│   ├── backup.sh               ← Zálohovací skript
│   └── package-project.sh      ← Vytvorenie nového balíka
│
├── 📖 DOKUMENTÁCIA
│   ├── INDEX.md                ← Prehľad všetkého
│   ├── README.md               ← Kompletná príručka
│   ├── quick-start.md          ← Rýchly štart
│   └── OBSAH.md                ← Tento súbor
│
└── ⚙️ KONFIGURÁCIE
    ├── .env.production.example  ← Príklad .env
    └── nginx-example.conf       ← Príklad nginx
```

---

## 🎯 Ako nainštalovať na Debian 12

### Možnosť 1: Celý balík (Odporúčané)

```bash
# 1. Prenos kompletného balíka na server
scp instalacia/package/eshop-debian12-*.tar.gz user@server:/tmp/

# 2. Na serveri - rozbalenie
ssh user@server
cd /opt
sudo tar -xzf /tmp/eshop-debian12-*.tar.gz
cd eshop

# 3. Spustenie inštalácie
cd instalacia
chmod +x install.sh
./install.sh
```

### Možnosť 2: Celá zložka eshop

```bash
# Prenos celého projektu
scp -r /c/Users/user/Desktop/coding/eshop user@server:/opt/

# Na serveri
ssh user@server
cd /opt/eshop/instalacia
chmod +x install.sh
./install.sh
```

### Možnosť 3: Pomocou git (ak máte repository)

```bash
ssh user@server
cd /opt
git clone <your-repo-url> eshop
cd eshop/instalacia
chmod +x install.sh
./install.sh
```

---

## 📦 Obsah balíka

### Čo obsahuje `eshop-debian12-*.tar.gz`:

✅ **Kompletný Next.js projekt**
- `app/` - Všetky stránky a API routes
- `components/` - React komponenty
- `lib/` - Modulový systém a biznis logika
- `prisma/` - Databázová schéma a migrácie
- `scripts/` - Pomocné skripty
- `public/` - Statické súbory

✅ **Konfiguračné súbory**
- `package.json` - npm závislosti
- `next.config.mjs` - Next.js konfigurácia
- `tsconfig.json` - TypeScript konfigurácia
- `.env.example` - Príklad environment variables

✅ **Inštalačné skripty a dokumentácia**
- Všetky skripty z `instalacia/`
- Kompletná dokumentácia

✅ **Pripravené na okamžité použitie**
- Žiadne `node_modules` (ušetrí miesto)
- Žiadna `.next` build cache
- Žiadna databáza (vytvorí sa pri inštalácii)

---

## 🔧 Čo robí `install.sh`

Automaticky nainštaluje a nakonfiguruje:

1. ✅ **Node.js 20.x** a npm
2. ✅ **Systémové závislosti** (git, build-tools, sqlite3)
3. ✅ **npm balíčky** projektu
4. ✅ **Databázu** (migrácie + seed data)
5. ✅ **Admin používateľa** s 2FA
6. ✅ **Systemd službu** (voliteľne)
7. ✅ **Nginx reverse proxy** (voliteľne)
8. ✅ **Firewall pravidlá** (voliteľne)
9. ✅ **Production build** (voliteľne)

---

## 📊 Veľkosti a požiadavky

| Položka | Hodnota |
|---------|---------|
| **Balík (komprimovaný)** | ~1.2 MB |
| **Rozbalený projekt** | ~5 MB |
| **Po npm install** | ~300 MB |
| **Po build** | ~400 MB |
| **Minimálna RAM** | 2 GB |
| **Odporúčaná RAM** | 4 GB+ |
| **Diskový priestor** | 5 GB voľného |

---

## 🚀 Po inštalácii

Aplikácia bude dostupná na:

- **Homepage**: `http://server-ip:3000`
- **Admin panel**: `http://server-ip:3000/admin`
- **S nginx**: `http://server-ip` (port 80/443)

### Správa servera

```bash
# Systemd služba
sudo systemctl start eshop
sudo systemctl stop eshop
sudo systemctl restart eshop
sudo systemctl status eshop

# Sledovanie logov
sudo journalctl -u eshop -f

# Manuálne spustenie
cd /opt/eshop
npm run dev          # Vývojový režim
npm run build        # Build
npm start            # Produkčný režim
```

---

## 🔄 Aktualizácia

```bash
cd /opt/eshop/instalacia
./deploy.sh
```

Skript automaticky:
- Zálohuje databázu
- Stiahne najnovšiu verziu (ak git)
- Aktualizuje závislosti
- Spustí migrácie
- Zbuilduje novú verziu
- Reštartuje služby

---

## 💾 Zálohovanie

```bash
cd /opt/eshop/instalacia
./backup.sh
```

Vytvorí:
- Komprimovanú zálohu databázy
- Voliteľne celý projekt
- Automaticky maže staré zálohy (>30 dní)

---

## 📞 Pomoc

- **Hlavná príručka**: [README.md](README.md)
- **Rýchly štart**: [quick-start.md](quick-start.md)
- **Prehľad**: [INDEX.md](INDEX.md)
- **Projektová dokumentácia**: `/opt/eshop/CLAUDE.md`

---

## ⚠️ Dôležité poznámky

1. **Spustite ako bežný používateľ**, nie root
2. **Skript sa spýta na sudo heslo** pri inštalácii systémových balíčkov
3. **Interaktívna inštalácia** - budete sa musieť rozhodnúť o niektorých krokoch
4. **Po inštalácii zmeňte všetky heslá** a `JWT_SECRET` v `.env`
5. **V produkcii aktivujte SSL** pomocou certbot

---

**Vytvorené**: 2025-11-25
**Pre**: Debian 12 (Bookworm)
**Autor**: Claude Code
**Verzia projektu**: 1.0.0
