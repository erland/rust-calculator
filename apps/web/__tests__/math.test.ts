import { parseNumber } from '../src/math';
describe('numeric input', () => {
  test('accepts Swedish decimal comma', () => expect(parseNumber('2,5')).toBe(2.5));
  test('accepts decimal point', () => expect(parseNumber('2.5')).toBe(2.5));
  test('rejects blank values', () => expect(() => parseNumber('  ')).toThrow());
  test('rejects infinity', () => expect(() => parseNumber('Infinity')).toThrow());
});
