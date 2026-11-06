/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../src/App';

jest.mock('../src/math', () => ({
  loadEngine: async () => ({
    add: (a: number, b: number) => a + b,
    evaluate: (expression: string) => {
      if (expression === '2 + 3 * 4') return 14;
      if (expression === '1+1') return 2;
      return 3;
    },
  }),
}));

describe('standard calculator interface', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
  });

  test('renders accessible controls, evaluates expression and saves history', async () => {
    await act(async () => { root.render(<App />); });
    expect(container.querySelector('input#expression')).not.toBeNull();
    expect(container.querySelectorAll('.keypad button')).toHaveLength(21);
    const equals = container.querySelector<HTMLButtonElement>('button[aria-label="Beräkna"]');
    expect(equals?.disabled).toBe(false);
    await act(async () => { equals?.click(); });
    expect(container.querySelector('output')?.textContent).toBe('14');
    expect(container.querySelectorAll('.history-entry')).toHaveLength(1);
    expect(localStorage.getItem('rust-calculator.standard.v1')).toContain('2 + 3 * 4');
  });

  test('clears expression with the C button', async () => {
    await act(async () => { root.render(<App />); });
    const clear = container.querySelector<HTMLButtonElement>('button[aria-label="Rensa uttryck"]');
    await act(async () => { clear?.click(); });
    expect((container.querySelector('#expression') as HTMLInputElement).value).toBe('');
  });
});
