# Arkitektur v0.1

## Komponenter
```text
apps/web (React / TypeScript / Vite)
 ├─ Standard / Vetenskaplig / Historik / Inställningar
 ├─ platform adapters (web / Tauri host)
 ├─ Rust Wasm bridge
 └─ PWA (manifest, service worker, HTTPS deployment)
             │
             ▼
crates/calculator-core (Rust, ingen OS-beroende kod)
 ├─ tokenizer + parser (definierad grammatik)
 ├─ evaluation (f64, DEG/RAD, feltyper)
 └─ wasm-bindgen facade
             ▲
             │ samma webfrontend och wasm
apps/desktop/src-tauri (Tauri 2 / Rust)
 └─ Windows / macOS fönster, ikoner och framtida hostfunktioner
```

## Motivering
Tauri-skalet paketerar den gemensamma frontend och Wasm-kärnan. Matematik utförs inte separat i JavaScript och Rust; detta eliminerar divergerande avrundnings-/operatorregler mellan PWA och desktop.

## Teknisk struktur
- `crates/calculator-core`: Rust-kärna med native enhetstester och separat wasm-bindgen export.
- `apps/web`: React, TypeScript, Vite, Jest i `__tests__`, PWA plugin.
- `apps/desktop/src-tauri`: Tauri 2, minsta tillåtna behörigheter och utan externa nätverkskrav.
- Lagring via gränssnitt; webbläsarens IndexedDB/localStorage efter kapacitetsbehov. Inga hemligheter.
- WASM byggs deterministiskt inför varje frontendbuild; bundlas lokalt för offline.

## Bygg och distribution
- PR och main: Rust fmt/clippy/test; frontend typecheck/lint/Jest; webbbuild; Tauri build smoke på Windows och macOS.
- Release: manuellt `workflow_dispatch` eller versions-tag. Separata jobb för web/PWA, Windows x64, macOS ARM64 och macOS x64; SHA-256 och artefakter.
- PWA: bygg katalog med manifest, service worker, WASM; GitHub Pages valfritt konfigurerat (baspath och scope testas).
- Windows: `tauri build --no-bundle`; paketera binär/resurser i ZIP. Runtime-krav för WebView2 kontrolleras.
- macOS: `tauri build --bundles app`; ZIP av `.app` (behåll symlänkar/metadata). Signering, ad-hoc eller certifikat/notarisering styrs av releasemiljö.
- Tauri-teamet anger att portabelt läge inte är officiellt stött; operativsystem och distributionspolicy måste därför valideras i slutlig acceptans.

## Risker
1. Portabel Tauri på låst Windows kan blockeras av App Control/AppLocker eller sakna WebView2.
2. Osignerad/notariserad macOS-app kan stoppas av Gatekeeper, oberoende av adminbehörighet.
3. Två macOS-arkitekturer och plattformsspecifika paket kräver verkliga CI-byggen.
4. WASM/PWA offline cache måste inkludera alla JS/CSS/WASM-resurser.
5. Beräkningsprecision kräver explicita fel- och avrundningsregler.

## Referenser
- https://v2.tauri.app/distribute/pipelines/github/
- https://v2.tauri.app/distribute/macos-application-bundle/
- https://github.com/tauri-apps/tauri-action
