import { useEffect, useState } from 'react';
import { loadEngine, parseNumber, type Engine } from './math';

export default function App() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState('');
  const [lhs, setLhs] = useState('2');
  const [rhs, setRhs] = useState('2');
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
      const value = engine.add(parseNumber(lhs), parseNumber(rhs));
      setResult(String(value)); setError('');
    } catch (cause) {
      setResult(''); setError(cause instanceof Error ? cause.message : 'Beräkningen misslyckades.');
    }
  }
  return <main className="shell">
    <header><p className="eyebrow">KALKYLATOR · DEV-001</p><h1>Enkel att börja med.<br/><span>Byggd för mer.</span></h1><p className="subtitle">Samma beräkningsmotor i webbläsaren, Windows och macOS.</p></header>
    <section className="calculator" aria-label="Kalkylator">
      <div className="topline"><strong>Standard</strong><span className="status">{engine ? '● Redo' : '◌ Läser in Rust/Wasm…'}</span></div>
      <form onSubmit={calculate}>
        <label htmlFor="first">Första talet</label><input id="first" inputMode="decimal" value={lhs} onChange={e => setLhs(e.target.value)} />
        <div className="operator" aria-hidden="true">+</div>
        <label htmlFor="second">Andra talet</label><input id="second" inputMode="decimal" value={rhs} onChange={e => setRhs(e.target.value)} />
        <button type="submit" disabled={!engine}>Beräkna <span aria-hidden="true">→</span></button>
      </form>
      <div className="answer" aria-live="polite"><small>Resultat</small><output>{result || '—'}</output></div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    <p className="footnote">Detta är första utvecklingssteget. Uttryck, parenteser, minne och vetenskapliga funktioner följer i senare steg.</p>
  </main>;
}
