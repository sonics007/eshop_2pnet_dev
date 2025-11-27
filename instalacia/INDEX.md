# ESHOP - Inštalačná zložka

## 📁 Obsah zložky `instalacia/`

### 🚀 Hlavné skripty

| Súbor | Popis | Použitie |
|-------|-------|----------|
| **install.sh** | Hlavný inštalačný skript | `./install.sh` |
| **deploy.sh** | Deployment/aktualizačný skript | `./deploy.sh` |
| **backup.sh** | Zálohovací skript | `./backup.sh` |

### 📖 Dokumentácia

| Súbor | Popis |
|-------|-------|
| **README.md** | Kompletná inštalačná príručka |
| **quick-start.md** | Rýchly štart guide |
| **INDEX.md** | Tento súbor - prehľad |

### ⚙️ Konfiguračné súbory

| Súbor | Popis | Umiestnenie po inštalácii |
|-------|-------|---------------------------|
| **.env.production.example** | Príklad produkčných premenných | Skopírovať do `../.env` |
| **nginx-example.conf** | Príklad nginx konfigurácie | `/etc/nginx/sites-available/eshop` |

---

## 🎯 Rýchly štart

### 1. Prvá inštalácia

```bash
cd /opt/eshop/instalacia
chmod +x *.sh
./install.sh
```

Skript vás prevedie:
- ✅ Inštaláciou Node.js a závislostí
- ✅ Nastavením projektu a databázy
- ✅ Vytvorením admin používateľa
- ✅ Konfiguráciou systemd služby
- ✅ Nastavením nginx (voliteľne)
- ✅ Buildovaním produkčnej verzie

### 2. Aktualizácia existujúcej inštalácie

```bash
cd /opt/eshop/instalacia
./deploy.sh
```

Skript:
- 📦 Zálohuje databázu
- 🔄 Stiahne najnovšiu verziu
- 📥 Aktualizuje závislosti
- 🔨 Zbuilduje novú verziu
- ♻️ Reštartuje služby

### 3. Zálohovanie

```bash
cd /opt/eshop/instalacia
./backup.sh
```

Vytvorí:
- 💾 Zálohu databázy (komprimovanú)
- 📦 Voliteľne plnú zálohu projektu
- 🗑️ Automaticky vymaže staré zálohy (>30 dní)

---

## 📋 Pred inštaláciou

### Systémové požiadavky

- **OS**: Debian 12 (Bookworm)
- **RAM**: 2GB minimum, 4GB+ odporúčané
- **Disk**: 5GB voľného miesta
- **Port**: 3000 (alebo konfigurovateľný)

### Prístup

- **SSH prístup** na server
- **Sudo práva** (skript sa spýta na heslo pri potrebe)
- **Internet** (pre sťahovanie závislostí)

---

## 🔧 Riešenie problémov

### Skript sa nespustí

```bash
# Pridanie spúšťacích práv
chmod +x instalacia/*.sh

# Kontrola line endings (ak prenesené z Windows)
dos2unix instalacia/*.sh  # alebo:
sed -i 's/\r$//' instalacia/*.sh
```

### Node.js verzia

Skript automaticky nainštaluje Node.js 20.x. Ak máte staršiu verziu:

```bash
# Odstránenie starej verzie
sudo apt-get remove nodejs npm

# Opätovné spustenie install.sh
./install.sh
```

### Port 3000 obsadený

```bash
# Zmena portu v .env
PORT=3001

# Alebo zabitie procesu na porte 3000
sudo netstat -tlnp | grep 3000
sudo kill -9 <PID>
```

---

## 📚 Ďalšie zdroje

### Dokumentácia

- [README.md](README.md) - Kompletná príručka
- [quick-start.md](quick-start.md) - Rýchly štart
- [../CLAUDE.md](../CLAUDE.md) - Projektová dokumentácia

### Príklady

- [.env.production.example](.env.production.example) - Environment variables
- [nginx-example.conf](nginx-example.conf) - Nginx konfigurácia

### Užitočné príkazy

```bash
# Kontrola stavu služby
sudo systemctl status eshop

# Sledovanie logov
sudo journalctl -u eshop -f

# Reštart nginx
sudo systemctl restart nginx

# Kontrola nginx konfigurácie
sudo nginx -t

# Databázová konzola
sqlite3 /opt/eshop/prisma/dev.db
```

---

## 🔐 Bezpečnosť

Po inštalácii nezabudnite:

1. ✅ Zmeniť všetky predvolené heslá
2. ✅ Nastaviť silný JWT_SECRET v .env
3. ✅ Aktivovať firewall: `sudo ufw enable`
4. ✅ Nainštalovať SSL certifikát: `sudo certbot --nginx`
5. ✅ Nastaviť pravidelné zálohy (cron)
6. ✅ Pravidelne aktualizovať systém

---

## 📞 Podpora

**Problémy s inštaláciou?**
1. Skontrolujte logy: `sudo journalctl -u eshop -n 50`
2. Prečítajte si [README.md](README.md) sekciu "Riešenie problémov"
3. Otvorte issue na GitHub (ak je dostupné)

---

**Vytvorené**: 2025-11-25
**Verzia**: 1.0.0
**Autor**: Claude Code
