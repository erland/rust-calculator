/** Device-local UI preferences, independent of the persisted calculation history. */
export const SETTINGS_KEY = 'rust-calculator.settings.v1';

export type Preferences = { scientific: boolean; degrees: boolean };
export const DEFAULT_PREFERENCES: Preferences = { scientific: false, degrees: true };

export function readPreferences(storage: Pick<Storage, 'getItem'>): Preferences {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES };
    const record = parsed as Record<string, unknown>;
    return {
      scientific: typeof record.scientific === 'boolean' ? record.scientific : false,
      degrees: typeof record.degrees === 'boolean' ? record.degrees : true,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(storage: Pick<Storage, 'setItem'>, prefs: Preferences): boolean {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export function clearAppStorage(storage: Pick<Storage, 'removeItem'>): boolean {
  try {
    storage.removeItem(SETTINGS_KEY);
    storage.removeItem('rust-calculator.standard.v1');
    return true;
  } catch {
    return false;
  }
}
