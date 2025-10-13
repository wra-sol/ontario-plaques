import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

type Plaque = Record<string, any> & {
  id: string;
  url?: string;
  canonical_url?: string;
  title?: string;
  meta_description?: string | null;
  location_text?: string | null;
  location_hierarchy?: string[] | null;
  coordinates_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  plaque_text?: string | null;
  photos?: Array<{ src: string; alt?: string; caption?: string }> | null;
  related_links?: Array<{ title: string; url: string }> | null;
  subject_links?: Array<{ title: string; url: string }> | null;
  more_links?: Array<{ title: string; url: string }> | null;
  tags?: string[] | null;
  source_directories?: string[] | null;
  scraped_at?: string | null;
};

function isHttpUrl(url?: string | null): url is string {
  return !!url && /^(https?:)?\/\//i.test(url);
}

function toAbsolute(base: string, href: string): string {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<{ display: string; townOrCity?: string; region?: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=en`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ontario-plaques/0.1 (+https://github.com/)'
      }
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const addr = data.address || {};
    const townOrCity = addr.city || addr.town || addr.village || addr.hamlet || undefined;
    const region = addr.county || addr.region || addr.state_district || undefined;
    const display = data.display_name || [townOrCity, region, addr.state, addr.country].filter(Boolean).join(', ');
    return { display, townOrCity, region };
  } catch {
    return null;
  }
}

function extractCoords(text: string) {
  const t = text || '';
  // Common formats like: "Coordinates: N 46 22.935 W 82 38.516"
  const m1 = t.match(/N\s*([\d.]+)\s*W\s*([\d.]+)/i);
  if (m1) {
    const lat = parseFloat(m1[1]);
    const lon = -parseFloat(m1[2]);
    return { latitude: lat, longitude: lon, coordinates_text: `N ${m1[1]} W ${m1[2]}` };
  }
  // Decimal lat, lon in text
  const m2 = t.match(/([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/);
  if (m2) {
    const lat = parseFloat(m2[1]);
    const lon = parseFloat(m2[2]);
    return { latitude: lat, longitude: lon, coordinates_text: `${lat}, ${lon}` };
  }
  return null;
}

// Parse lat/lon from common Google Maps link patterns
function extractCoordsFromUrl(href: string) {
  try {
    const url = new URL(href, 'https://example.com');
    const atMatch = href.match(/@\s*([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/);
    if (atMatch) {
      return { latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]), coordinates_text: `${atMatch[1]}, ${atMatch[2]}` };
    }
    const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('ll');
    if (q) {
      const m = q.match(/([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/);
      if (m) return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]), coordinates_text: `${m[1]}, ${m[2]}` };
    }
  } catch {}
  return null;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'Accept': 'text/html' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function dedupeBy<T>(arr: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const key = getKey(item);
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

async function enrichFromUrl(plaque: Plaque): Promise<Partial<Plaque>> {
  const url = plaque.canonical_url || plaque.url;
  if (!isHttpUrl(url)) return {};

  const html = await fetchHtml(url);
  if (!html) return {};

  const $ = cheerio.load(html);

  // Title from page if missing
  const pageTitle = $('meta[property="og:title"]').attr('content') || $('title').first().text().trim();

  // Meta description
  const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');

  // OpenGraph/Twitter images
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
  const resolvedOgImage = ogImage ? toAbsolute(url!, ogImage) : undefined;

  // Meta keywords (tags)
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  const keywordTags = metaKeywords ? metaKeywords.split(/,\s*/).map(k => k.trim()).filter(Boolean) : [];

  // JSON-LD parsing for Place, GeoCoordinates, image
  const jsonLdBlocks: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const txt = $(el).text();
      if (!txt) return;
      const data = JSON.parse(txt);
      if (Array.isArray(data)) jsonLdBlocks.push(...data);
      else jsonLdBlocks.push(data);
    } catch {}
  });

  function collectFromNode(node: any) {
    const found: { addressText?: string; latitude?: number; longitude?: number; image?: string } = {};
    if (!node || typeof node !== 'object') return found;
    const typeVal = Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean);
    const types = (typeVal as string[]).map((t) => String(t).toLowerCase());
    const isPlaceLike = types.some((t) => [
      'place', 'touristattraction', 'landmark', 'landmarksorhistoricalbuildings', 'civicstructure', 'monument', 'museum', 'bridge', 'church', 'park', 'historicsite'
    ].includes(t));
    // Image
    if (typeof node.image === 'string') found.image = node.image;
    if (Array.isArray(node.image) && node.image.length) found.image = node.image[0];
    if (node.photo && typeof node.photo === 'string') found.image = node.photo;
    // Geo
    const geo = node.geo || node.GeoCoordinates || undefined;
    if (geo) {
      const lat = parseFloat(geo.latitude ?? geo.lat ?? geo['@latitude']);
      const lon = parseFloat(geo.longitude ?? geo.lon ?? geo['@longitude']);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        found.latitude = lat;
        found.longitude = lon;
      }
    }
    // Address
    const addr = node.address || (isPlaceLike ? node.location : undefined) || undefined;
    if (isPlaceLike && addr && typeof addr === 'object') {
      const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry]
        .map((p: any) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean);
      if (parts.length) found.addressText = parts.join(', ');
    }
    return found;
  }

  let ldLatitude: number | undefined;
  let ldLongitude: number | undefined;
  let ldAddressText: string | undefined;
  let ldImage: string | undefined;
  for (const block of jsonLdBlocks) {
    const nodes = Array.isArray(block['@graph']) ? block['@graph'] : [block];
    for (const node of nodes) {
      const c = collectFromNode(node);
      if (c.latitude != null && c.longitude != null && (ldLatitude == null || ldLongitude == null)) {
        ldLatitude = c.latitude;
        ldLongitude = c.longitude;
      }
      if (c.addressText && !ldAddressText) ldAddressText = c.addressText;
      if (c.image && !ldImage) ldImage = c.image;
      if (node.containsPlace || node.location || node.contentLocation) {
        const nested = collectFromNode(node.containsPlace || node.location || node.contentLocation);
        if (nested.latitude != null && nested.longitude != null && (ldLatitude == null || ldLongitude == null)) {
          ldLatitude = nested.latitude;
          ldLongitude = nested.longitude;
        }
        if (nested.addressText && !ldAddressText) ldAddressText = nested.addressText;
        if (nested.image && !ldImage) ldImage = nested.image;
      }
    }
  }

  // Location text heuristics
  const locationText = (
    $('.plaque-location, [class*="location"]').first().text().trim() ||
    $('p:contains("Location:")').first().text().replace(/^[^:]*:/, '').trim() ||
    $('.address').first().text().trim() ||
    ''
  );

  // Coordinates
  let coordsBlock = $('p:contains("Coordinates:"), span:contains("Coordinates:")').first().text().trim();
  if (!coordsBlock) {
    // Fallback to entire body text scan
    coordsBlock = $('body').text();
  }
  const coords = extractCoords(coordsBlock || '');
  const coordsFromLd = (ldLatitude != null && ldLongitude != null) ? { latitude: ldLatitude, longitude: ldLongitude, coordinates_text: `${ldLatitude}, ${ldLongitude}` } : null;
  let coordsFromLinks: { latitude: number; longitude: number; coordinates_text?: string } | null = null;
  $('a[href*="maps.google"], a[href*="google.com/maps"], a[href*="maps.app.goo.gl"]').each((_, a) => {
    if (coordsFromLinks) return;
    const href = $(a).attr('href') || '';
    const parsed = extractCoordsFromUrl(href);
    if (parsed) coordsFromLinks = parsed;
  });

  // Plaque text heuristics: choose longest reasonable paragraph in main content
  let plaqueText = '';
  const candidates: string[] = [];
  $('article p, main p, .content p, .plaque-text, .plaque-content, [class*="plaque-text"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length >= 100 && t.length <= 4000) candidates.push(t);
  });
  if (candidates.length) {
    plaqueText = candidates.sort((a, b) => b.length - a.length)[0];
  } else {
    $('p').each((_, el) => {
      const t = $(el).text().trim();
      if (t.length >= 100 && t.length <= 4000) candidates.push(t);
    });
    if (candidates.length) plaqueText = candidates.sort((a, b) => b.length - a.length)[0];
  }

  // Photos
  const photos: Array<{ src: string; alt?: string; caption?: string }> = [];
  $('img').each((_, img) => {
    const src = $(img).attr('src') || '';
    if (!src) return;
    const normalized = toAbsolute(url!, src);
    const alt = $(img).attr('alt') || undefined;
    const caption = $(img).closest('figure').find('figcaption').text().trim() || $(img).parent().find('.caption').text().trim() || undefined;
    // Filter obvious non-content images
    const lower = normalized.toLowerCase();
    if (lower.includes('logo') || lower.includes('icon') || lower.includes('sprite')) return;
    photos.push({ src: normalized, alt, caption });
  });

  // Seed OG/JSON-LD image if no images found
  if (photos.length === 0 && (resolvedOgImage || ldImage)) {
    const chosen = resolvedOgImage || (ldImage ? toAbsolute(url!, ldImage) : undefined);
    if (chosen) photos.push({ src: chosen });
  }

  // Related plaque links on same domain
  const related: Array<{ title: string; url: string }> = [];
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const text = $(a).text().trim();
    if (!text || !href) return;
    const abs = toAbsolute(url!, href);
    if (abs === url) return;
    if (abs.includes('heritagetrust.on.ca/plaques') || abs.includes('ontarioplaques.com/Plaques')) {
      related.push({ title: text, url: abs });
    }
  });

  // Breadcrumb-based location hierarchy
  const breadcrumb: string[] = [];
  const crumbSel = '.breadcrumb a, .breadcrumbs a, nav[aria-label="breadcrumb"] a, .govuk-breadcrumbs__link';
  $(crumbSel).each((_, a) => {
    const text = $(a).text().trim();
    if (!text) return;
    const lower = text.toLowerCase();
    if (['home', 'plaques', 'english', 'français'].includes(lower)) return;
    breadcrumb.push(text);
  });

  // Wikipedia enrichment if present in existing links or page links
  let wikiCategories: string[] = [];
  let wikiLeadImage: string | undefined;
  let wikiCoords: { latitude?: number; longitude?: number } | undefined;
  const wikiLinkInData = [...(plaque.more_links || []), ...(plaque.related_links || [])]
    .map(l => l.url)
    .find(u => /wikipedia\.org\/wiki\//i.test(u || ''));
  let wikiUrl: string | undefined = wikiLinkInData;
  if (!wikiUrl) {
    const a = $('a[href*="wikipedia.org/wiki/"]').first();
    const href = a.attr('href');
    if (href) wikiUrl = toAbsolute(url!, href);
  }
  if (wikiUrl) {
    try {
      const title = decodeURIComponent(wikiUrl.split('/wiki/')[1] || '').split('#')[0];
      // Summary for lead image
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        wikiLeadImage = summary.originalimage?.source || summary.thumbnail?.source;
      }
      // Categories and coordinates via action API
      const apiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=categories|coordinates&clshow=!hidden&cllimit=50&format=json&titles=${encodeURIComponent(title)}`);
      if (apiRes.ok) {
        const api = await apiRes.json();
        const pages = api?.query?.pages || {};
        for (const key of Object.keys(pages)) {
          const page = pages[key];
          if (Array.isArray(page.categories)) {
            wikiCategories = page.categories
              .map((c: any) => (typeof c.title === 'string' ? c.title.replace(/^Category:/, '').trim() : ''))
              .filter(Boolean);
          }
          if (Array.isArray(page.coordinates) && page.coordinates.length > 0) {
            const c = page.coordinates[0];
            wikiCoords = { latitude: c.lat, longitude: c.lon };
          }
        }
      }
    } catch {}
  }

  const update: Partial<Plaque> = {};
  if (!plaque.title && pageTitle) update.title = pageTitle;
  if (!plaque.meta_description && metaDescription) update.meta_description = metaDescription;
  const badSiteAddress = (plaque.location_text || '').toLowerCase().includes('adelaide street east') || (plaque.location_text || '').includes('M5C 1J3');
  if ((!plaque.location_text || badSiteAddress) && (locationText || ldAddressText)) update.location_text = locationText || ldAddressText;
  // Prefer on-page coords, then JSON-LD, then Wikipedia (only if categories imply a place)
  const placeKeywords = ['bridge', 'church', 'school', 'settlement', 'village', 'house', 'lighthouse', 'mill', 'station', 'park', 'river', 'expedition'];
  const wikiLooksPlace = wikiCategories.some((c) => placeKeywords.some(k => c.toLowerCase().includes(k)));
  const coordSource = coords || coordsFromLd || coordsFromLinks || (wikiLooksPlace ? wikiCoords : null);
  if ((!plaque.coordinates_text || plaque.latitude == null || plaque.longitude == null) && coordSource) {
    update.coordinates_text = coords?.coordinates_text;
    update.latitude = coordSource.latitude;
    update.longitude = coordSource.longitude;
  }
  // If we have coordinates (existing or new) and missing/invalid location_text, reverse geocode to get a readable place name
  const latToUse = (update.latitude != null ? update.latitude : plaque.latitude);
  const lonToUse = (update.longitude != null ? update.longitude : plaque.longitude);
  if ((latToUse != null && lonToUse != null) && (!plaque.location_text || badSiteAddress) && !update.location_text) {
    const rev = await reverseGeocode(latToUse as number, lonToUse as number);
    if (rev?.display) {
      update.location_text = rev.display;
    }
  }
  // If we still have only the known bad address and nothing better, clear it
  if (badSiteAddress && !update.location_text && !coords && !coordsFromLd && !coordsFromLinks && !wikiCoords) {
    update.location_text = undefined as any;
  }
  // Store breadcrumb as location hierarchy if missing
  if ((!plaque.location_hierarchy || plaque.location_hierarchy.length === 0) && breadcrumb.length > 0) {
    update.location_hierarchy = breadcrumb;
  }
  if (!plaque.plaque_text && plaqueText) update.plaque_text = plaqueText;
  if ((!plaque.photos || plaque.photos.length === 0) && photos.length > 0) update.photos = dedupeBy(photos, p => p.src).slice(0, 6);
  if ((!plaque.related_links || plaque.related_links.length === 0) && related.length > 0) update.related_links = dedupeBy(related, r => r.url).slice(0, 12);
  if (!plaque.scraped_at) update.scraped_at = new Date().toISOString();
  // Tags from keywords or Wikipedia categories if absent
  if ((!plaque.tags || plaque.tags.length === 0) && (keywordTags.length > 0 || wikiCategories.length > 0)) {
    const drop = new Set([
      'Articles with short description','Use dmy dates from','CS1 errors','Infobox','All stub articles','Canada stubs','Pages using','Articles','Births','Deaths'
    ].map(s => s.toLowerCase()));
    const filteredCats = wikiCategories.filter(c => !Array.from(drop).some(d => c.toLowerCase().startsWith(d)));
    update.tags = (keywordTags.length > 0 ? keywordTags : filteredCats).slice(0, 20);
  }
  // Seed more_links with wikipedia if not present
  if (wikiUrl && (!plaque.more_links || !plaque.more_links.find((l: any) => l.url === wikiUrl))) {
    update.more_links = [ ...(plaque.more_links || []), { title: 'Information', url: wikiUrl } ];
  }
  // If we got a wiki lead image and still no photos, attach it
  if ((!update.photos && (!plaque.photos || plaque.photos.length === 0)) && wikiLeadImage) {
    update.photos = [{ src: wikiLeadImage }];
  }

  return update;
}

