import { Link, Form, useLoaderData, useSearchParams, useSubmit } from 'react-router';
import type { MetaFunction } from 'react-router';
import { buildMeta } from '../lib/seo';
import type { ReactNode } from 'react';
import { fetchPlaques, type Plaque } from '../lib/plaques';
import { Card, Box, Button, Tag, Grid, Stack, Input, ComboBox, Image, Text } from '../components';

// Helper function to strip common municipality prefixes
function cleanMunicipalityName(name: string | null | undefined): string {
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
  
  let cleaned = name;
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
      break;
    }
  }
  
  return cleaned;
}

// Escape text for use in RegExp
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight query terms within a given text
function highlightText(text: string | undefined, query: string): ReactNode {
  if (!text || !query) return text ?? '';
  const words = Array.from(new Set(query.split(/\s+/).filter(Boolean))).map(escapeRegExp);
  if (words.length === 0) return text;
  const regex = new RegExp(`(${words.join('|')})`, 'ig');
  const parts = text.split(regex);
  return parts.map((part, idx) => (
    idx % 2 === 1
      ? <mark key={idx} style={{ backgroundColor: 'rgba(255, 235, 59, 0.6)', padding: 0 }}>{part}</mark>
      : part
  ));
}

// Build a new query string by merging updates with current params
function buildQueryString(current: URLSearchParams, updates: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === '') sp.delete(key);
    else sp.set(key, String(value));
  }
  return sp.toString();
}

// Search scoring function - returns score and matched fields
function searchPlaque(plaque: Plaque, query: string): { score: number; matches: string[] } | null {
  const q = query.toLowerCase();
  let score = 0;
  const matches: string[] = [];
  
  // Title match (highest priority)
  if (plaque.title.toLowerCase().includes(q)) {
    score += 100;
    matches.push('title');
    // Exact match bonus
    if (plaque.title.toLowerCase() === q) {
      score += 50;
    }
    // Starts with query bonus
    if (plaque.title.toLowerCase().startsWith(q)) {
      score += 25;
    }
  }
  
  // Municipality match (high priority)
  if ((plaque.municipality ?? '').toLowerCase().includes(q)) {
    score += 50;
    matches.push('municipality');
  }
  
  // Tags match (high priority - these are curated topics)
  if ((plaque.tags ?? []).some(t => t.toLowerCase().includes(q))) {
    score += 40;
    matches.push('tags');
  }
  
  // Location hierarchy match
  if ((plaque.locationHierarchy ?? []).some(loc => loc.toLowerCase().includes(q))) {
    score += 30;
    matches.push('location hierarchy');
  }
  
  // Location text match
  if ((plaque.locationText ?? '').toLowerCase().includes(q)) {
    score += 25;
    matches.push('location');
  }
  
  // Plaque text match (lower priority due to length - many false positives)
  if ((plaque.plaqueText ?? '').toLowerCase().includes(q)) {
    score += 10;
    matches.push('plaque text');
  }
  
  return score > 0 ? { score, matches } : null;
}

