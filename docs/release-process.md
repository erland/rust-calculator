# DEV-008 – Releaserutin

## Vad som produceras
GitHub Actions-workflow `Release candidate (DEV-008)` bygger och verifierar fyra ZIP-arkiv samt en konsoliderad `SHA256SUMS.txt`.

## Säkra kontroller innan publicering
Pull requests som ändrar releasekedjan eller appkoden kör en releasekandidat som CI-test, men **skapar inte någon GitHub Release**. Jobbet `assemble` går igenom varje ZIP-fil, innehåll, kontrollsumma och bl.a. Wasm-resurs i PWA.

## Skapa ett releaseutkast
Efter godkänd PR och merge: gå till **GitHub Actions → Release candidate (DEV-008) → Run workflow**, välj `main`, ange exempelvis `v0.1.0-rc1`. Arbetsflödet bygger om alla paket från samma commit och skapar därefter endast ett **Draft Release**. Första körningen sker inte automatiskt vid merge eller taggning.

Den manuella inmatningen tillåter endast RC-taggar `v<major>.<minor>.<patch>-rc<N>`. Redan existerande Release-taggar får inte skrivas över. GitHub-token har skrivrättigheter till innehåll endast i releasejobbet; alla andra jobb har läsrättigheter.

Efter körning: hämta `kalkylator-release-assets` från GitHub Actions, kontrollera `sha256sum -c SHA256SUMS.txt` och att de fyra arkiven kan packas upp. Testa också faktiskt körning på alla målplattformar.

## Viktiga begränsningar
- Ett Draft Release är inte ett godkännande att publicera. **Publicering kräver användaracceptans** enligt `docs/release-notes.md` och `docs/portable-desktop.md`.
- Appen saknar fortfarande produktionstillförlitlig kodsignering/notarisering. Dessa risker kan inte lösas av ZIP-paketering.
- Rust och npm-beroenden saknar ännu committade lockfiler. Reproducerbarhet över tid måste åtgärdas före en stabil slutrelease.
- PWA-ZIP kan hostas på HTTPS-statiskt webbhotell. Detta workflow gör **ingen automatisk Pages-driftsättning** och ingen publik release.
