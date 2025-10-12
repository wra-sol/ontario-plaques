import { Link } from 'react-router-dom';

export function Home() {
  return (
    <section className="card">
      <h1>Ontario Historical Plaques</h1>
      <p>Concise histories. Clear locations. Square edges.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Link className="button" to="/plaques">Browse Plaques</Link>
        <Link className="button secondary" to="/about">About</Link>
      </div>
    </section>
  );
}