export async function loader({ request, context }: { request: Request; context: any }) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.toLowerCase().trim() ?? '';
  const municipality = url.searchParams.get('municipality')?.trim() ?? '';
  const tag = url.searchParams.get('tag')?.trim() ?? '';
  const sortParam = url.searchParams.get('sort') ?? (q ? 'relevance' : 'title_asc');
  const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
  const pageSizeParam = parseInt(url.searchParams.get('pageSize') ?? '24', 10);
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(Math.max(pageSizeParam, 6), 96) : 24;
  
  const plaques = await fetchPlaques(request, context?.fetch);
  
  // Apply filters
  let filtered = plaques;
  let searchResults: Map<string, { score: number; matches: string[] }> | null = null;
  
  // Search filter with relevance scoring
  if (q) {
    searchResults = new Map();
    filtered = filtered.filter(p => {
      const result = searchPlaque(p, q);
      if (result) {
        searchResults!.set(p.id, result);
        return true;
      }
      return false;
    });
    
    // Sort by relevance score (highest first) when requested
    if (sortParam === 'relevance') {
      filtered.sort((a, b) => {
        const scoreA = searchResults!.get(a.id)?.score ?? 0;
        const scoreB = searchResults!.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });
    }
  }
  
  // Municipality filter
  if (municipality) {
    filtered = filtered.filter(p => cleanMunicipalityName(p.municipality) === municipality);
  }
  
  // Tag filter
  if (tag) {
    filtered = filtered.filter(p => p.tags?.includes(tag));
  }

  // Sorting (if not relevance or no search query)
  const sort = q ? sortParam : (sortParam === 'relevance' ? 'title_asc' : sortParam);
  const compareTitleAsc = (a: Plaque, b: Plaque) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  const compareTitleDesc = (a: Plaque, b: Plaque) => -compareTitleAsc(a, b);
  const compareMunicipalityAsc = (a: Plaque, b: Plaque) => cleanMunicipalityName(a.municipality).localeCompare(cleanMunicipalityName(b.municipality), undefined, { sensitivity: 'base' });
  const compareYearDesc = (a: Plaque, b: Plaque) => (b.year ?? -Infinity) - (a.year ?? -Infinity);
  const compareYearAsc = (a: Plaque, b: Plaque) => (a.year ?? Infinity) - (b.year ?? Infinity);
  if (sort !== 'relevance') {
    switch (sort) {
      case 'title_desc':
        filtered.sort(compareTitleDesc);
        break;
      case 'municipality_asc':
        filtered.sort(compareMunicipalityAsc);
        break;
      case 'year_desc':
        filtered.sort(compareYearDesc);
        break;
      case 'year_asc':
        filtered.sort(compareYearAsc);
        break;
      case 'title_asc':
      default:
        filtered.sort(compareTitleAsc);
        break;
    }
  } else if (!q) {
    // Default fallback when relevance requested but no search query
    filtered.sort(compareTitleAsc);
  }
  
  // Extract unique values for filter dropdowns (clean municipality names)
  const municipalities = Array.from(
    new Set(plaques.map(p => cleanMunicipalityName(p.municipality)).filter(Boolean))
  ).sort();
  const tags = Array.from(new Set(plaques.flatMap(p => p.tags ?? []))).sort();
  
  // Convert Map to object for serialization
  const searchResultsObj = searchResults ? Object.fromEntries(searchResults) : null;
  
  // Pagination
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.min(pageParam, pageCount) : 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginated = filtered.slice(startIndex, endIndex);
  
  return { 
    plaques: paginated, 
    q,
    municipality,
    tag,
    municipalities,
    tags,
    searchResults: searchResultsObj,
    sort,
    total,
    page,
    pageSize,
    pageCount,
    startIndex: total === 0 ? 0 : startIndex + 1,
    endIndex
  };
}

