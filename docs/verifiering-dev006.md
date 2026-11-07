# DEV-006 – Offline PWA och lokal persistens

## Funktioner
- PWA byggs med en versionerad Workbox-precache för HTML, JavaScript, CSS, ikoner och **WebAssembly**.
- Gamla cacheversioner rensas. Navigering till appens startsida kan serveras från den lokala cachen.
- Tidigare historik och minne sparas på enheten; även valt läge (Standard/Vetenskaplig) och vinkelenhet (DEG/RAD) sparas nu mellan starter.
- Knappen **Rensa alla lokala kalkylatordata** rensar endast kalkylatorns egna två lagringsnycklar, inte annan lagring från samma ursprung.
- Lokal lagring kan vara blockerad: läsning/skrivning och korrupta data hanteras defensivt.

## Verifiering
- `npm test` kontrollerar tidigare Jest-tester samt nya tester för inställningar och rensning.
- `npm run build` bygger Rust/Wasm och PWA.
- `npm run test:e2e` använder Playwright Chromium mot den **faktiskt byggda** appen via Vite preview. Testet kontrollerar:
  1. Manifest (standalone + ikoner), aktiv service worker, och cachead `.wasm`.
  2. Onlineräkning med standardläge och vetenskapligt läge.
  3. Omstart med nätverket avstängt och fungerande beräkningar genom Wasm.
  4. Att historik och DEG/RAD-värden överlever omstart.
  5. Rensning av lokala appdata utan att påverka orelaterade nycklar.
- GitHub Actions-jobbet `pwa-offline` kör dessa browserkontroller. CI Rust/Web/Tauri kvarstår.

## Begränsningar
- Första installationen kräver nätverk och ett säkert ursprung (HTTPS eller localhost). Offline fungerar därefter först när nedladdningen och service worker-aktiveringen lyckats.
- Browser-E2E med Chromium bevisar inte samtliga webbläsares installationsdialoger eller operativsystemens native-distribution. Det följs upp i DEV-007/008.
- Eftersom gamla historikposter inte innehåller vinkelenhet kan återanvändning av trigonometriska uttryck med andra inställningar ge andra resultat; beräkning ska ske i användarens aktuella vinkelinställning.
