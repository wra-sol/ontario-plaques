import { Link, Form, useLoaderData, useSearchParams } from 'react-router-dom';
import { fetchPlaques, type Plaque } from '../lib/plaques';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.toLowerCase().trim() ?? '';
  const plaques = await fetchPlaques();
  const filtered = q
    ? plaques.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.municipality ?? '').toLowerCase().includes(q) ||
        (p.summary ?? '').toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q) ||
        (p.region ?? '').toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    : plaques;
  return { plaques: filtered, q } as { plaques: Plaque[]; q: string };
}

export default function PlaquesRoute() {
  const { plaques, q } = useLoaderData() as { plaques: Plaque[]; q: string };
  const [searchParams] = useSearchParams();

  return (
    <section>
      <div className="card" style={{ marginBottom: 16 }}>
        <Form method="get" className="row">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={searchParams.get('q') ?? ''} className="input" placeholder="title, place, keywords" />
        </Form>
      </div>
      <div className="grid">
        {plaques.map(p => (
          <article key={p.id} className="card">
            <h3 style={{ color: 'var(--green)' }}>{p.title}</h3>
            <p className="small">{p.municipality}</p>
            <p>{p.summary}</p>
            <div className="list small">
              {p.address ? <div className="row"><div>Address</div><div>{p.address}</div></div> : null}
              {p.region ? <div className="row"><div>Region</div><div>{p.region}</div></div> : null}
              {p.tags?.length ? <div className="row"><div>Tags</div><div>{p.tags.join(', ')}</div></div> : null}
            </div>
            <div style={{ marginTop: 8 }}>
              <Link className="button" to={`/plaques/${p.id}`}>Details</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
