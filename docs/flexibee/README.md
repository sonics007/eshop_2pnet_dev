# Integrácia na ABRA Flexi API

Túto zložku použi ako základ pre konfiguráciu prístupu k externému účtovnému systému ABRA Flexi (FlexiBee API). Dokumentácia: https://www.flexibee.eu/api/dokumentace

## Navrhovaný postup

1. V ABRA Flexi založ prístupové údaje pre REST API (užívateľ, heslo, company code).
2. V projekte vytvor .env.flexibee so základnými premennými:
   `
   FLEXIBEE_URL=https://demo.flexibee.eu
   FLEXIBEE_COMPANY=demo
   FLEXIBEE_USERNAME=restuser
   FLEXIBEE_PASSWORD=secret
   `
3. Priprav service modul lib/flexibee.ts, ktorý rieši:
   - získanie autentifikácie (Basic auth)
   - volanie endpointu /faktura-vydana
   - mapovanie objednávok -> Flexi schéma
4. V admin rozhraní je dostupné tlačidlo "Odoslať do ABRA Flexi" (volá /api/flexibee/invoices).

## Poznámky
- FLEXIBEE API očakáva XML/JSON payload v tvare uvedenom v dokumentácii. V projekte generujeme JSON winstrom -> faktura-vydana.
- Pre testovanie používaj ABRA sandbox https://demo.flexibee.eu/demo/faktura-vydana.json.
- Objednávky z nášho e-shopu treba priradiť k partnerovi (adresár), inak API vráti chybu code=missing-address.
- Endpoint POST /api/flexibee/invoices očakáva payload { "invoiceNumber": "FA-2025-00021" } a po úspechu vracia { success: true }.

Sem doplň ďalšie poznámky z implementácie a testov (napr. sample curl požiadavky, mapping tabulky).
