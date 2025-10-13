export type Photo = {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type Link = {
  title: string;
  url: string;
};

export type RawPlaque = {
  id: string | number;
  title: string;
  // Legacy fields
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
  // New fields from ontarioplaques.com
  url?: string;
  canonical_url?: string;
  meta_description?: string;
  location_text?: string;
  location_hierarchy?: string[];
  coordinates_text?: string;
  map_image?: string;
  related_links?: Link[];
  subject_links?: Link[];
  more_links?: Link[];
  location_directory_links?: Link[];
  photos?: Photo[];
  source_directories?: string[];
  scraped_at?: string;
};

export type Plaque = {
  id: string;
  title: string;
  municipality: string;
  latitude: number;
  longitude: number;
  plaqueText: string;
  locationText?: string;
  coordinatesText?: string;
  year?: number;
  address?: string;
  region?: string;
  tags?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  photos?: Photo[];
  relatedLinks?: Link[];
  subjectLinks?: Link[];
  locationHierarchy?: string[];
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
  
  // Extract municipality from location_hierarchy or fallback to legacy fields
  const municipality = (
    raw.location_hierarchy?.[0] ?? 
    raw.municipality ?? 
    raw.city ?? 
    ''
  ).trim();
  
  // Get primary image from photos array or legacy image_url
  const imageUrl = raw.photos?.[0]?.src ?? raw.image_url;
  
  // Get the actual plaque text (not the short meta_description)
  const plaqueText = (
    raw.plaque_text ?? 
    raw.summary ?? 
    raw.meta_description ?? 
    ''
  ).trim();
  
  // Extract tags from subject_links or use legacy tags
  const tags = raw.subject_links?.map(link => link.title) ?? raw.tags;
  
  // Get source URL
  const sourceUrl = raw.canonical_url ?? raw.url ?? raw.source_url;
  
  return {
    id,
    title,
    municipality,
    latitude,
    longitude,
    plaqueText,
    locationText: raw.location_text,
    coordinatesText: raw.coordinates_text,
    year: raw.year,
    address: raw.address,
    region: raw.region,
    tags,
    imageUrl,
    sourceUrl,
    photos: raw.photos,
    relatedLinks: raw.related_links,
    subjectLinks: raw.subject_links,
    locationHierarchy: raw.location_hierarchy,
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
  const sample = (await import('../data/plaques.json')).default as any[];
  return sample.map(s => normalizePlaque(s as RawPlaque)).filter(Boolean) as Plaque[];
}
