# 🚀 Inštalácia ESHOP z GitHubu na Debian 12

## 🎯 Najrýchlejšia inštalácia (1 príkaz)

Pripojte sa na svoj Debian 12 server a spustite:

```bash
curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/quick-install.sh | bash
```

**To je všetko!** 🎉

---

## 📋 Metóda 1: Automatická inštalácia (Odporúčané)

### Krok 1: Stiahnutie a spustenie

```bash
# Pomocou wget
wget -O - https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/install-from-github.sh | bash

# Alebo pomocou curl
curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/install-from-github.sh | bash
```

### Čo sa stane:

1. ✅ Stiahne projekt z GitHubu
2. ✅ Nainštaluje Node.js 20.x
3. ✅ Nainštaluje všetky závislosti
4. ✅ Nakonfiguruje databázu
5. ✅ Vytvorí admin používateľa
6. ✅ Voliteľne: Systemd služba, nginx, firewall

**Odhadovaný čas:** 5-10 minút

---

## 📋 Metóda 2: Manuálna inštalácia

### Krok 1: Stiahnutie projektu

```bash
# Klonujte repozitár
sudo apt-get update
sudo apt-get install -y git
cd /opt
sudo git clone https://github.com/sonics007/eshop_2pnet_dev.git eshop
sudo chown -R $USER:$USER eshop
cd eshop
```

### Krok 2: Spustenie inštalácie

```bash
cd instalacia
chmod +x install.sh
./install.sh
```

---

## 📋 Metóda 3: Stiahnuť ako ZIP

### Krok 1: Stiahnuť archív

```bash
cd /opt
sudo wget https://github.com/sonics007/eshop_2pnet_dev/archive/refs/heads/main.zip
sudo apt-get install -y unzip
sudo unzip main.zip
sudo mv eshop_2pnet_dev-main eshop
sudo chown -R $USER:$USER eshop
cd eshop
```

### Krok 2: Spustenie inštalácie

```bash
cd instalacia
chmod +x install.sh
./install.sh
```

---

## ⚙️ Vlastné nastavenia

### Zmena inštalačného adresára

```bash
# Defaultne: /opt/eshop
# Pre inštaláciu do iného adresára:
INSTALL_DIR=/home/user/eshop curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/install-from-github.sh | bash
```

### Špecifická vetva (branch)

```bash
cd /opt
sudo git clone -b develop https://github.com/sonics007/eshop_2pnet_dev.git eshop
```

---

## 🔧 Po inštalácii

### Aplikácia beží na:

- **Homepage**: `http://your-server-ip:3000`
- **Admin panel**: `http://your-server-ip:3000/admin`

### Správa služby (ak ste vytvorili systemd service):

```bash
sudo systemctl start eshop      # Spustiť
sudo systemctl stop eshop       # Zastaviť
sudo systemctl restart eshop    # Reštartovať
sudo systemctl status eshop     # Stav
```

### Logy:

```bash
sudo journalctl -u eshop -f     # Sledovanie logov
```

---

## 🔄 Aktualizácia

Pre aktualizáciu na najnovšiu verziu z GitHubu:

```bash
cd /opt/eshop/instalacia
./deploy.sh
```

Alebo manuálne:

```bash
cd /opt/eshop
git pull
npm install
npx prisma migrate deploy
npm run build
sudo systemctl restart eshop
```

---

## 💾 Zálohovanie

```bash
cd /opt/eshop/instalacia
./backup.sh
```

---

## 🛠️ Riešenie problémov

### Skript sa nespustí

```bash
# Ak chyba: "command not found"
sudo apt-get install curl

# Ak chyba s oprávneniami
chmod +x install-from-github.sh
bash install-from-github.sh
```

### Git chyba

```bash
# Ak git nie je nainštalovaný
sudo apt-get update
sudo apt-get install -y git

# Ak chyba pri klonovaní
cd /opt
sudo rm -rf eshop
sudo git clone https://github.com/sonics007/eshop_2pnet_dev.git eshop
```

### Port 3000 obsadený

```bash
# Nájdite proces na porte 3000
sudo netstat -tlnp | grep 3000

# Zabite proces
sudo kill -9 <PID>
```

---

## 📚 Dokumentácia

Po inštalácii si prečítajte:

- `/opt/eshop/CLAUDE.md` - Kompletná dokumentácia projektu
- `/opt/eshop/instalacia/README.md` - Detailná inštalačná príručka
- `/opt/eshop/instalacia/NAVOD.txt` - Jednoduchý návod

---

## 🔐 Bezpečnosť

⚠️ **DÔLEŽITÉ** po inštalácii:

1. **Zmeňte admin heslo**
2. **Nastavte silný JWT_SECRET** v `/opt/eshop/.env`
3. **Aktivujte firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22,80,443/tcp
   ```
4. **Nainštalujte SSL certifikát**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 📞 Podpora

- **GitHub Issues**: https://github.com/sonics007/eshop_2pnet_dev/issues
- **Repository**: https://github.com/sonics007/eshop_2pnet_dev
- **Web**: https://www.2pnet.cz

---

## 📝 Príklad: Kompletná inštalácia

```bash
# 1. Pripojenie na server
ssh user@your-server.com

# 2. Automatická inštalácia (1 príkaz)
curl -sSL https://raw.githubusercontent.com/sonics007/eshop_2pnet_dev/main/instalacia/quick-install.sh | bash

# 3. Hotovo! Aplikácia beží na http://your-server.com:3000
```

**Trvanie:** ~5 minút

---

**Vytvorené**: 2025-11-25
**Pre**: Debian 12 (Bookworm)
**Repository**: https://github.com/sonics007/eshop_2pnet_dev
