export type RawPlaque = {
  id: string | number;
  title: string;
  municipality?: string;
  city?: string;
  lat?: number;
  latitude?: number;
  lon?: number;
  lng?: number;
  longitude?: number;
  summary?: string;
  plaque_text?: string;
  year?: number;
  address?: string;
  region?: string;
  tags?: string[];
  image_url?: string;
  source_url?: string;
};

export type Plaque = {
  id: string;
  title: string;
  municipality: string;
  latitude: number;
  longitude: number;
  summary: string;
  year?: number;
  address?: string;
  region?: string;
  tags?: string[];
  imageUrl?: string;
  sourceUrl?: string;
};

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) return Number(value);
  return undefined;
}

export function normalizePlaque(raw: RawPlaque): Plaque | null {
  const latitude = coerceNumber(raw.latitude ?? raw.lat);
  const longitude = coerceNumber(raw.longitude ?? raw.lon ?? raw.lng);
  const title = (raw.title ?? '').trim();
  const id = String(raw.id ?? title).trim();
  if (!id || !title || latitude == null || longitude == null) return null;
  return {
    id,
    title,
    municipality: (raw.municipality ?? raw.city ?? '').trim(),
    latitude,
    longitude,
    summary: (raw.summary ?? raw.plaque_text ?? '').trim(),
    year: raw.year,
    address: raw.address,
    region: raw.region,
    tags: raw.tags,
    imageUrl: raw.image_url,
    sourceUrl: raw.source_url,
  };
}

export async function fetchPlaques(): Promise<Plaque[]> {
  // Try to fetch external dataset from public/data first
  try {
    const res = await fetch('/data/ontario_plaques.json', { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const raw = (await res.json()) as RawPlaque[];
      const list = raw.map(normalizePlaque).filter(Boolean) as Plaque[];
      if (list.length) return list;
    }
  } catch (_) {
    // ignore, fall back
  }
  // Fallback to bundled sample
  const sample = (await import('../../src/data/plaques.json')).default as any[];
  return sample.map(s => normalizePlaque(s as RawPlaque)).filter(Boolean) as Plaque[];
}
