#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const datasetPath = path.join(root, 'public/data/ontario_plaques.json');

const args = new Map(process.argv.slice(2).map(a => {
  const [k, v] = a.split('=');
  return [k.replace(/^--/, ''), v ?? ''];
}));

const bottom = Number(args.get('bottom') ?? '100');
const limit = Number(args.get('limit') ?? '25');
const dryRun = args.has('dry-run') || args.get('dryRun') === 'true';

function uniqBy(arr, key) {
  const map = new Map();
  for (const it of arr) {
    const k = key(it);
    if (!map.has(k)) map.set(k, it);
  }
  return Array.from(map.values());
}

function absolutize(relativeOrAbsolute, baseUrl) {
  try {
    const u = new URL(relativeOrAbsolute, baseUrl);
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (+data-enrichment)' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return await res.text();
}

function extract(html, plaqueUrl) {
  const changes = {};
  // map image (allow relative and absolute)
  const mapMatch = html.match(/(?:src=\"|href=\")[^.]*Graphics\/(Image_[A-Za-z0-9_]+(?:_[0-9]+)?_Map\.(?:jpg|jpeg|png))\"/i)
    || html.match(/Graphics\/(Image_[A-Za-z0-9_]+(?:_[0-9]+)?_Map\.(?:jpg|jpeg|png))/i);
  if (mapMatch) {
    const full = absolutize('/Graphics/' + mapMatch[1], plaqueUrl);
    if (full) changes.map_image = full;
  }
  // subject links
  const subjMatches = [...html.matchAll(/href=\"((?:https?:\/\/www\.ontarioplaques\.com)?\/?(?:\.\.\/)*Subjects\/Subject_[^\"]+)\"[^>]*>([^<]{2,160})<\/a>/gi)]
    .map(([, href, title]) => ({ title: title.trim(), url: absolutize(href, plaqueUrl) }))
    .filter(x => !!x.url);
  if (subjMatches.length) changes.subject_links = subjMatches;
  // location directory links
  const locMatches = [...html.matchAll(/href=\"((?:https?:\/\/www\.ontarioplaques\.com)?\/?(?:\.\.\/)*Locations\/Location_Directory[^\"]+)\"[^>]*>([^<]{2,160})<\/a>/gi)]
    .map(([, href, title]) => ({ title: title.trim(), url: absolutize(href, plaqueUrl) }))
    .filter(x => !!x.url);
  if (locMatches.length) changes.location_directory_links = locMatches;
  // related plaques
  const relMatches = [...html.matchAll(/href=\"((?:https?:\/\/www\.ontarioplaques\.com)?\/?(?:\.\.\/)*Plaques\/Plaque_[^\"]+)\"[^>]*>([^<]{2,200})<\/a>/gi)]
    .map(([, href, title]) => ({ title: title.trim(), url: absolutize(href, plaqueUrl) }))
    .filter(x => !!x.title && !!x.url);
  if (relMatches.length) changes.related_links = relMatches;
  // wikipedia (or other info) link
  const wiki = html.match(/href=\"(https?:\/\/[^\"]*wikipedia\.org\/wiki\/[^\"]+)\"/i);
  if (wiki) changes.more_links = [{ title: 'Information', url: wiki[1] }];
  // meta description
  const md = html.match(/<meta\s+name=\"description\"\s+content=\"([^\"]{20,})\"\s*\/?\s*>/i);
  if (md) changes.meta_description = md[1].trim();
  return changes;
}

async function main() {
  const raw = fs.readFileSync(datasetPath, 'utf8');
  const data = JSON.parse(raw);
  const start = Math.max(0, data.length - bottom);
  const window = data.slice(start);
  const missing = p => (!p.map_image || !(p.subject_links?.length) || !(p.location_directory_links?.length) || !(p.related_links?.length) || !(p.more_links?.length) || !p.meta_description);
  const candidates = window
    .map((p, i) => ({ p, idx: start + i }))
    .filter(({ p }) => p.canonical_url && missing(p))
    .slice(-limit);

  const updates = [];
  for (const { p, idx } of candidates) {
    try {
      const html = await fetchText(p.canonical_url);
      const ch = extract(html, p.canonical_url);
      let changed = false;
      if (ch.map_image && !p.map_image) { p.map_image = ch.map_image; changed = true; }
      if (ch.subject_links) {
        const before = p.subject_links?.length ?? 0;
        p.subject_links = uniqBy([...(p.subject_links ?? []), ...ch.subject_links], x => x.url);
        if (p.subject_links.length > before) changed = true;
      }
      if (ch.location_directory_links) {
        const before = p.location_directory_links?.length ?? 0;
        p.location_directory_links = uniqBy([...(p.location_directory_links ?? []), ...ch.location_directory_links], x => x.url);
        if (p.location_directory_links.length > before) changed = true;
      }
      if (ch.related_links) {
        const before = p.related_links?.length ?? 0;
        p.related_links = uniqBy([...(p.related_links ?? []), ...ch.related_links], x => x.url).filter(x => x.url !== p.canonical_url);
        if (p.related_links.length > before) changed = true;
      }
      if (ch.more_links && !(p.more_links?.length)) { p.more_links = ch.more_links; changed = true; }
      if (ch.meta_description && !p.meta_description) { p.meta_description = ch.meta_description; changed = true; }
      if (changed) updates.push({ id: p.id, idx, fields: Object.keys(ch).filter(k => ch[k]) });
    } catch (e) {
      // ignore errors for this entry
    }
  }

  if (!dryRun && updates.length) {
    fs.writeFileSync(datasetPath, JSON.stringify(data, null, 2));
  }
  console.log(JSON.stringify({ considered: candidates.length, updated: updates.length, updates }, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

