# 🔧 Riešenie problémov - ESHOP Inštalácia

## ❌ Chyba: No space left on device (ENOSPC)

### Problém
```
npm warn tar TAR_ENTRY_ERROR ENOSPC: no space left on device, write
```

### Príčina
LXC kontajner má nedostatok miesta na disku. Node.js projekt s `node_modules` potrebuje:
- **Minimálne**: 1.5 GB voľného miesta
- **Odporúčané**: 3-5 GB voľného miesta

### Riešenie 1: Zväčšenie LXC kontajnera (Odporúčané)

Na Proxmox host serveri:

```bash
# Zastavenie kontajnera
pct stop <CTID>

# Zväčšenie root disku (napr. z 8GB na 16GB)
pct resize <CTID> rootfs +8G

# Spustenie kontajnera
pct start <CTID>

# Pripojenie do kontajnera
pct enter <CTID>

# Kontrola voľného miesta
df -h
```

**Odporúčaná veľkosť pre ESHOP**: 16-20 GB

### Riešenie 2: Vyčistenie miesta v kontajneri

```bash
# Vyčistenie apt cache
apt-get clean
apt-get autoclean
apt-get autoremove

# Vyčistenie logov
journalctl --vacuum-time=2d

# Vyčistenie tmp
rm -rf /tmp/*

# Kontrola veľkých súborov
du -h / 2>/dev/null | grep '^[0-9.]*G'
```

### Riešenie 3: Presunutie node_modules na iný disk

Ak máte ďalší mountpoint s viac miestom:

```bash
# Vytvorenie symlinku
mkdir -p /mnt/data/eshop-node-modules
cd /opt/eshop
ln -s /mnt/data/eshop-node-modules node_modules
```

### Riešenie 4: Inštalácia s --legacy-peer-deps

Môže ušetriť miesto eliminovaním duplicitných závislostí:

```bash
cd /opt/eshop
npm install --legacy-peer-deps --no-optional
```

---

## ❌ Chyba: Permission denied

### Problém
```
EACCES: permission denied, mkdir '/opt/eshop'
```

### Riešenie
```bash
# Inštalácia ako root v LXC kontajneri
cd /opt/eshop/instalacia
./install.sh

# Alebo zmena vlastníctva
chown -R root:root /opt/eshop
```

---

## ❌ Chyba: Port 3000 already in use

### Problém
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Riešenie 1: Nájdenie procesu na porte 3000
```bash
# Nájsť PID procesu
lsof -i :3000
# alebo
netstat -tlnp | grep 3000

# Zabiť proces
kill -9 <PID>
```

### Riešenie 2: Zmena portu
```bash
# V .env súbore
PORT=3001

# Alebo pri spustení
PORT=3001 npm run dev
```

---

## ❌ Chyba: Node.js version too old

### Problém
```
error: The engine "node" is incompatible with this module
```

### Riešenie
```bash
# Odstránenie starej verzie
apt-get remove --purge nodejs npm

# Inštalácia Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Kontrola verzie
node -v  # Malo by byť v20.x
npm -v
```

---

## ❌ Chyba: Database connection failed

### Problém
```
PrismaClientInitializationError: Can't reach database server
```

### Riešenie
```bash
# Kontrola, či existuje databáza
ls -lh prisma/dev.db

# Regenerovanie Prisma klienta
cd /opt/eshop
npx prisma generate

# Nové migrácie
npx prisma migrate dev

# Reset databázy (POZOR: vymaže dáta!)
npx prisma migrate reset
```

---

## ❌ Chyba: Build failed

### Problém
```
Error: Build failed with errors
```

### Riešenie 1: Vyčistenie cache
```bash
cd /opt/eshop
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Riešenie 2: Zvýšenie Node.js memory
```bash
# V package.json už je nastavené na 8GB
# Ak nestačí, zvýšte:
NODE_OPTIONS="--max-old-space-size=16384" npm run build
```

---

## ❌ Chyba: Systemd service failed

### Problém
```
Job for eshop.service failed
```

### Diagnostika
```bash
# Kontrola statusu
systemctl status eshop

# Zobrazenie logov
journalctl -u eshop -n 50

# Test manuálneho spustenia
cd /opt/eshop
npm start
```

### Riešenie
```bash
# Oprava service súboru
nano /etc/systemd/system/eshop.service

# Reload
systemctl daemon-reload
systemctl restart eshop
```

---

## ❌ Chyba: Cannot find module

### Problém
```
Error: Cannot find module 'next'
```

### Riešenie
```bash
cd /opt/eshop
npm install
npx prisma generate
```

---

## ❌ Chyba: Git clone failed

### Problém
```
fatal: could not read Username for 'https://github.com'
```

### Riešenie
```bash
# Pre private repository, použite SSH klúč alebo token
git clone https://username:token@github.com/sonics007/eshop_2pnet_dev.git

# Alebo najprv nastavte credentials
git config --global credential.helper store
```

---

## 🔍 Diagnostické príkazy

### Kontrola systému
```bash
# Voľné miesto
df -h

# RAM
free -h

# CPU
top

# Bežiace procesy Node.js
ps aux | grep node

# Verzie
node -v
npm -v
```

### Kontrola projektu
```bash
cd /opt/eshop

# NPM status
npm list --depth=0

# Prisma status
npx prisma validate

# Next.js info
npx next info
```

### Kontrola služieb
```bash
# Systemd
systemctl list-units --type=service | grep eshop

# Nginx
nginx -t
systemctl status nginx

# Firewall
ufw status
```

---

## 📞 Potrebujete pomoc?

Ak problém pretrváva:

1. **Zhromaždite diagnostické info**:
   ```bash
   cd /opt/eshop/instalacia
   ./diagnostics.sh > diagnostics.txt
   ```

2. **Vytvorte GitHub Issue**:
   - https://github.com/sonics007/eshop_2pnet_dev/issues
   - Priložte `diagnostics.txt`
   - Popíšte kroky vedúce k chybe

3. **Kontakt**:
   - Web: https://www.2pnet.cz

---

**Aktualizované**: 2025-11-27
**Verzia**: 1.0
