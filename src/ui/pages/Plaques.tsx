import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import data from '../../data/plaques.json';

export type Plaque = {
  id: string;
  title: string;
  municipality: string;
  latitude: number;
  longitude: number;
  summary: string;
  year?: number;
};

export function Plaques() {
  const [query, setQuery] = useState('');
  const plaques = data as Plaque[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plaques;
    return plaques.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.municipality.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q)
    );
  }, [query, plaques]);

  return (
    <section>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <label htmlFor="q">Search</label>
          <input id="q" className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="title, place, keywords" />
        </div>
      </div>

      <div className="grid">
        {filtered.map(p => (
          <article key={p.id} className="card">
            <h3 style={{ color: 'var(--green)' }}>{p.title}</h3>
            <p className="small">{p.municipality}</p>
            <p>{p.summary}</p>
            <div style={{ marginTop: 8 }}>
              <Link className="button" to={`/plaques/${p.id}`}>Details</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
