import { Link, useLoaderData } from 'react-router-dom';
import type { MetaFunction } from 'react-router';
import { buildMeta } from '../lib/seo';
import { fetchPlaques, type Plaque } from '../lib/plaques';
import { Card, Box, Button, Tag, Stack, Image, Text as TextComponent } from '../components';

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
    'The District of ',
    'The County of ',
    'The United Counties of ',
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

export async function loader({ request, context }: { request: Request; context: any }) {
  const plaques = await fetchPlaques(request, context?.fetch);
  
  // Select a plaque based on the day of year for consistent daily rotation
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const featuredIndex = dayOfYear % plaques.length;
  const featured = plaques[featuredIndex];
  
  return { featured, totalCount: plaques.length };
}

export default function Index() {
  const { featured, totalCount } = useLoaderData() as { featured: Plaque; totalCount: number };
  
  return (
    <Card as="section">
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 12 }}>Ontario Historical Plaques</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--mid)', marginBottom: 24 }}>
          Yours to discover.
        </p>
      </div>
      
      {featured && (
        <Box border bg="light" p={24} mt={32} borderLeft={false}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 4, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Featured Plaque of the Day
            </h2>
            <TextComponent size="small" color="mid">
              A new plaque featured daily
            </TextComponent>
          </div>
          
          {featured.imageUrl && (
            <Link to={`/plaques/${featured.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ marginBottom: 16 }}>
                <Image 
                  src={featured.imageUrl} 
                  alt={featured.title}
                  style={{ 
                    marginBottom: 0, 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: 500
                  }}
                />
              </div>
            </Link>
          )}
          
          <Link 
            to={`/plaques/${featured.id}`} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <h3 style={{ fontSize: '1.6rem', marginBottom: 12, color: 'var(--dark)' }}>{featured.title}</h3>
          </Link>
          
          <p style={{ color: 'var(--mid)', marginBottom: 20, fontSize: '1rem' }}>
            <strong>{cleanMunicipalityName(featured.municipality)}</strong>
            {featured.year && ` • Established ${featured.year}`}
          </p>
          
          {featured.plaqueText && (
            <p style={{ lineHeight: 1.7, marginBottom: 24, fontSize: '1rem', color: 'var(--dark)' }}>
              {featured.plaqueText}
            </p>
          )}
          
          <Stack direction="row" gap={12} wrap align="center">
            <Button to={`/plaques/${featured.id}`}>
              View Full Details →
            </Button>
            {featured.tags && featured.tags.length > 0 && (
              <Stack direction="row" gap={8} wrap>
                {featured.tags.slice(0, 4).map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                {featured.tags.length > 4 && (
                  <TextComponent size="small" color="mid" style={{ padding: '4px 0' }}>
                    +{featured.tags.length - 4} more
                  </TextComponent>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      )}
      
      <div style={{ 
        marginTop: 48, 
        textAlign: 'center',
        padding: '24px',
        backgroundColor: 'var(--light)',
        border: '3px solid var(--dark)'
      }}>
        <Link 
          to="/plaques" 
          style={{ 
            color: 'var(--green)', 
            textDecoration: 'none', 
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Browse all {totalCount} plaques →
        </Link>
      </div>
    </Card>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const featured = data?.featured;
  return buildMeta({
    title: 'Home',
    description: featured?.shortSummary || 'Explore Ontario’s historical plaques, featured daily.',
    pathname: location.pathname,
    imageUrl: featured?.shareImage || featured?.imageUrl,
    imageAlt: featured?.title,
  });
};
