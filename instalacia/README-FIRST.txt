╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║                    ESHOP - INŠTALAČNÝ BALÍK                           ║
║                         Debian 12                                      ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

📦 ČO SA NACHÁDZA V TEJTO ZLOŽKE:

┌────────────────────────────────────────────────────────────────────────┐
│  package/eshop-debian12-*.tar.gz  →  KOMPLETNÝ PROJEKT (1.2 MB)      │
└────────────────────────────────────────────────────────────────────────┘

Tento archív obsahuje celú aplikáciu pripravenú na inštaláciu.


📖 DOKUMENTÁCIA:

  NAVOD.txt          →  Jednoduchý návod (ZAČNITE TU!)
  OBSAH.md           →  Prehľad obsahu balíka
  README.md          →  Kompletná príručka
  quick-start.md     →  Rýchly štart
  INDEX.md           →  Index všetkých súborov


🚀 SKRIPTY:

  install.sh         →  Hlavný inštalačný skript
  deploy.sh          →  Aktualizácia projektu
  backup.sh          →  Zálohovanie
  package-project.sh →  Vytvorenie nového balíka


⚙️  KONFIGURÁCIE:

  .env.production.example  →  Príklad environment variables
  nginx-example.conf       →  Príklad nginx konfigurácie


═══════════════════════════════════════════════════════════════════════

🎯 RÝCHLY ŠTART:

1. Preneste balík na server:
   scp package/eshop-debian12-*.tar.gz user@server:/tmp/

2. Na serveri rozbaliť a nainštalovať:
   cd /opt
   sudo tar -xzf /tmp/eshop-debian12-*.tar.gz
   cd eshop/instalacia
   chmod +x install.sh
   ./install.sh

3. Hotovo! Aplikácia beží na http://server:3000

═══════════════════════════════════════════════════════════════════════

⚠️  PREČÍTAJTE SI NAVOD.txt PRE DETAILY!