export default function PlaquesRoute() {
  const { plaques, q, municipality, tag, municipalities, tags, searchResults, sort, total, page, pageSize, pageCount, startIndex, endIndex } = useLoaderData() as {
    plaques: Plaque[];
    q: string;
    municipality: string;
    tag: string;
    municipalities: string[];
    tags: string[];
    searchResults: Record<string, { score: number; matches: string[] }> | null;
    sort: string;
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    startIndex: number;
    endIndex: number;
  };
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  
  const buildQuery = (updates: Record<string, string | number | undefined | null>) => `/plaques?${buildQueryString(searchParams, updates)}`;

  return (
    <section>
      <div className="filter-card" style={{ marginBottom: 16 }}>
        <Form 
          method="get"
          id="search-form"
        >
          <Stack gap={12}>
            <div>
              <label htmlFor="q" className="filter-label">Search All Plaques</label>
              <Input
                id="q"
                name="q"
                defaultValue={searchParams.get('q') ?? ''}
                placeholder="Search by title, location, topics, or plaque text..."
                style={{ width: '100%', fontSize: '13px', padding: '7px 8px', border: '2px solid var(--dark)' }}
                onChange={(e) => {
                  const form = e.currentTarget.form;
                  if (form) {
                    // Debounce search input
                    clearTimeout((window as any).__searchTimeout);
                    (window as any).__searchTimeout = setTimeout(() => {
                      submit(form, { replace: true });
                    }, 300);
                  }
                }}
              />
              <div className="filter-hint">
                Results ranked by relevance. Try searching for a place, historical figure, or topic.
              </div>
            </div>
            
            <Grid columns="repeat(auto-fit, minmax(220px, 1fr))" gap={12}>
              <div>
                <label htmlFor="municipality" className="filter-label">Municipality</label>
                <ComboBox
                  id="municipality"
                  name="municipality"
                  value={searchParams.get('municipality') ?? ''}
                  options={municipalities}
                  placeholder="Search municipalities..."
                  emptyLabel="All Municipalities"
                  onChange={() => {
                    const form = document.getElementById('search-form') as HTMLFormElement;
                    if (form) submit(form, { replace: true });
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="tag" className="filter-label">Subject/Tag</label>
                <ComboBox
                  id="tag"
                  name="tag"
                  value={searchParams.get('tag') ?? ''}
                  options={tags}
                  placeholder="Search topics..."
                  emptyLabel="All Topics"
                  onChange={() => {
                    const form = document.getElementById('search-form') as HTMLFormElement;
                    if (form) submit(form, { replace: true });
                  }}
                />
              </div>

              <div>
                <label htmlFor="sort" className="filter-label">Sort</label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={searchParams.get('sort') ?? (q ? 'relevance' : 'title_asc')}
                  onChange={(e) => {
                    const form = document.getElementById('search-form') as HTMLFormElement;
                    if (form) submit(form, { replace: true });
                  }}
                  className="input"
                  style={{ width: '100%', padding: '7px 8px', border: '2px solid var(--dark)', background: 'var(--white)', color: 'var(--dark)' }}
                >
                  {q && <option value="relevance">Relevance</option>}
                  <option value="title_asc">Title (A–Z)</option>
                  <option value="title_desc">Title (Z–A)</option>
                  <option value="municipality_asc">Municipality (A–Z)</option>
                  <option value="year_desc">Year (Newest)</option>
                  <option value="year_asc">Year (Oldest)</option>
                </select>
              </div>

              <div>
                <label htmlFor="pageSize" className="filter-label">Results per page</label>
                <select
                  id="pageSize"
                  name="pageSize"
                  defaultValue={searchParams.get('pageSize') ?? '24'}
                  onChange={(e) => {
                    const form = document.getElementById('search-form') as HTMLFormElement;
                    if (form) submit(form, { replace: true });
                  }}
                  className="input"
                  style={{ width: '100%', padding: '7px 8px', border: '2px solid var(--dark)', background: 'var(--white)', color: 'var(--dark)' }}
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </select>
              </div>
            </Grid>
            
            <div>
              <button
                type="button"
                className="filter-button"
                onClick={() => {
                  window.location.href = '/plaques';
                }}
              >
                Clear All Filters
              </button>
            </div>
          </Stack>
        </Form>
      </div>
      
      <div style={{ fontSize: '11px', color: 'var(--mid)', marginBottom: 12 }}>
        {total > 0 ? (
          <>
            Showing <strong style={{ color: 'var(--dark)' }}>{startIndex}-{endIndex}</strong> of <strong style={{ color: 'var(--dark)' }}>{total}</strong>
          </>
        ) : (
          <>Showing <strong style={{ color: 'var(--dark)' }}>0</strong></>
        )}
        {(q || municipality || tag) && (
          <>
            {' '}• 
            {q && <span style={{ marginLeft: '4px' }}>search: <strong>"{q}"</strong></span>}
            {municipality && <span style={{ marginLeft: '4px' }}>municipality: <strong>"{municipality}"</strong></span>}
            {tag && <span style={{ marginLeft: '4px' }}>tag: <strong>"{tag}"</strong></span>}
          </>
        )}
      </div>
        
      {searchResults && q && (
        <div style={{ 
          border: '2px solid var(--green)', 
          background: 'var(--light)', 
          padding: '10px 12px', 
          marginBottom: '16px' 
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--green)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Search matches found in:
          </div>
          <Stack direction="row" gap={6} wrap>
            {(() => {
              const matchCounts: Record<string, number> = {};
              Object.values(searchResults).forEach(result => {
                result.matches.forEach(match => {
                  matchCounts[match] = (matchCounts[match] || 0) + 1;
                });
              });
              return Object.entries(matchCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([field, count]) => (
                  <span key={field} style={{ 
                    fontSize: '10px', 
                    padding: '4px 8px', 
                    background: 'var(--white)', 
                    border: '1px solid var(--mid)',
                    color: 'var(--dark)'
                  }}>
                    {field}: {count}
                  </span>
                ));
            })()}
          </Stack>
        </div>
      )}
      
      {plaques.length === 0 ? (
        <Card>
          <div className="empty-state">
            <h3>No plaques found</h3>
            <Text color="mid" style={{ marginBottom: 16 }}>
              Try adjusting your search terms or filters to find what you're looking for.
            </Text>
            <Button to="/plaques" variant="secondary">Clear All Filters</Button>
          </div>
        </Card>
      ) : (
          <Grid>
          {plaques.map(p => {
            const matchInfo = searchResults?.[p.id];
            return (
              <Card 
                key={p.id} 
                as="article"
                className="hoverable"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
{/*                 {p.imageUrl && (
                  <Link to={`/plaques/${p.id}`} prefetch='intent' style={{ textDecoration: 'none' }}>
                    <Image 
                      src={p.imageUrl} 
                      alt={p.title}
                      height={200}
                      style={{ marginBottom: 12, cursor: 'pointer' }}
                    />
                  </Link>
                )} */}
                
                {matchInfo && (
                  <div style={{ marginBottom: 8 }}>
                    <Tag variant="solid" style={{ fontSize: '0.7rem' }} clickable={false}>
                      MATCH: {matchInfo.matches[0]}
                      {matchInfo.matches.length > 1 && ` +${matchInfo.matches.length - 1}`}
                    </Tag>
                  </div>
                )}
                
                <Link to={`/plaques/${p.id}`} prefetch='intent' style={{ textDecoration: 'none' }}>
                  <h3 style={{ color: 'var(--green)', marginBottom: 8, cursor: 'pointer' }}>{highlightText(p.title, q)}</h3>
                </Link>
                
                <Stack gap={12} style={{ marginBottom: 12 }}>
                  <Link
                    to={buildQuery({ municipality: cleanMunicipalityName(p.municipality), page: 1 })}
                    prefetch='intent'
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Text size="small">
                      <strong>{cleanMunicipalityName(p.municipality)}</strong>
                    </Text>
                  </Link>
                  {p.locationText && (
                    <Text size="small" color="mid" style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {highlightText(p.locationText, q)}
                    </Text>
                  )}
                </Stack>
              
                {p.plaqueText && (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    lineHeight: 1.5, 
                    marginBottom: 12,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {p.plaqueText}
                  </p>
                )}
              
                <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                  {p.tags && p.tags.length > 0 && (
                    <Stack direction="row" gap={6} wrap style={{ marginBottom: 12 }}>
                      {p.tags.slice(0, 3).map(t => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                      {p.tags.length > 3 && (
                        <Text size="small" color="mid" style={{ padding: '4px 10px' }}>
                          +{p.tags.length - 3} more
                        </Text>
                      )}
                    </Stack>
                  )}
                  <Link to={`/plaques/${p.id}`} prefetch='intent' style={{ textDecoration: 'none' }}>  
                    <Button style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                      Read Full Plaque →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </Grid>
      )}
      
      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <Link to={buildQuery({ page: page > 1 ? page - 1 : 1 })} prefetch='intent' style={{ textDecoration: 'none' }}>
            <Button variant="secondary" disabled={page <= 1}>
              ← Prev
            </Button>
          </Link>
          <div style={{ fontSize: '12px', color: 'var(--mid)' }}>
            Page <strong style={{ color: 'var(--dark)' }}>{page}</strong> of <strong style={{ color: 'var(--dark)' }}>{pageCount}</strong>
          </div>
          <Link to={buildQuery({ page: page < pageCount ? page + 1 : pageCount })} prefetch='intent' style={{ textDecoration: 'none' }}>
            <Button variant="secondary"  disabled={page >= pageCount}>
              Next →
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

export const meta: MetaFunction<typeof loader> = ({ location, data }) => {
  const q = data?.q ?? '';
  const title = q ? `Search: ${q}` : 'All Plaques';
  const description = q
    ? `Search results for "${q}" across Ontario historical plaques.`
    : 'Browse all Ontario historical plaques by title, location, and topic.';
  
  // Use the first plaque's image as the OG image
  const firstPlaque = data?.plaques?.[0];
  const imageUrl = firstPlaque?.shareImage || firstPlaque?.imageUrl || firstPlaque?.photos?.[0]?.src;
  
  return buildMeta({
    title,
    description,
    pathname: location.pathname + location.search,
    imageUrl,
    imageAlt: firstPlaque?.title,
  });
};
