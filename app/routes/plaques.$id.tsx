import { Link, useLoaderData } from 'react-router-dom';

export async function loader({ params }: { params: { id?: string } }) {
  const data = await import('../../src/data/plaques.json');
  const list = data.default as Array<any>;
  const plaque = list.find(p => p.id === params.id);
  if (!plaque) {
    throw new Response('Not Found', { status: 404 });
  }
  return plaque;
}

export default function PlaqueDetailRoute() {
  const plaque = useLoaderData() as any;
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
