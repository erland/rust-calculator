/** Single shared mathematical implementation: WebAssembly from calculator-core. */
export interface Engine { add(lhs: number, rhs: number): number }
export async function loadEngine(): Promise<Engine> {
  const wasm = await import('./generated/wasm/calculator_core.js');
  await wasm.default();
  return { add: (lhs, rhs) => wasm.add_numbers(lhs, rhs) };
}
export function parseNumber(raw: string): number {
  const text = raw.trim().replace(',', '.');
  if (text.length === 0) throw new Error('Ange ett tal i båda fälten.');
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error('Ange giltiga, ändliga tal.');
  return number;
}
