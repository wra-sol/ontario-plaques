import { Link, useLoaderData } from "react-router-dom";
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

export async function loader({ params }: { params: { id?: string } }) {
  const list = await fetchPlaques();
  const plaque = list.find((p) => p.id === (params.id ?? ""));
  if (!plaque) {
    throw new Response("Not Found", { status: 404 });
  }
  return plaque satisfies Plaque;
}

export default function PlaqueDetailRoute() {
  const p = useLoaderData() as Plaque;
  return (
    <Card as="section">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: "var(--green)", marginBottom: 16, fontSize: '2rem' }}>{p.title}</h1>
        
        <Stack gap={8}>
          <Text size="large" weight={600} style={{ fontSize: '1.2rem' }}>
            {cleanMunicipalityName(p.municipality)}
          </Text>
          {p.locationHierarchy && p.locationHierarchy.length > 1 && (
            <Text size="small" color="mid" style={{ fontSize: '0.9rem' }}>
              {p.locationHierarchy.join(" › ")}
            </Text>
          )}
        </Stack>
      </div>

      {p.photos && p.photos.length > 0 && (
        <Stack gap={16} style={{ maxWidth: "600px", margin: "0 auto", marginBottom: 32 }}>
          {p.photos.map((photo, idx) => (
            <Stack key={idx} gap={8}>
              <Image
                src={photo.src}
                alt={photo.alt || p.title}
                style={{ maxWidth: "100%", height: "auto" }}
              />
              {photo.caption && (
                <Text size="small" color="mid" italic>
                  {photo.caption}
                </Text>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      {p.plaqueText && (
        <Box border bg="light" p={24} mb={32} borderLeft>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 16, color: "var(--green)", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Plaque Text
          </h2>
          <p style={{ lineHeight: 1.8, fontSize: "1.05rem", color: 'var(--dark)' }}>
            {p.plaqueText}
          </p>
        </Box>
      )}

      {p.tags && p.tags.length > 0 && (
        <Stack gap={12} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: "1.1rem", color: 'var(--dark)' }}>Subjects & Topics</h3>
          <Stack direction="row" gap={10} wrap>
            {p.tags.map(tag => (
              <Tag key={tag} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                {tag}
              </Tag>
            ))}
          </Stack>
        </Stack>
      )}

      <Box border bg="light" p={20} mb={32}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", color: 'var(--green)' }}>Location Details</h3>
        <div className="list">
        
        {p.locationText && (
          <div className="row">
            <div>Location</div>
            <div>{p.locationText}</div>
          </div>
        )}
        
        {p.coordinatesText && (
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
        
        <div className="row">
          <div>Latitude</div>
          <div>{p.latitude}</div>
        </div>
        
        <div className="row">
          <div>Longitude</div>
          <div>{p.longitude}</div>
        </div>
        </div>
      </Box>

      {p.relatedLinks && p.relatedLinks.length > 0 && (
        <Box border bg="light" p={20} mb={32}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: 'var(--green)' }}>Related Links</h3>
          <ul style={{ marginLeft: 20, lineHeight: 1.8 }}>
            {p.relatedLinks.map((link, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <a href={link.url} target="_blank" rel="noreferrer" style={{ color: "var(--green)", fontWeight: 600 }}>
                  {link.title} →
                </a>
              </li>
            ))}
          </ul>
        </Box>
      )}

      <Stack direction="row" gap={12} wrap style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid var(--light)' }}>
        <Button to="/plaques">
          ← Back to All Plaques
        </Button>
        {p.sourceUrl && (
          <Button href={p.sourceUrl} variant="secondary">
            View Original Source →
          </Button>
        )}
      </Stack>
    </Card>
  );
}
