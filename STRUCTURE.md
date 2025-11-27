# Modulárna štruktúra site/pages

## Hierarchia

```
lib/modules/site/
└── pages/                    # Zložka "Stránka"
    ├── visual/               # Vizuál & pozadie
    ├── links/                # Linky & odkazy  
    ├── menu/                 # Menu
    └── index.ts              # Agregátor
```

## Module Registry

**Module ID:** `site-pages`  
**Názov:** Stránka  
**Popis:** Správa obsahu a nastavení stránky

### Admin Panels (3)

1. **Vizuál & pozadie** - `/admin/visual`
   - Hero pozadie a farby
   - API: `/api/site/visual`

2. **Linky & odkazy** - `/admin/links`
   - Footer linky
   - API: `/api/site/links`

3. **Menu** - `/admin/menu`
   - Hlavné menu eshopu
   - API: `/api/site/menu`

## Výhody

✅ Všetky 3 panely zoskupené pod jednu sekciu "Stránka"  
✅ Zachovaná modulárnosť každého pod-modulu  
✅ Čisté API endpointy  
✅ TypeScript types OK
