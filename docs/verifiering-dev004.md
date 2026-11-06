# DEV-004 – Vetenskaplig beräkningskärna

Rust-modulen `scientific.rs` är ensam källa för matematiska beräkningar och används i både native och WebAssembly.

## Syntax
- Aritmetik: `+`, `-`, `*`, `/`, parenteser och decimalkomma/-punkt.
- Exponenter: `2^3^2 = 512` (högerassociativt), `-3^2 = -9`.
- Postfix fakultet: `5! = 120` för heltal mellan 0 och 170.
- Funktioner: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `abs`, `log` (bas 10), `ln`, `exp`.
- Konstanter: `pi`, `e`.
- N:te rot: `root(27;3) = 3`, semikolon separerar argument så decimalkomma fungerar.
- `evaluate(input)` använder radianer; `evaluate_with_mode(input, AngleMode::Degrees)` väljer grader.
- WebAssembly exporterar `evaluate_scientific(expression, degrees)`.

## Fel och begränsningar
- Felaktig syntax, division med noll, okända funktioner och felaktigt antal argument avvisas.
- Rot ur negativt tal är bara giltig för udda heltalsindex; `sqrt(-1)`, `ln(0)`, `log(-1)` ger domänfel.
- Negativa baser med icke-heltalsexponenter avvisas.
- Maximal längd: 4096 byte; maximal nästling: 64; högst 4096 beräkningsoperationer.
- Numerisk precision är IEEE-754 f64. Mycket stora eller oändliga resultat avvisas.

Det befintliga standardgränssnittet ändras inte till vetenskapligt läge i detta steg; den UI-funktionen ingår i DEV-005.
