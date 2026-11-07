import {
  clearAppStorage, DEFAULT_PREFERENCES, readPreferences, savePreferences, SETTINGS_KEY,
} from '../src/pwa-settings';

describe('persistent offline preferences', () => {
  test('returns defaults when storage is absent, invalid or blocked', () => {
    expect(readPreferences({ getItem: () => null })).toEqual(DEFAULT_PREFERENCES);
    expect(readPreferences({ getItem: () => '{invalid' })).toEqual(DEFAULT_PREFERENCES);
    expect(readPreferences({ getItem: () => { throw Error('blocked'); } })).toEqual(DEFAULT_PREFERENCES);
  });
  test('restores only valid boolean settings', () => {
    const data = { scientific: true, degrees: false };
    expect(readPreferences({ getItem: () => JSON.stringify(data) })).toEqual(data);
    expect(readPreferences({ getItem: () => JSON.stringify({ scientific: 'wrong', degrees: null }) })).toEqual(DEFAULT_PREFERENCES);
  });
  test('saves values using app-scoped key', () => {
    let key = '';
    let value = '';
    expect(savePreferences({ setItem: (k, v) => { key = k; value = v; } }, { scientific: true, degrees: false })).toBe(true);
    expect(key).toBe(SETTINGS_KEY);
    expect(JSON.parse(value)).toEqual({ scientific: true, degrees: false });
    expect(savePreferences({ setItem: () => { throw Error('quota'); } }, DEFAULT_PREFERENCES)).toBe(false);
  });
  test('deletes only the app-owned keys', () => {
    const removed: string[] = [];
    expect(clearAppStorage({ removeItem: k => { removed.push(k); } })).toBe(true);
    expect(removed).toEqual([SETTINGS_KEY, 'rust-calculator.standard.v1']);
    expect(clearAppStorage({ removeItem: () => { throw Error('denied'); } })).toBe(false);
  });
});
