import { Link, useLoaderData } from 'react-router-dom';
import { fetchPlaques, type Plaque } from '../lib/plaques';

export async function loader({ params }: { params: { id?: string } }) {
  const list = await fetchPlaques();
  const plaque = list.find(p => p.id === (params.id ?? ''));
  if (!plaque) {
    throw new Response('Not Found', { status: 404 });
  }
  return plaque satisfies Plaque;
}

export default function PlaqueDetailRoute() {
  const p = useLoaderData() as Plaque;
  return (
    <section className="card">
      <h1 style={{ color: 'var(--green)' }}>{p.title}</h1>
      <p className="small">{p.municipality}</p>
      <p>{p.summary}</p>
      <div className="list" style={{ marginTop: 8 }}>
        {p.year != null ? <div className="row"><div>Year</div><div>{p.year}</div></div> : null}
        {p.address ? <div className="row"><div>Address</div><div>{p.address}</div></div> : null}
        {p.region ? <div className="row"><div>Region</div><div>{p.region}</div></div> : null}
        {p.tags?.length ? <div className="row"><div>Tags</div><div>{p.tags.join(', ')}</div></div> : null}
        <div className="row"><div>Latitude</div><div>{p.latitude}</div></div>
        <div className="row"><div>Longitude</div><div>{p.longitude}</div></div>
        <div className="row"><div>Maps</div><div><a href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer">Open</a></div></div>
        {p.sourceUrl ? <div className="row"><div>Source</div><div><a href={p.sourceUrl} target="_blank" rel="noreferrer">Link</a></div></div> : null}
      </div>
      <div style={{ marginTop: 12 }}>
        <Link className="button" to="/plaques">Back</Link>
      </div>
    </section>
  );
}
