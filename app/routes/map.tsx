import { useLoaderData, Link } from 'react-router';
import type { MetaFunction } from 'react-router';
import { buildMeta } from '../lib/seo';
import { fetchPlaques } from '../lib/plaques';
import { PlaqueMap, Card, Stack, Text } from '../components';

export async function loader({ request, context }: { request: Request; context: any }) {
  const plaques = await fetchPlaques(request, context?.fetch);
  
  // Count plaques with coordinates
  const withCoords = plaques.filter(p => p.latitude != null && p.longitude != null);
  
  return { plaques, totalCount: plaques.length, mappedCount: withCoords.length };
}

export default function MapRoute() {
  const { plaques, totalCount, mappedCount } = useLoaderData() as { 
    plaques: any[]; 
    totalCount: number;
    mappedCount: number;
  };
  
  return (
    <Stack gap={24}>
      {/* Header */}
      <Card as="section">
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)'
          }}>
            Explore Plaques on the Map
          </h1>
          <Text size="base" color="secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Discover Ontario's historical plaques geographically. 
            {mappedCount > 0 ? (
              <>Showing <strong>{mappedCount}</strong> of {totalCount} plaques with location data.</>
            ) : (
              <>No location data available for mapping.</>
            )}
          </Text>
        </div>
      </Card>
      
      {/* Map */}
      {mappedCount > 0 ? (
        <PlaqueMap 
          plaques={plaques} 
          height="70vh"
          zoom={7}
        />
      ) : (
        <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <Text size="large" color="secondary">
            No plaques with coordinates available to display on the map.
          </Text>
          <Link 
            to="/plaques" 
            style={{ 
              display: 'inline-block', 
              marginTop: 'var(--space-4)',
              color: 'var(--accent)',
              fontWeight: 600
            }}
          >
            Browse all plaques →
          </Link>
        </Card>
      )}
      
      {/* Info */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 'var(--space-6)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'var(--text-3xl)', 
              fontWeight: 700, 
              color: 'var(--accent)' 
            }}>
              {totalCount}
            </div>
            <Text size="small" color="secondary">Total Plaques</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'var(--text-3xl)', 
              fontWeight: 700, 
              color: 'var(--accent)' 
            }}>
              {mappedCount}
            </div>
            <Text size="small" color="secondary">On Map</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'var(--text-3xl)', 
              fontWeight: 700, 
              color: mappedCount === totalCount ? 'var(--accent)' : 'var(--text-secondary)' 
            }}>
              {totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 0}%
            </div>
            <Text size="small" color="secondary">Coverage</Text>
          </div>
        </div>
      </Card>
    </Stack>
  );
}

export const meta: MetaFunction = ({ location }) => {
  return buildMeta({
    title: 'Map',
    description: 'Explore Ontario historical plaques on an interactive map. View locations across the province.',
    pathname: location.pathname,
  });
};
