/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../src/App';

jest.mock('../src/math', () => ({
  loadEngine: async () => ({
    add: (a: number, b: number) => a + b,
    evaluateScientific: (expression: string, degrees: boolean) => {
      if (expression === 'sin(30)') return degrees ? 0.5 : -0.9880316240928618;
      if (expression === 'sin(pi/2)') return degrees ? 0.027412133592044294 : 1;
      return 3;
    },
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

  test('switches to scientific mode and evaluates in DEG and RAD', async () => {
    await act(async () => { root.render(<App />); });
    const mode = Array.from(container.querySelectorAll<HTMLButtonElement>('.mode-controls button')).find(b => b.textContent === 'Vetenskaplig');
    await act(async () => { mode?.click(); });
    expect(container.querySelectorAll('.scientific-keys button')).toHaveLength(17);
    expect(container.querySelector<HTMLButtonElement>('.angle-controls button.selected')?.textContent).toBe('DEG');

    const input = container.querySelector<HTMLInputElement>('#expression')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => {
      setter.call(input, 'sin(30)');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { container.querySelector<HTMLButtonElement>('button[aria-label="Beräkna"]')?.click(); });
    expect(container.querySelector('output')?.textContent).toBe('0.5');

    const rad = Array.from(container.querySelectorAll<HTMLButtonElement>('.angle-controls button')).find(b => b.textContent === 'RAD');
    await act(async () => { rad?.click(); });
    expect(rad?.getAttribute('aria-pressed')).toBe('true');
    await act(async () => {
      setter.call(input, 'sin(pi/2)');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { container.querySelector<HTMLButtonElement>('button[aria-label="Beräkna"]')?.click(); });
    expect(container.querySelector('output')?.textContent).toBe('1');
  });

  test('clears expression with the C button', async () => {
    await act(async () => { root.render(<App />); });
    const clear = container.querySelector<HTMLButtonElement>('button[aria-label="Rensa uttryck"]');
    await act(async () => { clear?.click(); });
    expect((container.querySelector('#expression') as HTMLInputElement).value).toBe('');
  });
});
