import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  border?: boolean;
  className?: string;
  style?: CSSProperties;
  // Optimization options
  optimize?: boolean;
  quality?: number; // 1-100, default 85
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  // Loading state
  showSkeleton?: boolean;
}

/**
 * Optimized Image Component with Loading State
 * 
 * This component intelligently handles image loading:
 * - Shows skeleton loading state while image loads
 * - Uses local images from /images/ when available (development/local)
 * - Falls back to Cloudflare Image Resizing for optimization when online
 * - Supports various optimization parameters
 * 
 * Cloudflare Image Resizing docs:
 * https://developers.cloudflare.com/images/image-resizing/
 */
export function Image({ 
  src, 
  alt, 
  width = '100%', 
  height = 'auto',
  objectFit = 'cover',
  border = true,
  className = '',
  style = {},
  optimize = true,
  quality = 85,
  format = 'auto',
  fit = 'scale-down',
  showSkeleton = true
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const computedStyle: CSSProperties = {
    width,
    height: typeof height === 'number' ? `${height}px` : height,
    objectFit,
    opacity: isLoading ? 0 : 1,
    transition: 'opacity 250ms ease',
    ...style
  };
  
  if (border) {
    computedStyle.border = 'var(--border-thick) solid var(--border-primary)';
  }

  // Generate optimized image URL
  const optimizedSrc = getOptimizedImageSrc(src, {
    optimize,
    quality,
    format,
    fit,
    width: typeof width === 'number' ? width : undefined
  });

  // Calculate aspect ratio for skeleton
  const aspectRatio = typeof width === 'number' && typeof height === 'number' 
    ? width / height 
    : undefined;
  
  const skeletonStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    aspectRatio: aspectRatio ? String(aspectRatio) : '16/9',
  };
  
  return (
    <div style={{ position: 'relative', width, height: computedStyle.height }}>
      {showSkeleton && isLoading && (
        <div 
          className="skeleton skeleton-image" 
          style={skeletonStyle}
          aria-hidden="true"
        />
      )}
      {hasError ? (
        <div 
          style={{
            ...computedStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            minHeight: '200px',
          }}
          role="img"
          aria-label={`Failed to load: ${alt}`}
        >
          <span>Image unavailable</span>
        </div>
      ) : (
        <img 
          src={optimizedSrc} 
          alt={alt} 
          className={className}
          style={computedStyle}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

interface OptimizationOptions {
  optimize?: boolean;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  width?: number;
}

/**
 * Determines the best image source:
 * 1. Check if it's an ontarioplaques.com image that we have locally
 * 2. If local development, serve from /images/
 * 3. If production, use Cloudflare Image Resizing for optimization
 * 4. Otherwise, return original src
 */
function getOptimizedImageSrc(src: string, options: OptimizationOptions): string {
  if (!src) return src;

  // Check if this is an Ontario Plaques image that we have locally
  const isOntarioPlaqueImage = src.includes('ontarioplaques.com/Graphics/');
  
  if (isOntarioPlaqueImage) {
    // Extract filename from URL
    // e.g., "https://www.ontarioplaques.com/Graphics/Image_Algoma01.jpg" -> "Image_Algoma01.jpg"
    const filename = src.split('/Graphics/').pop();
    
    if (filename) {
      // Check if we're in development (localhost or local network)
      const isDevelopment = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname === '127.0.0.1');
      
      // Convert to WebP filename for local serving
      // e.g., "Image_Algoma01.jpg" -> "Image_Algoma01.webp"
      const webpFilename = filename.replace(/\.(jpe?g|png)$/i, '.webp');
      
      // Use local WebP images path
      const localSrc = `/images/${webpFilename}`;
      
      // In development, always use local WebP
      if (isDevelopment) {
        return localSrc;
      }
      
      // In production, use local WebP images
      // These are optimized and much smaller than the originals
      return localSrc;
    }
  }

  // If optimization is disabled or not applicable, return original
  if (!options.optimize) {
    return src;
  }

  // Check if we're on a Cloudflare-hosted domain (production)
  const isProduction = typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.startsWith('192.168.') &&
    window.location.hostname !== '127.0.0.1';

  // Only use Cloudflare Image Resizing in production for external URLs
  if (isProduction && (src.startsWith('http://') || src.startsWith('https://'))) {
    return getCloudflareOptimizedUrl(src, options);
  }

  return src;
}

/**
 * Generate Cloudflare Image Resizing URL
 * Format: /cdn-cgi/image/[options]/[source-url]
 */
function getCloudflareOptimizedUrl(src: string, options: OptimizationOptions): string {
  const params: string[] = [];
  
  if (options.width) {
    params.push(`width=${options.width}`);
  }
  
  if (options.quality) {
    params.push(`quality=${Math.min(100, Math.max(1, options.quality))}`);
  }
  
  if (options.format && options.format !== 'auto') {
    params.push(`format=${options.format}`);
  }
  
  if (options.fit) {
    params.push(`fit=${options.fit}`);
  }

  const optionsString = params.join(',');
  
  // Return Cloudflare Image Resizing URL
  return `/cdn-cgi/image/${optionsString}/${src}`;
}
