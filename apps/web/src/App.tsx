import { useEffect, useState } from 'react';
import { loadEngine, type Engine } from './math';
import {
  addHistory, appendKey, appendScientificKey, eraseKey, readSavedCalculator, saveCalculator,
  type HistoryEntry,
} from './calculator-state';

const SCIENTIFIC_KEYS = [
  { label: 'sin', token: 'sin(', description: 'Sinus' },
  { label: 'cos', token: 'cos(', description: 'Cosinus' },
  { label: 'tan', token: 'tan(', description: 'Tangens' },
  { label: 'asin', token: 'asin(', description: 'Arcsinus' },
  { label: 'acos', token: 'acos(', description: 'Arccosinus' },
  { label: 'atan', token: 'atan(', description: 'Arctangens' },
  { label: 'xʸ', token: '^', description: 'Upphöjt till' },
  { label: '√', token: 'sqrt(', description: 'Kvadratrot' },
  { label: 'ⁿ√', token: 'root(', description: 'N-te rot, argument separeras med semikolon' },
  { label: 'log', token: 'log(', description: 'Tiologaritm' },
  { label: 'ln', token: 'ln(', description: 'Naturlig logaritm' },
  { label: 'exp', token: 'exp(', description: 'Exponentialfunktion' },
  { label: 'π', token: 'pi', description: 'Pi' },
  { label: 'e', token: 'e', description: 'Eulers tal' },
  { label: 'x!', token: '!', description: 'Fakultet' },
  { label: 'abs', token: 'abs(', description: 'Absolutbelopp' },
  { label: ';', token: ';', description: 'Argumentseparator' },
] as const;

const KEYS = [
  'C', '⌫', '(', ')',
  '7', '8', '9', '/',
  '4', '5', '6', '*',
  '1', '2', '3', '-',
  '0', ',', '.', '+',
] as const;

function initialSaved() {
  if (typeof localStorage === 'undefined') return { memory: null, history: [] as HistoryEntry[] };
  return readSavedCalculator(localStorage);
}

