# Kalkylator — DEV-002 expression parser

One repository for a PWA, portable Windows executable and macOS `.app`. The last two are **distribution goals**, not verified portable applications yet. DEV-001 CI passed on GitHub Actions run #5; offline browser tests and portable distribution remain later acceptance tasks. DEV-002 is under CI verification in PR #2.

## Current functionality
- Rust `calculator-core` evaluates bounded arithmetic expressions with +, -, *, /, parentheses, unary signs, operator precedence and decimals (comma or point). It rejects division by zero, invalid expressions and non-finite results.
- `wasm-pack` exports the Rust expression evaluator to browser JS; no duplicate JavaScript arithmetic implementation.
- React calculator accepts a whole expression (e.g. `2 + 3 * 4`) and displays its result or an error.
- Vite PWA plugin generates manifest and precache service worker on build. Offline/browser behavior is not yet tested.
- Tauri 2 desktop scaffold and GitHub Actions CI for Rust, PWA, and Windows/macOS smoke builds.

## Prerequisites
- Node 22, npm
- Rust stable including Cargo and `wasm32-unknown-unknown` target
- `wasm-pack` installed
- Tauri 2 prerequisites for OS-specific compilation; on Linux, only web builds and Rust core tests are needed

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack --locked
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cd apps/web
npm install
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:5173`. The dev server requires `npm run build:wasm` after a clean checkout before `npm run dev` (or run `npm run build`, which does this).

### Desktop on Windows or macOS

```sh
cd apps/web
npm install
npm run build:wasm
npm run tauri dev
npm run tauri build -- --no-bundle
```

On macOS, an `.app` bundle can later be produced with `npm run tauri bundle -- --bundles app`. Native packaging, code signing, notarization, locked-down execution and installer-free operation belong to DEV-007/008.

## Layout
- `crates/calculator-core` Rust calculation + Wasm export
- `apps/web` React/Vite UI and offline/PWA config
- `apps/web/src-tauri` native desktop host and permissions
- `.github/workflows/ci.yml` PR/main validation plus manual CI trigger (not a release workflow yet)
- `docs/` requirements, architecture, plan, verification

## Development status
DEV-002 implements the expression parser and operator precedence. DEV-003 adds the standard calculator keypad and memory. Scientific functions arrive in DEV-004/005. Release automation arrives in DEV-008.

The node and cargo lockfiles are not included yet because this execution environment could not resolve packages; the next validation pass should generate and commit both lockfiles, then change CI from `npm install` to `npm ci` and `cargo ... --locked`. This is an explicit reproducibility gap, not a completed check.
