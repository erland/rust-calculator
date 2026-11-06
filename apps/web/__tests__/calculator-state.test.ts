import {
  addHistory, appendKey, appendScientificKey, eraseKey, readSavedCalculator, saveCalculator, STORAGE_KEY,
} from '../src/calculator-state';

describe('calculator keyboard', () => {
  test('appends supported keys', () => expect(appendKey('2+', '3')).toBe('2+3'));
  test('ignores unsupported keys', () => expect(appendKey('2', 'x')).toBe('2'));
  test('removes last character', () => expect(eraseKey('12+')).toBe('12'));
  test('limits expression size', () => expect(appendKey('1'.repeat(4096), '2')).toHaveLength(4096));
});

describe('local history and memory', () => {
  test('adds most recent entry first and caps history', () => {
    const old = Array.from({ length: 35 }, (_, index) => ({ expression: String(index), result: String(index) }));
    const entries = addHistory(old, '2+2', '4');
    expect(entries).toHaveLength(30);
    expect(entries[0]).toEqual({ expression: '2+2', result: '4' });
  });
  test('restores valid saved data', () => {
    const storage = { getItem: () => JSON.stringify({ memory: '-2.5', history: [{ expression: '1+1', result: '2' }] }) };
    expect(readSavedCalculator(storage)).toEqual({ memory: '-2.5', history: [{ expression: '1+1', result: '2' }] });
  });
  test('rejects corrupt data and storage errors', () => {
    expect(readSavedCalculator({ getItem: () => '{oops' })).toEqual({ memory: null, history: [] });
    expect(readSavedCalculator({ getItem: () => { throw Error('denied'); } })).toEqual({ memory: null, history: [] });
    expect(saveCalculator({ setItem: () => { throw Error('quota'); } }, { memory: null, history: [] })).toBe(false);
  });
  test('saves the expected storage key', () => {
    let savedKey = '';
    let savedValue = '';
    const ok = saveCalculator({ setItem: (key, value) => { savedKey = key; savedValue = value; } }, { memory: '7', history: [] });
    expect(ok).toBe(true);
    expect(savedKey).toBe(STORAGE_KEY);
    expect(JSON.parse(savedValue).memory).toBe('7');
  });
});

describe('scientific keypad insertion', () => {
  test('inserts allowlisted function tokens', () => {
    expect(appendScientificKey('', 'sin(')).toBe('sin(');
    expect(appendScientificKey('root(27', ';')).toBe('root(27;');
    expect(appendScientificKey('2', '^')).toBe('2^');
  });
  test('does not inject invalid input or exceed the expression bound', () => {
    expect(appendScientificKey('2', 'eval(')).toBe('2');
    expect(appendScientificKey('1'.repeat(4095), 'sqrt(')).toHaveLength(4095);
  });
});
