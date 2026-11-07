# Portabel Kalkylator – Windows och macOS (DEV-007)

Dessa ZIP-paket innehåller en traditionell desktopapplikation som kan packas upp utan MSI/PKG-installationsprogram. **Portabel** betyder här inte att alla datorer tillåter start: arbetsgivarens policy, OS-säkerhet och webbview-runtime kan fortfarande stoppa programmet.

## Windows 64-bit
1. Hämta artefakten `kalkylator-windows-x64-portable` från GitHub Actions och packa upp dess yttre artefakt.
2. Kontrollera SHA-256 för `kalkylator-windows-x64-portable.zip` mot `SHA256SUMS.txt`.
3. Packa upp ZIP-filen till en vanlig användarmapp, till exempel `Downloads/Kalkylator`.
4. Kör `Kalkylator.exe`. Ingen MSI eller adminbehörig installation av Kalkylator ska behövas.

**Förutsättningar:** Microsoft Edge WebView2 måste vara tillgänglig på datorn. Den finns ofta förinstallerad på moderna Windows, men frånvaro eller organisationspolicy kan förhindra start. Windows SmartScreen, AppLocker, WDAC eller andra endpoint-skydd kan blockera en osignerad binär. Administrativa rättigheter krävs inte för programmets egna filer, men kan krävas för att installera saknade systemkomponenter.

## macOS – Apple Silicon och Intel
1. Välj artefakt `kalkylator-macos-arm64-portable` för Apple Silicon eller `kalkylator-macos-x64-portable` för Intel.
2. Kontrollera SHA-256 mot medföljande `SHA256SUMS.txt`.
3. Packa upp ZIP-filen med Finder/Archive Utility och flytta `Kalkylator.app` till en mapp som användaren äger. `/Applications` är valfritt.
4. Öppna `Kalkylator.app` med Finder.

**Förutsättningar:** macOS inkluderar WebKit. Programmet är ännu inte signerat eller notariserat för normal distribution. Gatekeeper eller MDM kan därför blockera programmet eller kräva särskilt godkännande. Be inte användare att generellt stänga av Gatekeeper eller arbetsplatsens säkerhetskontroller.

## Vad CI kontrollerar
- Den inbyggda Rust/Tauri-applikationen kompileras i faktiska Windows- och macOS-runners.
- Windows-ZIP innehåller en körbar EXE och instruktioner.
- macOS-ZIP innehåller en `.app` med `Info.plist` och en körbar binär, med rätt CPU-arkitektur (ARM64 respektive Intel x64).
- ZIP-filer kontrolleras och SHA-256 genereras för varje arkiv.

## Kvarstående acceptans innan release
GitHub-hostade byggmaskiner garanterar inte verifiering på låsta slutanvändardatorer. Följande behöver **verklig körningsverifiering** av en vanlig användare utan adminbehörighet på varje målplattform:

- Windows x64: kör uppackad EXE, utför beräkningar och testa med WebView2/SmartScreen/WDAC-policy.
- macOS ARM64 och Intel: kör uppackad app, kontrollera Gatekeeper-beteende och utför beräkningar.
- Starta om respektive app och kontrollera att historik och minne finns kvar.
- Undersök om företagspolicy kräver signering/notarisering; det kan inte kringgås av en ZIP.
- Verifiera eventuella ospecifika runtime- eller tillgänglighetskrav.

**DEV-007 är alltså inte helt godkänt enbart av ett grönt bygge:** praktisk slutanvändarstart på riktiga, låsta datorer måste dokumenteras eller explicit skjutas upp som release-blockerare. DEV-008 hanterar releasepaketering och eventuell signering.
