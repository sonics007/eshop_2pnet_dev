# 🏷️ Verzionovanie projektu ESHOP

## Aktuálna verzia: **0.0.2**

Projekt používa [Semantic Versioning](https://semver.org/) vo formáte `MAJOR.MINOR.PATCH`:

- **MAJOR** (X.0.0) - Nekompatibilné zmeny API alebo hlavné prepracovanie
- **MINOR** (0.X.0) - Nové funkcie, spätne kompatibilné
- **PATCH** (0.0.X) - Opravy chýb, spätne kompatibilné

## História verzií

| Verzia | Dátum | Popis |
|--------|-------|-------|
| [0.0.2](https://github.com/sonics007/eshop_2pnet_dev/releases/tag/v0.0.2) | 2025-11-27 | Root podpora, troubleshooting, auto-start |
| [0.0.1](https://github.com/sonics007/eshop_2pnet_dev/releases/tag/v0.0.1) | 2025-11-25 | Iniciálne vydanie |

Detailné zmeny: [CHANGELOG.md](../CHANGELOG.md)

---

## Ako aktualizovať verziu

### 1. Automatická metóda (Odporúčané)

```bash
cd instalacia
./bump-version.sh 0.0.3
```

Tento skript automaticky aktualizuje:
- ✅ `VERSION` súbor
- ✅ `package.json`
- ✅ `README.md`
- ✅ Všetky inštalačné skripty
- ✅ Dokumentáciu

### 2. Manuálna metóda

```bash
# 1. Aktualizovať verziu v súboroch
echo "0.0.3" > VERSION

# 2. Upraviť package.json
sed -i 's/"version": ".*"/"version": "0.0.3"/' package.json

# 3. Upraviť README.md
sed -i 's/\*\*Verzia: .*\*\*/\*\*Verzia: 0.0.3\*\*/' README.md
sed -i 's/version-[0-9.]*-blue/version-0.0.3-blue/' README.md

# 4. Upraviť inštalačné skripty
sed -i 's/VERSION=".*"/VERSION="0.0.3"/' instalacia/install.sh
sed -i 's/Verzia: [0-9.]*/Verzia: 0.0.3/' instalacia/install-from-github.sh
sed -i 's/Verzia: [0-9.]*/Verzia: 0.0.3/' instalacia/quick-install.sh
sed -i 's/\*\*Verzia\*\*: [0-9.]*/\*\*Verzia\*\*: 0.0.3/' instalacia/README.md

# 5. Aktualizovať CHANGELOG.md
nano CHANGELOG.md  # Pridať sekciu [0.0.3]

# 6. Commitnúť a tagovať
git add .
git commit -m "Verzia 0.0.3 - Popis zmien"
git tag -a v0.0.3 -m "Verzia 0.0.3 - Popis zmien"
git push && git push --tags
```

---

## Súbory obsahujúce verziu

### Hlavné súbory
- [`VERSION`](../VERSION) - Jednoduchý textový súbor s číslom verzie
- [`package.json`](../package.json) - npm verzia
- [`README.md`](../README.md) - Zobrazenie verzie a badge
- [`CHANGELOG.md`](../CHANGELOG.md) - História zmien

### Inštalačné skripty
- [`instalacia/install.sh`](install.sh) - Hlavný inštalačný skript
- [`instalacia/install-from-github.sh`](install-from-github.sh) - GitHub inštalácia
- [`instalacia/quick-install.sh`](quick-install.sh) - Rýchla inštalácia
- [`instalacia/README.md`](README.md) - Inštalačná dokumentácia

---

## CHANGELOG formát

Pri aktualizácii verzie pridajte do `CHANGELOG.md`:

```markdown
## [0.0.3] - 2025-11-XX

### Pridané
- ✅ Nová funkcia 1
- ✅ Nová funkcia 2

### Zmenené
- 📝 Zmena 1
- 📝 Zmena 2

### Opravené
- 🐛 Oprava chyby 1
- 🐛 Oprava chyby 2

### Odstranené
- 🗑️ Odstránená stará funkcia
```

---

## Git tagy

Git tagy umožňujú jednoduché verzionovanie v repository:

```bash
# Vytvoriť tag
git tag -a v0.0.3 -m "Verzia 0.0.3 - Krátky popis"

# Pushnúť tag na GitHub
git push --tags

# Zobraziť všetky tagy
git tag -l

# Checkout konkrétnej verzie
git checkout v0.0.2
```

---

## GitHub Releases

Po pushnutí tagu vytvorte release na GitHub:

1. Prejdite na https://github.com/sonics007/eshop_2pnet_dev/releases
2. Kliknite na "Draft a new release"
3. Vyberte tag (napr. v0.0.3)
4. Zadajte názov release (napr. "Verzia 0.0.3")
5. Skopírujte sekciu z CHANGELOG.md do popisu
6. Kliknite "Publish release"

---

## Semantic Versioning príklady

### 0.0.x - Beta vývoj (aktuálne)
- `0.0.1` - Prvé funkčné vydanie
- `0.0.2` - Opravy a malé vylepšenia
- `0.0.3` - Ďalšie opravy

### 0.x.0 - Alpha/Beta nové funkcie
- `0.1.0` - Prvé stabilné API
- `0.2.0` - Pridanie novej hlavnej funkcie
- `0.3.0` - Ďalšie rozšírenia

### 1.0.0 - Produkčné vydanie
- `1.0.0` - Prvé produkčné vydanie
- `1.0.1` - Oprava kritickej chyby
- `1.1.0` - Nová funkcia (spätne kompatibilná)
- `2.0.0` - Breaking changes

---

## Kontrolný zoznam pre release

Pred vytvorením novej verzie:

- [ ] Všetky testy prechádzajú (`npm test`)
- [ ] Build je úspešný (`npm run build`)
- [ ] CHANGELOG.md je aktualizovaný
- [ ] VERSION súbor je aktualizovaný
- [ ] package.json má správnu verziu
- [ ] README.md má správnu verziu
- [ ] Dokumentácia je aktuálna
- [ ] Všetky zmeny sú commitnuté
- [ ] Git tag je vytvorený
- [ ] Zmeny sú pushnuté na GitHub
- [ ] GitHub Release je vytvorený

---

## Automatizácia (budúcnosť)

V budúcnosti možno pridať:
- GitHub Actions pre automatické release
- Automatické generovanie CHANGELOG z commit messages
- CI/CD pipeline pre testing pred release
- Automatické publikovanie na npm (ak bude verejný)

---

**Autor**: Claude Code
**Posledná aktualizácia**: 2025-11-27
**Repository**: https://github.com/sonics007/eshop_2pnet_dev
