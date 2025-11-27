# ESHOP - Rýchly štart (Quick Start)

## Pre nových používateľov

### Jednoduchá inštalácia na Debian 12

```bash
# 1. Prenos projektu na server (jeden z možností):

# a) Pomocou git
git clone <repository-url> /opt/eshop

# b) Pomocou scp z lokálneho PC
scp -r eshop/ user@server:/opt/eshop

# c) Pomocou wget/curl (ak máte archív)
wget https://example.com/eshop.tar.gz
tar -xzf eshop.tar.gz
mv eshop /opt/eshop

# 2. Spustenie inštalácie
cd /opt/eshop/instalacia
chmod +x install.sh
./install.sh

# 3. Hotovo! Aplikácia beží na http://server-ip:3000
```

---

## Základné príkazy

```bash
# Spustenie vývojového servera
cd /opt/eshop
npm run dev

# Spustenie produkčného servera
npm run build
npm start

# Správa systemd služby
sudo systemctl start eshop      # Spustiť
sudo systemctl stop eshop       # Zastaviť
sudo systemctl restart eshop    # Reštartovať
sudo systemctl status eshop     # Stav

# Sledovanie logov
sudo journalctl -u eshop -f

# Aktualizácia aplikácie
cd /opt/eshop/instalacia
./deploy.sh

# Zálohovanie
cd /opt/eshop/instalacia
./backup.sh
```

---

## Prístupové údaje

### Admin panel
- **URL**: `http://server-ip:3000/admin`
- **Používateľ**: Vytvorený počas inštalácie pomocou `createAdmin.js`

### Databáza
- **Typ**: SQLite
- **Umiestnenie**: `/opt/eshop/prisma/dev.db`
- **Prehliadač**: `sqlite3 /opt/eshop/prisma/dev.db`

---

## Riešenie najčastejších problémov

### Server sa nespustí
```bash
# Kontrola logov
sudo journalctl -u eshop -n 50

# Manuálne testovanie
cd /opt/eshop
npm start
```

### Port 3000 je obsadený
```bash
# Nájdenie procesu
sudo netstat -tlnp | grep 3000

# Zabitie procesu
sudo kill -9 <PID>
```

### Chýba závislosti
```bash
cd /opt/eshop
npm install
npx prisma generate
```

### Databáza sa nenačíta
```bash
cd /opt/eshop
npx prisma migrate deploy
```

---

## Užitočné odkazy

- **Plná dokumentácia**: [README.md](README.md)
- **Projektová dokumentácia**: `/opt/eshop/CLAUDE.md`
- **Nginx konfigurácia**: `/etc/nginx/sites-available/eshop`
- **Systemd služba**: `/etc/systemd/system/eshop.service`

---

## Bezpečnostné poznámky

1. **Zmeňte default hesla** vo všetkých admin účtoch
2. **Nastavte firewall**: `sudo ufw enable && sudo ufw allow 80,443/tcp`
3. **Aktivujte SSL**: `sudo certbot --nginx -d your-domain.com`
4. **Pravidelné zálohy**: Nastavte cron job pre `backup.sh`
5. **Aktualizujte systém**: `sudo apt-get update && sudo apt-get upgrade`

---

## Podpora

Pre detailnejšie informácie si prečítajte [README.md](README.md).
