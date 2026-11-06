/** All arithmetic runs in the shared Rust/WebAssembly engine. */
export interface Engine {
  add(lhs: number, rhs: number): number;
  evaluate(expression: string): number;
}
export async function loadEngine(): Promise<Engine> {
  const wasm = await import('./generated/wasm/calculator_core.js');
  await wasm.default();
  return {
    add: (lhs, rhs) => wasm.add_numbers(lhs, rhs),
    evaluate: expression => wasm.evaluate_expression(expression),
  };
}
export function parseNumber(raw: string): number {
  const text = raw.trim().replace(',', '.');
  if (text.length === 0) throw new Error('Ange ett tal i båda fälten.');
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error('Ange giltiga, ändliga tal.');
  return number;
}
