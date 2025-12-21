# ESHOP - Docker Inštalácia

## Rýchly štart

### 1. Klonovanie repozitára

```bash
git clone https://github.com/your-username/eshop.git
cd eshop
```

### 2. Konfigurácia

```bash
# Skopíruj vzorový .env súbor
cp .env.example .env

# Uprav .env podľa potreby
nano .env
```

### 3. Spustenie

```bash
# Build a spustenie
docker compose up -d --build

# Sledovanie logov
docker compose logs -f eshop
```

### 4. Prístup

Otvor v prehliadači: http://localhost:3000

Admin panel: http://localhost:3000/admin

## Príkazy

```bash
# Spustenie
docker compose up -d

# Zastavenie
docker compose down

# Reštart
docker compose restart

# Logy
docker compose logs -f eshop

# Shell v kontajneri
docker compose exec eshop sh

# Rebuild po zmenách
docker compose up -d --build --force-recreate
```

## Zálohovanie

```bash
# Záloha databázy
docker compose exec eshop cat /app/data/eshop.db > backup.db

# Záloha uploadov
docker cp eshop:/app/public/uploads ./uploads-backup
```

## Obnova

```bash
# Obnova databázy
docker cp backup.db eshop:/app/data/eshop.db

# Obnova uploadov
docker cp ./uploads-backup/. eshop:/app/public/uploads/
```

## Volumes

| Volume | Popis |
|--------|-------|
| `eshop-data` | SQLite databáza |
| `eshop-uploads` | Nahrané súbory (obrázky produktov) |

## Porty

| Port | Popis |
|------|-------|
| 3000 | HTTP (Next.js) |

## Troubleshooting

### Kontajner sa nespustí

```bash
# Skontroluj logy
docker compose logs eshop

# Over stav
docker compose ps
```

### Databáza je prázdna

```bash
# Spusti seed
docker compose exec eshop npx prisma db seed
```

### Reset databázy

```bash
# Zmaž volume a reštartuj
docker compose down -v
docker compose up -d --build
```

## Produkčné nasadenie

Pre produkciu odporúčam:

1. Použiť reverse proxy (nginx/traefik)
2. Nastaviť SSL certifikát
3. Zmeniť `JWT_SECRET` na silný náhodný reťazec
4. Nastaviť firewall

### Príklad nginx konfigurácie

```nginx
server {
    listen 80;
    server_name eshop.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eshop.example.com;

    ssl_certificate /etc/letsencrypt/live/eshop.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eshop.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
