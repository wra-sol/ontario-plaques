import { Link, useLoaderData } from 'react-router';
import type { MetaFunction } from 'react-router';
import { buildMeta } from '../lib/seo';
import { fetchPlaques, type Plaque } from '../lib/plaques';
import { Card, Box, Button, Tag, Stack, Image, Text } from '../components';

// Helper function to strip common municipality prefixes
function cleanMunicipalityName(name: string | null | undefined): string {
  if (!name) return '';
  
  const prefixes = [
    'The Municipality of ', 'The Town of ', 'The City of ',
    'The Township of ', 'The Village of ', 'The County of ',
    'Municipality of ', 'Town of ', 'City of ',
    'Township of ', 'Village of ', 'County of ',
    'The District of ', 'The United Counties of ',
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
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const featuredIndex = dayOfYear % plaques.length;
  const featured = plaques[featuredIndex];
  
  return { featured, totalCount: plaques.length };
}

export default function Index() {
  const { featured, totalCount } = useLoaderData() as { featured: Plaque; totalCount: number };
  
  return (
    <Stack gap={32}>
      {/* Hero Section */}
      <Card as="section" style={{ textAlign: 'center' }}>
        <div style={{ padding: 'var(--space-6) 0' }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 6vw, 3rem)', 
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)'
          }}>
            Ontario Historical Plaques
          </h1>
          <Text size="large" color="secondary" style={{ fontSize: 'var(--text-lg)' }}>
            Yours to discover.
          </Text>
        </div>
      </Card>
      
      {/* Featured Plaque Section */}
      {featured && (
        <Card as="section" hoverable>
          <Box border bg="light" p={24} style={{ padding: 'var(--space-5)' }}>
            {/* Featured Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent)',
                color: 'var(--white)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                <span aria-hidden="true">⭐</span>
                Featured Plaque of the Day
              </div>
              <Text size="small" color="secondary">
                A new plaque featured every day
              </Text>
            </div>
            
            {/* Featured Image */}
            {featured.imageUrl && (
              <Link to={`/plaques/${featured.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Image 
                    src={featured.imageUrl} 
                    alt={featured.title}
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      maxHeight: '500px'
                    }}
                  />
                </div>
              </Link>
            )}
            
            {/* Featured Content */}
            <Stack gap={16}>
              <Link 
                to={`/plaques/${featured.id}`} 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h2 style={{ 
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
                  marginBottom: 'var(--space-2)', 
                  color: 'var(--accent)',
                  lineHeight: 1.3
                }}>
                  {featured.title}
                </h2>
              </Link>
              
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 'var(--text-base)',
                marginBottom: 'var(--space-3)'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {cleanMunicipalityName(featured.municipality)}
                </strong>
                {featured.year && (
                  <span> • Established {featured.year}</span>
                )}
              </p>
              
              {featured.plaqueText && (
                <p style={{ 
                  lineHeight: 1.8, 
                  fontSize: 'var(--text-base)', 
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)'
                }}>
                  {featured.plaqueText}
                </p>
              )}
              
              {/* Action Area */}
              <Stack direction="row" gap={12} wrap align="center" style={{ marginTop: 'var(--space-2)' }}>
                <Button to={`/plaques/${featured.id}`}>
                  View Full Details →
                </Button>
                {featured.tags && featured.tags.length > 0 && (
                  <Stack direction="row" gap={8} wrap>
                    {featured.tags.slice(0, 4).map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    {featured.tags.length > 4 && (
                      <Text size="small" color="secondary" style={{ padding: 'var(--space-1) 0' }}>
                        +{featured.tags.length - 4} more
                      </Text>
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>
        </Card>
      )}
      
      {/* Browse CTA */}
      <Card as="section" style={{ textAlign: 'center' }}>
        <div style={{ padding: 'var(--space-6) var(--space-4)' }}>
          <h3 style={{ 
            fontSize: 'var(--text-xl)', 
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)'
          }}>
            Explore Ontario's History
          </h3>
          <Text size="base" color="secondary" style={{ marginBottom: 'var(--space-5)', maxWidth: '500px', margin: '0 auto var(--space-5)' }}>
            Browse our collection of {totalCount} historical plaques from across the province. 
            Search by location, topic, or time period.
          </Text>
          <Button to="/plaques" style={{ fontSize: 'var(--text-base)', padding: 'var(--space-4) var(--space-6)' }}>
            Browse All {totalCount} Plaques →
          </Button>
        </div>
      </Card>
    </Stack>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const featured = data?.featured;
  return buildMeta({
    title: 'Home',
    description: featured?.shortSummary || 'Explore Ontario\'s historical plaques, featured daily.',
    pathname: location.pathname,
    imageUrl: featured?.shareImage || featured?.imageUrl,
    imageAlt: featured?.title,
  });
};
