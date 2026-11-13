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

**Förutsättningar:** macOS inkluderar WebKit. DEV-007-testpaketen använder nu **ad hoc-kodsignering** (`signingIdentity: "-"`), som gör att även ARM64-koden har en kontrollerbar lokal signatur. **Det är inte en betrodd Developer ID-signatur, och paketet är inte notariserat av Apple.** Gatekeeper eller MDM kan därför fortfarande stoppa appen. Be inte användare att generellt stänga av Gatekeeper eller arbetsplatsens säkerhetskontroller. Intel x64-versionen kan behöva Rosetta på Apple Silicon.

### Diagnos vid "damaged" eller "Apple could not verify"
Testa först med en **ny nedladdning** och rätt ZIP för din processor. Kontrollera SHA-256 mot medföljande kontrollsumma, och packa upp med Finder/Archive Utility, utan att ändra innehållet i `.app`.

Kör följande i Terminal på Mac, och ersätt sökvägen med den faktiska platsen där du packade upp appen:

```sh
APP="$HOME/Downloads/Kalkylator.app"
file "$APP/Contents/MacOS/"*
codesign --verify --deep --strict --verbose=2 "$APP"
codesign --display --verbose=2 "$APP"
spctl --assess --type execute --verbose=4 "$APP"
xattr -l "$APP"
```

- Misslyckad `codesign --verify` indikerar ogiltig signatur eller skadat/förändrat appinnehåll. Då ska paketet **inte** köras; rapportera felet och kontrollera ZIP-integriteten.
- Lyckad `codesign --verify` men nekad `spctl` kan vara väntat för en ad hoc-signerad, icke-notariserad testapp. Det betyder inte i sig att appen är skadad.
- Om en **verifierad och förväntad** testapp endast blockeras av Gatekeeper kan du prova macOS **Systeminställningar → Integritet och säkerhet → Öppna ändå**, när knappen finns tillgänglig. Ändra inte systemets globala Gatekeeper-inställningar och kör inte kommandon som tar bort karantän från okända appar.
- Om macOS uttryckligen rapporterar skadlig kod eller ändrat appinnehåll, avbryt testet. Lita inte enbart på att det är en egenbyggd app.

För normal distribution utan dessa varningar behövs **Developer ID Application-signering och notarisering** hos Apple. Ad hoc-signering är endast till för kontrollerade utvecklings- och acceptanstester.

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