export default function App() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState('');
  const [expression, setExpression] = useState('2 + 3 * 4');
  const [result, setResult] = useState('');
  const [scientific, setScientific] = useState(false);
  const [degrees, setDegrees] = useState(true);
  const [saved, setSaved] = useState(initialSaved);
  const { memory, history } = saved;

  useEffect(() => {
    let active = true;
    loadEngine().then(value => { if (active) setEngine(value); })
      .catch(() => { if (active) setError('Kunde inte läsa in beräkningsmotorn.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') saveCalculator(localStorage, saved);
  }, [saved]);

  function calculate(value = expression) {
    if (!engine) return;
    try {
      const computed = String(scientific ? engine.evaluateScientific(value, degrees) : engine.evaluate(value));
      setResult(computed);
      setExpression(value);
      setSaved(previous => ({
        ...previous, history: addHistory(previous.history, value, computed),
      }));
      setError('');
    } catch (cause) {
      setResult('');
      setError(cause instanceof Error && cause.message ? cause.message : 'Ogiltigt uttryck.');
    }
  }

  function pressKey(key: string) {
    if (key === '=') { calculate(); return; }
    setError('');
    setResult('');
    if (key === 'C') { setExpression(''); return; }
    if (key === '⌫') { setExpression(previous => eraseKey(previous)); return; }
    setExpression(previous => appendKey(previous, key));
  }

  function insertScientific(token: string) {
    setExpression(previous => appendScientificKey(previous, token));
    setResult('');
    setError('');
  }

  function useMemory(action: 'MC' | 'MR' | 'MS' | 'M+' | 'M−') {
    if (action === 'MC') {
      setSaved(previous => ({ ...previous, memory: null }));
      setError('');
      return;
    }
    if (action === 'MR') {
      if (memory !== null) {
        setExpression(memory.startsWith('-') ? `(${memory})` : memory);
        setResult('');
        setError('');
      }
      return;
    }
    if (!engine) return;
    try {
      const value = String(scientific ? engine.evaluateScientific(result || expression, degrees) : engine.evaluate(result || expression));
      if (action === 'MS') {
        setSaved(previous => ({ ...previous, memory: value }));
      } else {
        const base = memory ?? '0';
        const operator = action === 'M+' ? '+' : '-';
        const next = String(scientific ? engine.evaluateScientific(`(${base})${operator}(${value})`, degrees) : engine.evaluate(`(${base})${operator}(${value})`));
        setSaved(previous => ({ ...previous, memory: next }));
      }
      setError('');
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : 'Minnesoperationen misslyckades.');
    }
  }

  return <main className="shell">
    <header>
      <p className="eyebrow">KALKYLATOR · {scientific ? 'VETENSKAPLIG' : 'STANDARD'}</p>
      <h1>Räkna enkelt.<br/><span>Fortsätt smart.</span></h1>
      <p className="subtitle">Samma Rust-baserade beräkningar i PWA, Windows och macOS.</p>
    </header>
    <section className="calculator" aria-label="Kalkylator">
      <div className="topline">
        <strong>{scientific ? 'Vetenskaplig' : 'Standard'}</strong>
        <span className="status" role="status">{engine ? '● Redo' : '◌ Läser in Rust/Wasm…'}</span>
      </div>
      <div className="mode-controls" role="group" aria-label="Kalkylatorläge">
        <button type="button" className={!scientific ? 'mode-button selected' : 'mode-button'} aria-pressed={!scientific}
          onClick={() => { setScientific(false); setResult(''); setError(''); }}>Standard</button>
        <button type="button" className={scientific ? 'mode-button selected' : 'mode-button'} aria-pressed={scientific}
          onClick={() => { setScientific(true); setResult(''); setError(''); }}>Vetenskaplig</button>
      </div>
      {scientific && <div className="angle-controls" role="group" aria-label="Vinkelenhet">
        <button type="button" className={degrees ? 'mode-button selected' : 'mode-button'} aria-pressed={degrees}
          onClick={() => { setDegrees(true); setResult(''); setError(''); }}>DEG</button>
        <button type="button" className={!degrees ? 'mode-button selected' : 'mode-button'} aria-pressed={!degrees}
          onClick={() => { setDegrees(false); setResult(''); setError(''); }}>RAD</button>
      </div>}
      <form onSubmit={event => { event.preventDefault(); calculate(); }}>
        <label htmlFor="expression">Uttryck</label>
        <input id="expression" value={expression} onChange={event => { setExpression(event.target.value.slice(0, 4096)); setResult(''); setError(''); }}
          onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); pressKey('C'); } }}
          autoComplete="off" spellCheck={false} aria-describedby="expression-help" />
        <p id="expression-help" className="hint">Skriv med tangentbordet eller använd knappsatsen. Enter beräknar, Esc rensar.</p>
        <div className="memory-row" role="group" aria-label="Minnesfunktioner">
          {(['MC', 'MR', 'MS', 'M+', 'M−'] as const).map(action =>
            <button className="memory-key" key={action} type="button" onClick={() => useMemory(action)}
              disabled={!engine || ((action === 'MR' || action === 'MC') && memory === null)} aria-label={action === 'MC' ? 'Rensa minne' : action === 'MR' ? 'Hämta minne' : action === 'MS' ? 'Spara till minne' : action === 'M+' ? 'Addera till minne' : 'Subtrahera från minne'}>{action}</button>
          )}
        </div>
        {scientific && <div className="scientific-keys" role="group" aria-label="Vetenskapliga funktioner">
          {SCIENTIFIC_KEYS.map(key => <button type="button" className="scientific-key" key={key.label}
            aria-label={key.description} title={key.description} onClick={() => insertScientific(key.token)}>{key.label}</button>)}
        </div>}
        <div className="keypad" role="group" aria-label="Kalkylatorknappar">
          {KEYS.map(key => <button key={key} type="button" className={`key ${'+-*/'.includes(key) ? 'key-operator' : ''} ${key === 'C' || key === '⌫' ? 'key-action' : ''}`}
            aria-label={key === 'C' ? 'Rensa uttryck' : key === '⌫' ? 'Ta bort sista tecknet' : key}
            onClick={() => pressKey(key)}>{key}</button>)}
          <button className="key key-equals" type="submit" disabled={!engine} aria-label="Beräkna">=</button>
        </div>
      </form>
      <div className="answer" aria-live="polite"><small>Resultat</small><output>{result || '—'}</output></div>
      {memory !== null && <p className="memory-indicator" aria-live="polite">M: {memory}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    <section className="history" aria-label="Historik">
      <div className="history-heading"><h2>Historik</h2><button className="text-button" type="button" disabled={history.length === 0}
        onClick={() => setSaved(previous => ({ ...previous, history: [] }))}>Rensa historik</button></div>
      {history.length === 0 ? <p className="empty-history">Dina senaste beräkningar visas här.</p> :
        <ol>{history.map((item, index) => <li key={index}>
          <button type="button" className="history-entry" onClick={() => { setExpression(item.expression); setResult(item.result); setError(''); }}
            aria-label={`Återanvänd ${item.expression} lika med ${item.result}`}>
            <span>{item.expression}</span><strong>= {item.result}</strong>
          </button>
        </li>)}</ol>}
    </section>
    <p className="footnote">Historik och minne sparas lokalt på den här enheten. Vetenskapliga uttryck använder samma Rust-motor som standardläget.</p>
  </main>;
}
