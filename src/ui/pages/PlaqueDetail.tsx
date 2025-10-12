import { Link, useParams } from 'react-router-dom';
import data from '../../data/plaques.json';
import type { Plaque } from './Plaques';

export function PlaqueDetail() {
  const { id } = useParams();
  const plaques = data as Plaque[];
  const plaque = plaques.find(p => p.id === id);

  if (!plaque) {
    return (
      <section className="card">
        <h2>Not found</h2>
        <p>No plaque found.</p>
        <Link className="button" to="/plaques">Back to list</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h1 style={{ color: 'var(--green)' }}>{plaque.title}</h1>
      <p className="small">{plaque.municipality}</p>
      <p>{plaque.summary}</p>
      <div className="list" style={{ marginTop: 8 }}>
        <div className="row"><div>Year</div><div>{plaque.year ?? '—'}</div></div>
        <div className="row"><div>Latitude</div><div>{plaque.latitude}</div></div>
        <div className="row"><div>Longitude</div><div>{plaque.longitude}</div></div>
        <div className="row"><div>Maps</div><div><a href={`https://maps.google.com/?q=${plaque.latitude},${plaque.longitude}`} target="_blank" rel="noreferrer">Open</a></div></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Link className="button" to="/plaques">Back</Link>
      </div>
    </section>
  );
}
