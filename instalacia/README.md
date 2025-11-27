# ESHOP - Inštalačná príručka pre Debian 12

## Obsah
1. [Požiadavky](#požiadavky)
2. [Rýchla inštalácia](#rýchla-inštalácia)
3. [Manuálna inštalácia](#manuálna-inštalácia)
4. [Konfigurácia](#konfigurácia)
5. [Správa servera](#správa-servera)
6. [Riešenie problémov](#riešenie-problémov)

---

## Požiadavky

### Minimálne systémové požiadavky
- **OS**: Debian 12 (Bookworm)
- **RAM**: 2GB (odporúčané 4GB+)
- **Disk**: 5GB voľného miesta
- **CPU**: 2 jadrá (odporúčané)

### Software
Inštalačný skript automaticky nainštaluje:
- Node.js 20.x
- npm
- SQLite3
- Git
- Build tools

---

## Rýchla inštalácia

### 1. Prenos projektu na server

```bash
# Pomocou git
git clone <repository-url> /opt/eshop
cd /opt/eshop

# Alebo pomocou scp (z lokálneho počítača)
scp -r eshop/ user@server:/opt/eshop
```

### 2. Spustenie inštalačného skriptu

```bash
cd /opt/eshop/instalacia
chmod +x install.sh
./install.sh
```

Skript vás prevedie interaktívnou inštaláciou a spýta sa na:
- Naplnenie databázy ukážkovými dátami
- Vytvorenie systemd služby
- Konfiguráciu firewallu
- Inštaláciu nginx ako reverse proxy
- Build produkčnej verzie

### 3. Prístup k aplikácii

Po úspešnej inštalácii:
- **Vývojový server**: `http://server-ip:3000`
- **S nginx**: `http://server-ip`
- **Admin panel**: `http://server-ip/admin`

---

## Manuálna inštalácia

### 1. Aktualizácia systému

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Inštalácia Node.js 20.x

```bash
# Pridanie NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Inštalácia Node.js
sudo apt-get install -y nodejs

# Overenie verzie
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 3. Inštalácia systémových závislostí

```bash
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    sqlite3 \
    ca-certificates \
    gnupg
```

### 4. Nastavenie projektu

```bash
cd /opt/eshop

# Vytvorenie .env súboru
cp .env.example .env

# Úprava .env (použite nano alebo vim)
nano .env
```

### 5. Inštalácia závislostí

```bash
# Inštalácia npm balíčkov
npm install

# Generovanie Prisma klienta
npx prisma generate
```

### 6. Inicializácia databázy

```bash
# Spustenie migrácií
npx prisma migrate deploy

# Voliteľne: naplnenie ukážkovými dátami
npm run db:seed
```

### 7. Vytvorenie admin používateľa

```bash
node scripts/createAdmin.js
```

### 8. Build produkčnej verzie

```bash
npm run build
```

### 9. Spustenie servera

```bash
# Vývojový server
npm run dev

# Produkčný server
npm start
```

---

## Konfigurácia

### Premenné prostredia (.env)

```bash
# Databáza
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET="vygenerovany-nahodny-secret"

# Email (pre notifikácie)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="eshop@example.com"
EMAIL_PASS="heslo"
EMAIL_FROM="ESHOP <eshop@example.com>"

# ABRA Flexi API (voliteľné)
FLEXIBEE_URL="https://your-flexibee.com"
FLEXIBEE_COMPANY="company"
FLEXIBEE_AUTH_TOKEN="token"

# Environment
NODE_ENV="production"
PORT=3000
```

### Systemd služba

Automatické spustenie pri štarte systému:

```bash
# Vytvorenie služby
sudo nano /etc/systemd/system/eshop.service
```

```ini
[Unit]
Description=ESHOP Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/eshop
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Aktivácia služby
sudo systemctl daemon-reload
sudo systemctl enable eshop
sudo systemctl start eshop
```

### Nginx reverse proxy

```bash
# Inštalácia nginx
sudo apt-get install -y nginx

# Vytvorenie konfigurácie
sudo nano /etc/nginx/sites-available/eshop
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
```

```bash
# Aktivácia konfigurácie
sudo ln -s /etc/nginx/sites-available/eshop /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### SSL/TLS s Let's Encrypt

```bash
# Inštalácia Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Získanie certifikátu
sudo certbot --nginx -d your-domain.com

# Automatická obnova
sudo systemctl enable certbot.timer
```

---

## Správa servera

### Základné príkazy

```bash
# Kontrola stavu služby
sudo systemctl status eshop

# Spustenie služby
sudo systemctl start eshop

# Zastavenie služby
sudo systemctl stop eshop

# Reštart služby
sudo systemctl restart eshop

# Sledovanie logov
sudo journalctl -u eshop -f

# Kontrola nginx
sudo systemctl status nginx
sudo nginx -t
```

### Aktualizácia aplikácie

```bash
cd /opt/eshop

# Zastavenie služby
sudo systemctl stop eshop

# Stiahnutie zmien (ak git)
git pull

# Aktualizácia závislostí
npm install

# Migrácia databázy
npx prisma migrate deploy

# Generovanie Prisma klienta
npx prisma generate

# Build novej verzie
npm run build

# Spustenie služby
sudo systemctl start eshop
```

### Zálohovanie

```bash
# Záloha databázy
sqlite3 /opt/eshop/prisma/dev.db ".backup /backup/eshop-$(date +%Y%m%d).db"

# Záloha celého projektu
tar -czf /backup/eshop-full-$(date +%Y%m%d).tar.gz /opt/eshop

# Automatická záloha (cron)
# Pridajte do crontab: sudo crontab -e
0 2 * * * sqlite3 /opt/eshop/prisma/dev.db ".backup /backup/eshop-$(date +\%Y\%m\%d).db"
```

### Monitorovanie

```bash
# CPU a pamäť
htop

# Diskový priestor
df -h

# Aktívne spojenia
sudo netstat -tlnp | grep node

# Sledovanie logov v reálnom čase
sudo journalctl -u eshop -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Riešenie problémov

### Server sa nespustí

```bash
# Kontrola logov
sudo journalctl -u eshop -n 50

# Kontrola, či port nie je obsadený
sudo netstat -tlnp | grep 3000

# Kontrola oprávnení
ls -la /opt/eshop
sudo chown -R www-data:www-data /opt/eshop

# Manuálne testovanie
cd /opt/eshop
npm start
```

### Problémy s databázou

```bash
# Reset databázy (POZOR: vymaže všetky dáta!)
cd /opt/eshop
rm -f prisma/dev.db
npx prisma migrate deploy
npm run db:seed

# Kontrola integrity
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Zálohovaná kópia
sqlite3 prisma/dev.db ".backup prisma/dev.db.backup"
```

### Problémy s pamäťou

```bash
# Zvýšenie Node.js heap limit
# V /etc/systemd/system/eshop.service pridajte:
Environment="NODE_OPTIONS=--max-old-space-size=4096"

# Reštart služby
sudo systemctl daemon-reload
sudo systemctl restart eshop
```

### Nginx chyby

```bash
# Test konfigurácie
sudo nginx -t

# Kontrola logov
sudo tail -f /var/log/nginx/error.log

# Reštart nginx
sudo systemctl restart nginx
```

### Pomalý výkon

```bash
# Optimalizácia Next.js
# V .env nastavte:
NODE_ENV=production

# Build s optimalizáciou
npm run build

# PM2 pre lepšie riadenie procesov
npm install -g pm2
pm2 start npm --name "eshop" -- start
pm2 save
pm2 startup
```

---

## Bezpečnostné odporúčania

### 1. Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status
```

### 2. Fail2ban

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Pravidelné aktualizácie

```bash
# Automatické bezpečnostné aktualizácie
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Obmedzenie prístupu k admin panelu

V nginx konfigurácii:

```nginx
location /admin {
    allow 192.168.1.0/24;  # Vaša IP sieť
    deny all;

    proxy_pass http://localhost:3000;
    # ... ostatné proxy nastavenia
}
```

---

## Podpora

Pre podporu a reportovanie problémov:
- Dokumentácia: `/opt/eshop/CLAUDE.md`
- Issues: [GitHub Issues]
- Email: support@example.com

---

**Autor**: Claude Code
**Verzia**: 1.0.0
**Posledná aktualizácia**: 2025-11-25
