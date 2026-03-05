import { Card } from './Card';
import { Grid } from './Grid';

interface SkeletonPlaqueCardProps {
  key?: number;
}

function SkeletonPlaqueCard({ key }: SkeletonPlaqueCardProps) {
  return (
    <Card className="hoverable" key={key}>
      <div className="skeleton skeleton-image" style={{ marginBottom: 'var(--space-3)', aspectRatio: '16/9' }} />
      <div className="skeleton skeleton-title" style={{ marginBottom: 'var(--space-3)' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 'var(--space-3)' }} />
      <div className="skeleton skeleton-text" style={{ marginBottom: 'var(--space-4)' }} />
      <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 'var(--space-4)' }} />
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <div className="skeleton" style={{ width: '60px', height: '24px' }} />
        <div className="skeleton" style={{ width: '80px', height: '24px' }} />
        <div className="skeleton" style={{ width: '50px', height: '24px' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '40px' }} />
    </Card>
  );
}

interface SkeletonGridProps {
  count?: number;
}

export function SkeletonPlaqueGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <Grid>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPlaqueCard key={i} />
      ))}
    </Grid>
  );
}

interface SkeletonFeaturedProps {
  showImage?: boolean;
}

export function SkeletonFeaturedPlaque({ showImage = true }: SkeletonFeaturedProps) {
  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
        <div className="skeleton" style={{ width: '70%', height: '3rem', margin: '0 auto var(--space-3)' }} />
        <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0 auto' }} />
      </div>
      
      {showImage && (
        <div className="skeleton skeleton-image" style={{ marginBottom: 'var(--space-4)', maxHeight: '500px' }} />
      )}
      
      <div className="skeleton skeleton-title" style={{ marginBottom: 'var(--space-3)' }} />
      <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 'var(--space-5)' }} />
      
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: '100px', height: '40px' }} />
        <div className="skeleton" style={{ width: '60px', height: '28px' }} />
        <div className="skeleton" style={{ width: '70px', height: '28px' }} />
        <div className="skeleton" style={{ width: '50px', height: '28px' }} />
      </div>
    </Card>
  );
}

export { SkeletonPlaqueCard };
