import { Link, useLoaderData, Form, useNavigation } from 'react-router-dom';

export async function loader() {
  const data = await import('../../src/data/plaques.json');
  return data.default;
}

export default function PlaquesRoute() {
  const plaques = useLoaderData() as Array<{
    id: string;
    title: string;
    municipality: string;
    latitude: number;
    longitude: number;
    summary: string;
    year?: number;
  }>;

  return (
    <section>
      <div className="card" style={{ marginBottom: 16 }}>
        <Form method="get" className="row">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" className="input" placeholder="title, place, keywords" />
        </Form>
      </div>
      <div className="grid">
        {plaques.map(p => (
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
