# Utvecklingsplan — ett verifierbart steg åt gången

## DEV-001 — Grundstruktur och exekverbar kedja
**Resultat:** Monorepo med Vite/React/TS, Tauri 2, Rust-kärna och wasm-bindgen. Körbar webb/desktop med `2+2 = 4`; manifest och service worker ingår.

**Verifiering:** `cargo fmt --check`, `cargo test`, `cargo clippy`, `npm ci`, `npm test`, `npm run build`; Tauri build på Windows och macOS i CI. Browser-PWA-validering när browser finns.

## DEV-002 — Matematisk parser och standardräkning
**Resultat:** säkra uttryck, operatorprioritet, parenteser, decimaler, unära tecken, felhantering; enhetstester.

**Verifiering:** Rust tabelltester med prioritet, 0-division, lång input, randomiserade/edge-case tester.

## DEV-003 — Standardgränssnitt och minne
**Resultat:** responsiv standardkalkylator, minnesfunktioner, tangentbordsstöd, tillgängliga knappar, lokal historik.

**Verifiering:** Jest-komponenttester, tangentbord, UI/e2e i browser, persistens och återställning.

## DEV-004 — Vetenskaplig kärna
**Resultat:** sin/cos/tan, inverser, DEG/RAD, log/ln, potenser, rötter, fakultet, π/e och domänfel.

**Verifiering:** referensvärden, toleranser, gränsvärden, feltyper; matchning native Rust och Wasm.

## DEV-005 — Vetenskapligt gränssnitt
**Resultat:** växla läge, utökad tangentbordslayout, kompakt mobilvy, formatering och tillgänglighet.

**Verifiering:** komponent- och browser-e2e, layout vid flera storlekar.

## DEV-006 — Offline PWA och persistens
**Resultat:** komplett manifest/cache/historik och offline.

**Verifiering:** Playwright-installabilitet, omstart offline, kontroll att wasm cachats; versionerad cache uppdateras.

## DEV-007 — Portabla Windows/macOS-byggen
**Resultat:** utprovade ZIP-paket, Windows x64, macOS ARM64/x64; signer- och runtime-dokumentation.

**Verifiering:** GitHub Actions build PASS, uppackning och start som vanlig användare på respektive OS; ingen installationsprocess.

## DEV-008 — Releasepipeline och acceptans
**Resultat:** GitHub Actions skapar tre distributionsfamiljer; releaseutkast med kontrollsummor; webb-PWA artefakt och valfri Pages-deploy.

**Verifiering:** skarp workflow_dispatch, alla jobb PASS, nedladdning/uppackning och E2E per plattform; dokumenterad kvarstående signerings-/policybegränsning.

## Utvecklingsprinciper
- Avsluta ett steg i taget med källkod, tester, dokumentation och komplett ZIP för överlämning.
- Ingen godkänd verifiering får simuleras; blockerad miljö deklareras.
- Versionslås via Cargo.lock och package-lock.json efter faktisk initialisering.
