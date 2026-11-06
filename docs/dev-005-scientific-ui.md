# DEV-005 – Vetenskapligt gränssnitt

Kalkylatorn har ett standardläge och ett vetenskapligt läge. Samtliga beräkningar, inklusive trigonometriska funktioner, sker i Rust/Wasm-kärnan.

## Användning
- Välj **Vetenskaplig** för att visa funktionsknapparna, välj **Standard** för den kompakta knappsatsen.
- I vetenskapligt läge: välj **DEG** (grader, förvalt) eller **RAD** (radianer). Valet gäller kommande beräkningar och minnesoperationer i det vetenskapliga läget.
- Funktioner som `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `log`, `ln`, `exp`, `abs` och `root` infogar funktionsnamn samt öppningsparentes. Ange argumentet och avsluta med `)`.
- `xʸ` infogar `^`, `x!` infogar `!`, `π` infogar `pi`, `e` infogar `e`.
- N:te rot: `root(27;3)`, där semikolon skiljer värde och rotindex för att inte förväxlas med svenskt decimaltecken.
- Inmatning med tangentbord är fortsatt tillgänglig. Enter beräknar och Esc rensar.
- Historik och minne fungerar i båda lägena.

## Avgränsningar
- DEG/RAD och vetenskapligt läge sparas inte mellan omstarter i DEV-005. Minne och historik sparas lokalt enligt DEV-003.
- Visade tal är IEEE-754 `f64`; de är inte exakta finansiella decimaler.
- PWA offline, plattformsdistribution och browser-E2E verifieras enligt efterföljande DEV-steg.

## Testning
- Jest testar funktionsinmatning, gränssnitt, DEG/RAD-växling och befintliga standardfunktioner.
- CI kontrollerar Rust, PWA-bygge och Tauri-byggen för Windows och macOS.
