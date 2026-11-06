# Funktionsspecifikation v0.1 — Kalkylator

## 1. Syfte
En lättanvänd, offlinekapabel kalkylator som fungerar med samma beräkningslogik via PWA och portabla Windows-/macOS-program.

## 2. Användare och lägen
- Standard: vanliga räknesätt och minne.
- Vetenskaplig: avancerade operationer för studier, teknik och vardaglig analys.
- Layout anpassas till fönsterstorlek och mindre skärmar; inga separata mobila native-distributioner ingår i första release.

## 3. Standardfunktioner
- Addition, subtraktion, multiplikation, division.
- Decimaltal, negativa tal, parenteser, upprepade beräkningar, rensa post och rensa allt.
- Procent definieras explicit utifrån dokumenterade räkneregler (kontextuell % i GUI kräver egna tester).
- Minne: MC, MR, M+, M− och MS.
- Historik över uttryck och resultat; återanvändning av värde.
- Mus, pekskärm och tangentbord; stöd för komma och punkt som decimaltecken i svensk miljö (intern normalisering).

## 4. Vetenskapliga funktioner
- Potenser (x^y), kvadrat, kvadratrot, n:te rot, invers och absolutbelopp.
- sin/cos/tan och inverser; tydligt läge DEG/RAD.
- log10, ln, exp, 10^x, e^x.
- π och e, fakultet för tillåtna heltal, eventuellt modulo.
- Operatorprioritet, parenteser, unära operatorer och funktionsanrop i uttryck.
- Visat resultat med kontrollerad avrundning och val för vetenskaplig notation.

## 5. Korrekthet och fel
- Samma resultat för samma uttryck på alla tre distributionssätt.
- Ingen `eval` av JavaScript eller annan godtycklig kod; parser och evaluator är begränsade till matematiska uttryck.
- Division med noll, syntaxfel, ogiltiga domäner (t.ex. sqrt(-1) i reellt läge), overflow och icke-ändliga tal ger användbara felmeddelanden utan krascher.
- Numerisk bas i första release: f64 med tydligt dokumenterade flyttalsbegränsningar; ingen garanti om exakta finansiella decimaler.
- Max uttryckslängd och beräkningsbudget begränsar resursförbrukning; fakultet begränsas uttryckligen.

## 6. Lagring och offline
- Inställningar, historik och minnesvärden lagras lokalt på enheten i webblagret; ingen server eller konto krävs.
- PWA fungerar offline efter första lyckade nedladdningen av appresurser och wasm-filen.
- Möjlighet att rensa historik och lokala data.

## 7. Distribution
- PWA: statiskt hostad HTTPS-app med manifest, ikon, service worker, versionshanterad cache.
- Windows: portabel ZIP med körbar fil samt eventuella nödvändiga resurser; ingen MSI/NSIS-installation.
- macOS: ZIP innehållande `.app`, byggd för Apple Silicon och Intel (separata eller universal).
- Saknade runtime-beroenden samt OS-säkerhetsregler måste testas på rena/låsta datorer.
- GitHub Actions bygger och verifierar artefakter, publicerar utkast till GitHub Release och kan publicera PWA till GitHub Pages.

## 8. Tillgänglighet
- Tangentbordsnavigering och tydlig fokusmarkering.
- Tillgängliga namn på knappar och läsbara fel/statusmeddelanden.
- Tillräckliga kontraster, skalbar text och reducerad rörelse där relevant.

## 9. Exempel på acceptanstester
| Test | Förväntat |
| --- | --- |
| `2+3*4` | `14` |
| `(2+3)*4` | `20` |
| `-3^2` | `-9` enligt dokumenterad precedens |
| `sin(30)` i DEG | `0.5` inom angiven tolerans |
| `sin(pi/2)` i RAD | `1` inom angiven tolerans |
| `sqrt(-1)` | Kontrollerat domänfel |
| `1/0` | Kontrollerat fel, ej `Infinity` |
| `log(100)` | `2` |
| `5!` | `120` |
| Starta PWA offline | App och beräkningskärna tillgängliga |
| Starta portabel app som standardanvändare | Ingen installationsguide eller adminprompt, om OS-policy tillåter |

## 10. Utanför initial omfattning
Symbolisk algebra, CAS, grafer, komplexa tal, programmerbar kalkylator, valutaomräkning med onlinekurser, synkronisering mellan enheter och native iOS/Android-appar.
