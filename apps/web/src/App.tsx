import { useEffect, useState } from 'react';
import { loadEngine, type Engine } from './math';

export default function App() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState('');
  const [expression, setExpression] = useState('2 + 3 * 4');
  const [result, setResult] = useState<string>('');
  useEffect(() => {
    let active = true;
    loadEngine().then(e => { if (active) setEngine(e); })
      .catch(() => { if (active) setError('Kunde inte läsa in beräkningsmotorn.'); });
    return () => { active = false; };
  }, []);
  function calculate(event: React.FormEvent) {
    event.preventDefault();
    if (!engine) return;
    try {
      const value = engine.evaluate(expression);
      setResult(String(value));
      setError('');
    } catch (cause) {
      setResult('');
      setError(cause instanceof Error && cause.message ? cause.message : 'Ogiltigt uttryck.');
    }
  }
  return <main className="shell">
    <header><p className="eyebrow">KALKYLATOR · DEV-002</p><h1>Enkel att börja med.<br/><span>Byggd för mer.</span></h1><p className="subtitle">Samma beräkningsmotor i webbläsaren, Windows och macOS.</p></header>
    <section className="calculator" aria-label="Kalkylator">
      <div className="topline"><strong>Standard</strong><span className="status">{engine ? '● Redo' : '◌ Läser in Rust/Wasm…'}</span></div>
      <form onSubmit={calculate}>
        <label htmlFor="expression">Matematiskt uttryck</label>
        <input id="expression" value={expression} onChange={e => setExpression(e.target.value)} autoComplete="off" spellCheck={false} aria-describedby="expression-help" />
        <p id="expression-help">Använd +, −, *, /, parenteser samt komma eller punkt som decimaltecken.</p>
        <button type="submit" disabled={!engine}>Beräkna <span aria-hidden="true">→</span></button>
      </form>
      <div className="answer" aria-live="polite"><small>Resultat</small><output>{result || '—'}</output></div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    <p className="footnote">Vetenskapliga funktioner, minne och knappsats kommer i kommande utvecklingssteg.</p>
  </main>;
}