async function main() {
  const dataPath = path.join(process.cwd(), 'public/data/ontario_plaques.json');
  const backupPath = path.join(process.cwd(), 'public/data/ontario_plaques.backup.json');

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const list: Plaque[] = JSON.parse(raw);

  // How many to process from the end
  const n = Number(process.env.N || 10);
  const start = Math.max(0, list.length - n);

  console.log(`Enriching last ${n} entries (indexes ${start}..${list.length - 1})`);

  // Backup once
  fs.writeFileSync(backupPath, JSON.stringify(list, null, 2));
  console.log(`Backup saved to ${backupPath}`);

  let updatedCount = 0;
  for (let i = list.length - 1; i >= start; i--) {
    const p = list[i];
    console.log(`[${i + 1}/${list.length}] ${p.id}`);
    const before = JSON.stringify({
      title: p.title,
      location_text: p.location_text,
      plaque_text: p.plaque_text,
      latitude: p.latitude,
      longitude: p.longitude,
      photos: Array.isArray(p.photos) ? p.photos.length : 0,
      related_links: Array.isArray(p.related_links) ? p.related_links.length : 0,
    });

    const patch = await enrichFromUrl(p);
    const keys = Object.keys(patch);
    if (keys.length > 0) {
      Object.assign(p, patch);
      updatedCount++;
      const after = JSON.stringify({
        title: p.title,
        location_text: p.location_text,
        plaque_text: p.plaque_text,
        latitude: p.latitude,
        longitude: p.longitude,
        photos: Array.isArray(p.photos) ? p.photos.length : 0,
        related_links: Array.isArray(p.related_links) ? p.related_links.length : 0,
      });
      console.log(`  + Updated fields: ${keys.join(', ')}`);
      console.log(`  Before: ${before}`);
      console.log(`  After:  ${after}`);
    } else {
      console.log('  (no changes)');
    }

    // Be respectful: small delay between requests
    await new Promise(r => setTimeout(r, 800));
  }

  fs.writeFileSync(dataPath, JSON.stringify(list, null, 2));
  console.log(`\nSaved updates to ${dataPath}`);
  console.log(`Updated ${updatedCount} of ${Math.min(n, list.length)} entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


