import { Link, useLoaderData } from "react-router-dom";
import type { MetaFunction } from 'react-router';
import { buildMeta } from '../lib/seo';
import { fetchPlaques, type Plaque } from "../lib/plaques";
import { Card, Box, Button, Tag, Stack, Image, Text } from "../components";

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

export async function loader({ params, request, context }: { params: { id?: string }; request: Request; context: any }) {
  const list = await fetchPlaques(request, context?.fetch);
  const plaque = list.find((p) => p.id === (params.id ?? ""));
  if (!plaque) {
    throw new Response("Not Found", { status: 404 });
  }
  return plaque satisfies Plaque;
}

export default function PlaqueDetailRoute() {
  let p = useLoaderData() as Plaque;
  p = { ...p, relatedLinks: p.relatedLinks?.map((link) => ({...link, url: link.url.replace('https://www.ontarioplaques.com/Plaques/', '/plaques/').replace('.html', '')})) ?? [] };
  console.log(p.relatedLinks);
    return (
    <Card as="section">
      <div style={{ marginBottom: 'clamp(16px, 6vw, 32px)' }}>
        <h1 style={{ color: "var(--green)", marginBottom: 16, fontSize: 'clamp(1.5rem, 8vw, 2rem)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{p.title}</h1>
        
        <Stack gap={8}>
          <Text size="large" weight={600} style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            {cleanMunicipalityName(p.municipality)}
          </Text>
          {p.locationHierarchy && p.locationHierarchy.length > 1 && (
            <Text size="small" color="mid" style={{ fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {p.locationHierarchy.join(" › ")}
            </Text>
          )}
        </Stack>
      </div>

      {p.photos && p.photos.length > 0 && (
        <Stack gap={16} style={{ maxWidth: "600px", margin: "0 auto", marginBottom: 'clamp(16px, 6vw, 32px)' }}>
          {p.photos.map((photo, idx) => (
            <Stack key={idx} gap={8}>
              <Image
                src={photo.src}
                alt={photo.alt || p.title}
                style={{ maxWidth: "100%", height: "auto", width: "100%" }}
              />
              {photo.caption && (
                <Text size="small" color="mid" italic style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  {photo.caption}
                </Text>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      {p.plaqueText && (
        <Box border bg="light" p={24} mb={32} borderLeft style={{ padding: 'clamp(16px, 5vw, 24px)' }}>
          <h2 style={{ fontSize: "clamp(1.1rem, 4.5vw, 1.2rem)", marginBottom: 16, color: "var(--green)", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Plaque Text
          </h2>
          <p style={{ lineHeight: 1.8, fontSize: "clamp(0.95rem, 4vw, 1.05rem)", color: 'var(--dark)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            {p.plaqueText}
          </p>
        </Box>
      )}

      {p.tags && p.tags.length > 0 && (
        <Stack gap={12} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: "1.1rem", color: 'var(--dark)' }}>Subjects & Topics</h3>
          <Stack direction="row" gap={10} wrap style={{ gap: 'clamp(6px, 2vw, 10px)' }}>
            {p.tags.map(tag => (
              <Tag key={tag} style={{ fontSize: "clamp(0.75rem, 3vw, 0.85rem)", padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 3vw, 14px)" }}>
                {tag}
              </Tag>
            ))}
          </Stack>
        </Stack>
      )}

      {(p.locationText || p.latitude != null) && (
        <Box border bg="light" p={20} mb={32} style={{ padding: 'clamp(12px, 4vw, 20px)' }}>
          <h3 style={{ fontSize: "clamp(1rem, 4vw, 1.1rem)", marginBottom: "16px", color: 'var(--green)' }}>Location Details</h3>
          <div className="list">
          
          {p.locationText && (
            <div className="row">
              <div>Location</div>
              <div>{p.locationText}</div>
            </div>
          )}
          
          {p.coordinatesText && p.latitude != null && p.longitude != null && (
            <div className="row">
              <div>Coordinates</div>
              <div>
                <a
                  href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--green)", fontWeight: 600 }}
                >
                  {p.coordinatesText}
                </a>
              </div>
            </div>
          )}
          
          {p.latitude != null && (
            <div className="row">
              <div>Latitude</div>
              <div>{p.latitude}</div>
            </div>
          )}
          
          {p.longitude != null && (
            <div className="row">
              <div>Longitude</div>
              <div>{p.longitude}</div>
            </div>
          )}
          </div>
        </Box>
      )}

      {p.relatedLinks && p.relatedLinks.length > 0 && (
        <Box border bg="light" p={20} mb={32} style={{ padding: 'clamp(12px, 4vw, 20px)' }}>
          <h3 style={{ fontSize: "clamp(1rem, 4vw, 1.1rem)", marginBottom: "12px", color: 'var(--green)' }}>Related Links</h3>
          <ul style={{ marginLeft: 'clamp(12px, 4vw, 20px)', lineHeight: 1.8 }}>
            {p.relatedLinks.map((link, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <Link to={link.url} rel="noreferrer" style={{ color: "var(--green)", fontWeight: 600, wordBreak: 'break-word' }}>
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </Box>
      )}

      <Stack direction="row" gap={12} wrap style={{ marginTop: 'clamp(16px, 6vw, 32px)', paddingTop: 'clamp(12px, 4vw, 24px)', borderTop: '2px solid var(--light)', gap: 'clamp(8px, 3vw, 12px)' }}>
        <Button to="/plaques" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>  
          ← Back to All Plaques
        </Button>
        {p.sourceUrl && (
          <Button to={p.sourceUrl} variant="secondary" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
            View Original Source →
          </Button>
        )}
      </Stack>
    </Card>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const p = data;
  const description = p?.shortSummary || p?.plaqueText?.slice(0, 200);
  const imageUrl = p?.shareImage || p?.photos?.[0]?.src || p?.imageUrl;
  return buildMeta({
    title: p?.title,
    description: description || 'Ontario historical plaque details',
    pathname: location.pathname,
    type: 'article',
    imageUrl,
    imageAlt: p?.title,
  });
};
