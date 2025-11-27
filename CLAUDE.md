# ESHOP - Modular Architecture

## Prehľad projektu

B2B eshop postavený na Next.js 14 (App Router) s modulárnou architektúrou.
Každý modul je samostatný a pridanie nového modulu nesmie narušiť DB ani frontend.

## Tech Stack

- **Framework**: Next.js 14.1.0 (App Router)
- **Databáza**: SQLite + Prisma ORM
- **Styling**: Tailwind CSS
- **Jazyk**: TypeScript (strict)
- **Auth**: Custom s 2FA podporou (otplib)

## Štruktúra projektu

```
eshop/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/
│   │   │   ├── customer/     # Zákaznícke auth endpoints
│   │   │   └── admin/        # Admin auth endpoints (s 2FA)
│   │   ├── chat/             # Interný chat (bez Telegram/Messenger)
│   │   ├── products/
│   │   ├── orders/
│   │   ├── invoices/
│   │   └── ...
│   ├── admin/                # Admin panel stránky
│   └── ...                   # Frontend stránky
├── components/
│   ├── admin/                # Admin komponenty
│   │   └── panels/           # Lazy-load admin panely
│   └── ...                   # Zdieľané komponenty
├── lib/
│   ├── modules/              # MODULOVÝ SYSTÉM
│   │   ├── index.ts          # Centrálny registry modulov
│   │   ├── auth/
│   │   │   ├── customer/     # Zákaznícka autentifikácia
│   │   │   ├── admin/        # Admin autentifikácia
│   │   │   └── types.ts
│   │   ├── chat/             # Interný chat modul
│   │   ├── products/
│   │   └── orders/
│   ├── prisma.ts             # Prisma client
│   └── ...
└── prisma/
    └── schema.prisma         # Databázová schéma
```

## Modulový systém

### Registrácia modulov

Všetky moduly sú definované v `lib/modules/index.ts`:

```typescript
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  prismaModels?: string[];      // Databázové modely
  apiNamespace?: string;        // API route prefix
  adminPanels?: ModuleAdminPanel[];
  routes?: ModuleRoute[];
  dependencies?: string[];      // Závislosti na iných moduloch
}
```

### Aktívne moduly

| ID | Názov | Popis |
|----|-------|-------|
| `auth-customer` | Zákaznícka autentifikácia | Login/register zákazníkov |
| `auth-admin` | Admin autentifikácia | Login admina s 2FA |
| `products` | Produkty | Katalóg, kategórie |
| `cart` | Košík | Nákupný košík, checkout |
| `orders` | Objednávky | Správa objednávok |
| `invoices` | Faktúry | Generovanie faktúr |
| `chat` | Interný chat | Live chat (email notifikácie) |
| `site-settings` | Nastavenia webu | Vizuál, linky, menu |
| `flexibee` | ABRA Flexi | Účtovná integrácia |
| `logging` | Logovanie | Audit log |

### Pridanie nového modulu

1. Vytvorte priečinok `lib/modules/<nazov>/`
2. Vytvorte súbory:
   - `types.ts` - Typy
   - `service.ts` - Biznis logika
   - `index.ts` - Exporty
3. Pridajte definíciu do `lib/modules/index.ts`:

```typescript
export const myModule: ModuleDefinition = {
  id: 'my-module',
  name: 'Môj modul',
  description: 'Popis modulu',
  version: '1.0.0',
  enabled: true,
  prismaModels: ['MyModel'],
  apiNamespace: 'my-module',
  adminPanels: [
    { id: 'admin-my', label: 'Môj panel' }
  ]
};

// Pridať do MODULES array
export const MODULES: ModuleDefinition[] = [
  // ...existujúce
  myModule
];
```

4. Vytvorte API routes v `app/api/<apiNamespace>/`
5. (Voliteľné) Vytvorte admin panel v `components/admin/panels/`

## Autentifikácia

### Zákaznícka auth (`auth-customer`)

- **Context**: `lib/modules/auth/customer/context.tsx`
- **API**: `/api/auth/customer/login`, `/register`
- **Storage**: localStorage

### Admin auth (`auth-admin`)

- **Context**: `lib/modules/auth/admin/context.tsx`
- **API**: `/api/auth/admin/login`, `/verify-2fa`
- **Funkcie**:
  - Session timeout (30 min)
  - Auto-extend pri aktivite
  - 2FA podpora

## Chat modul

**Dôležité**: Chat je čisto interný - žiadna Telegram/Messenger integrácia.

- **Service**: `lib/modules/chat/service.ts`
- **Notifikácie**: Len email
- **API**:
  - `POST /api/chat/send-email` - Poslať správu
  - `GET /api/chat/admin/sessions` - Zoznam relácií
  - `POST /api/chat/admin/reply` - Admin odpoveď

## Databáza

### Príkazy

```bash
# Migrácia
npx prisma migrate dev

# Reset
npx prisma migrate reset

# Generovanie klienta
npx prisma generate

# Studio
npx prisma studio
```

### Modely

- `User` - Zákazníci a admini
- `Product`, `Category`, `SubCategory` - Katalóg
- `Order`, `OrderItem`, `OrderHistory` - Objednávky
- `Invoice` - Faktúry
- `ChatSession`, `ChatMessage` - Chat
- `Config` - Konfigurácia (JSON v value)

## Build a vývoj

```bash
# Vývoj
npm run dev

# Build
npm run build

# Produkcia
npm start

# Lint
npm run lint
```

## API Konvencie

- REST API v `app/api/`
- Responses: `{ success: true, data: ... }` alebo `{ success: false, error: '...' }`
- Auth: Bearer token v header alebo session cookie
- Pagination: `?page=1&pageSize=20`

## Dôležité súbory

| Súbor | Účel |
|-------|------|
| `lib/modules/index.ts` | Centrálny registry modulov |
| `lib/prisma.ts` | Prisma client singleton |
| `prisma/schema.prisma` | DB schéma |
| `app/admin/page.tsx` | Admin dashboard |
| `components/admin/AdminLayout.tsx` | Admin layout |

## Poznámky

- SQLite nepodporuje `mode: 'insensitive'` - nepoužívať v Prisma queries
- `paymentMethod` v Order je povinné pole - vždy poskytnúť hodnotu
- Chat používa interný systém s tawk.to widgetom
