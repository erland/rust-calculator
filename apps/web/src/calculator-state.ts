export type HistoryEntry = { expression: string; result: string };
export type SavedCalculator = { memory: string | null; history: HistoryEntry[] };
export const STORAGE_KEY = 'rust-calculator.standard.v1';
export const HISTORY_LIMIT = 30;
const MAX_EXPRESSION_LENGTH = 4096;

export function appendKey(expression: string, key: string): string {
  if (!/^(?:[0-9]|[+*/().,\-])$/.test(key)) return expression;
  return (expression + key).slice(0, MAX_EXPRESSION_LENGTH);
}

export function eraseKey(expression: string): string {
  return Array.from(expression).slice(0, -1).join('');
}

export function addHistory(entries: HistoryEntry[], expression: string, result: string): HistoryEntry[] {
  return [{ expression, result }, ...entries].slice(0, HISTORY_LIMIT);
}

export function readSavedCalculator(storage: Pick<Storage, 'getItem'>): SavedCalculator {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { memory: null, history: [] };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error('Invalid saved data');
    const record = value as Record<string, unknown>;
    const memory = typeof record.memory === 'string' && /^-?(?:\d+(?:\.\d+)?|\d+e[+-]?\d+)$/i.test(record.memory) ? record.memory : null;
    const history = Array.isArray(record.history) ? record.history.filter((entry): entry is HistoryEntry =>
      entry !== null && typeof entry === 'object' &&
      typeof entry.expression === 'string' && entry.expression.length <= MAX_EXPRESSION_LENGTH &&
      typeof entry.result === 'string' && entry.result.length <= 100
    ).slice(0, HISTORY_LIMIT) : [];
    return { memory, history };
  } catch {
    return { memory: null, history: [] };
  }
}

export function saveCalculator(storage: Pick<Storage, 'setItem'>, state: SavedCalculator): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
