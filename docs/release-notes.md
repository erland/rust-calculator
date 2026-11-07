# Kalkylator – release candidate (DEV-008)

Detta är ett **releaseutkast för acceptanstest**, inte en godkänd slutrelease.

## Innehåll
- `kalkylator-pwa.zip`: produktionsbyggd PWA med Rust/WebAssembly-motor, manifest och service worker.
- `kalkylator-windows-x64-portable.zip`: portabel Windows x64-binär.
- `kalkylator-macos-arm64-portable.zip`: macOS-app för Apple Silicon.
- `kalkylator-macos-x64-portable.zip`: macOS-app för Intel.
- `SHA256SUMS.txt`: kontrollsummor för samtliga ZIP-filer.

## Verifierad automatik
- Rust/Web/Chromium offline och desktop-build kontrolleras av GitHub Actions.
- Releasearbetsflödet bygger Windows/macOS med samma workflow som DEV-007.
- Varje ZIP kontrolleras mot sin ursprungliga SHA256-fil och relevanta arkivposter.
- Ett konsoliderat SHA256SUMS.txt skapas och verifieras innan ett utkast kan skapas.

## Kvarstående manuella acceptanskrav
- [ ] Start från uppackad ZIP på vanlig Windows x64-användare utan administratörsbehörighet.
- [ ] Start från uppackad .app på macOS Apple Silicon utan administratörsbehörighet.
- [ ] Start från uppackad .app på macOS Intel utan administratörsbehörighet.
- [ ] Fungerande beräkningar, omstart, historik och lokala inställningar på varje plattform.
- [ ] Dokumenterade effekter av WebView2, Windows Defender/SmartScreen och organisationens applikationspolicy.
- [ ] Dokumenterat Gatekeeper/MDM-beteende; signer-/notariseringsbeslut inför publik release.

**Publicera inte utkastet som slutrelease förrän ovanstående acceptans är genomförd och eventuella blockerare är åtgärdade.**
