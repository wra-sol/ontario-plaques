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
  municipalityClean: string;
  latitude?: number;
  longitude?: number;
  plaqueText: string;
  locationText?: string;
  coordinatesText?: string;
  year?: number;
  yearStart?: number;
  yearEnd?: number;
  century?: number;
  address?: string;
  region?: string;
  tags?: string[];
  tagSlugs?: string[];
  imageUrl?: string;
  sourceUrl?: string;
  photos?: Photo[];
  relatedLinks?: Link[];
  subjectLinks?: Link[];
  locationHierarchy?: string[];
  titleSortKey: string;
  shortSummary?: string;
  hasPhoto?: boolean;
};

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) return Number(value);
  return undefined;
}

export function normalizePlaque(raw: RawPlaque): Plaque | null {
  function removeDiacritics(text: string): string {
    return (text ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function cleanMunicipalityName(name: string | undefined | null): string {
    if (!name) return '';
    const prefixes = [
      'The Municipality of ',
      'The Town of ',
      'The City of ',
      'The Township of ',
      'The Village of ',
      'The County of ',
      'Municipality of ',
      'Town of ',
      'City of ',
      'Township of ',
      'Village of ',
      'County of ',
    ];
    let cleaned = name.trim();
    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.slice(prefix.length);
        break;
      }
    }
    return cleaned.trim();
  }

  function buildTitleSortKey(title: string): string {
    let key = removeDiacritics(title).toLowerCase();
    key = key.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '');
    // Drop leading English articles for sort
    key = key.replace(/^(the\s+|a\s+|an\s+)/, '');
    // Remove punctuation
    key = key.replace(/[^a-z0-9\s]/g, '');
    // Collapse whitespace
    key = key.replace(/\s+/g, ' ').trim();
    return key;
  }

  function toSlug(text: string): string {
    return removeDiacritics(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function extractYearInfo(text: string | undefined): { year?: number; yearStart?: number; yearEnd?: number; century?: number } {
    if (!text) return {};
    const content = text.replace(/\(.*?\)/g, '');
    // Range patterns: 1860-1865, 1860 – 1865, 1860 to 1865
    const rangeMatch = content.match(/\b(1[0-9]{3}|20[0-9]{2})\s*(?:-|–|—|to)\s*(1[0-9]{3}|20[0-9]{2})\b/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const year = Math.round((start + end) / 2);
      const century = Math.floor((year - 1) / 100) + 1;
      return { year, yearStart: start, yearEnd: end, century };
    }
    // Decade like 1860s
    const decadeMatch = content.match(/\b(1[0-9]{3}|20[0-9]{2})s\b/);
    if (decadeMatch) {
      const start = parseInt(decadeMatch[1], 10);
      const year = start;
      const century = Math.floor((year - 1) / 100) + 1;
      return { year, yearStart: start, yearEnd: start + 9, century };
    }
    // Single year
    const singleMatch = content.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
    if (singleMatch) {
      const year = parseInt(singleMatch[1], 10);
      const century = Math.floor((year - 1) / 100) + 1;
      return { year, yearStart: year, yearEnd: year, century };
    }
    return {};
  }

  const latitude = coerceNumber(raw.latitude ?? raw.lat);
  const longitude = coerceNumber(raw.longitude ?? raw.lon ?? raw.lng);
  const title = (raw.title ?? '').trim();
  const id = String(raw.id ?? title).trim();
  
  // Require ID and title, but coordinates are optional
  if (!id || !title) return null;
  
  // Skip if coordinates are partially present (must have both or neither)
  if ((latitude == null) !== (longitude == null)) return null;
  
  // Extract municipality from location_hierarchy or fallback to legacy fields
  const municipality = (
    raw.location_hierarchy?.[0] ?? 
    raw.municipality ?? 
    raw.city ?? 
    ''
  ).trim();
  const municipalityClean = cleanMunicipalityName(municipality);
  
  // Get primary image from photos array or legacy image_url
  const imageUrl = raw.photos?.[0]?.src ?? raw.image_url;
  
  // Get the actual plaque text (not the short meta_description)
  const plaqueText = (
    raw.plaque_text ?? 
    raw.summary ?? 
    raw.meta_description ?? 
    ''
  ).trim();
  const { year: extractedYear, yearStart, yearEnd, century } = extractYearInfo(plaqueText);
  
  // Extract tags from subject_links or use legacy tags
  const tags = (raw.subject_links?.map(link => link.title) ?? raw.tags ?? [])
    .map(t => t.trim())
    .filter(Boolean);
  const tagSlugs = tags.map(toSlug);
  
  // Get source URL
  const sourceUrl = raw.canonical_url ?? raw.url ?? raw.source_url;
  const titleSortKey = buildTitleSortKey(title);
  const shortSummary = plaqueText ? (plaqueText.split(/(?<=\.)\s+/)[0] || plaqueText).slice(0, 220) : undefined;
  const hasPhoto = Boolean(raw.photos?.length || raw.image_url);
  
  return {
    id,
    title,
    municipality,
    municipalityClean,
    latitude,
    longitude,
    plaqueText,
    locationText: raw.location_text,
    coordinatesText: raw.coordinates_text,
    year: raw.year ?? extractedYear,
    yearStart,
    yearEnd,
    century,
    address: raw.address,
    region: raw.region,
    tags,
    tagSlugs,
    imageUrl,
    sourceUrl,
    photos: raw.photos,
    relatedLinks: raw.related_links,
    subjectLinks: raw.subject_links,
    locationHierarchy: raw.location_hierarchy,
    titleSortKey,
    shortSummary,
    hasPhoto,
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
