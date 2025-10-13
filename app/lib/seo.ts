import type { MetaDescriptor } from 'react-router';

export type BuildMetaInput = {
  title?: string;
  description?: string;
  pathname?: string; // may include search/hash
  type?: 'website' | 'article';
  imageUrl?: string;
  imageAlt?: string;
};

export const SITE_NAME = 'Ontario Historical Plaques';
export const DEFAULT_DESCRIPTION =
  "Discover Ontario's historical plaques: locations, stories, and photos.";
export const DEFAULT_OG_IMAGE = '/favicon.svg'; // Fallback OG image

// Set your production site URL - can be overridden with VITE_SITE_URL env var
export const SITE_URL = import.meta.env.VITE_SITE_URL as string | undefined || 
  (typeof window !== 'undefined' ? window.location.origin : undefined);

function absolutize(urlOrPath: string | undefined): string | undefined {
  if (!urlOrPath) return undefined;
  // If already absolute, return as-is
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  if (!SITE_URL) return urlOrPath; // fall back to relative if base not configured
  try {
    return new URL(urlOrPath, SITE_URL).toString();
  } catch {
    return urlOrPath;
  }
}

export function buildCanonical(pathname: string | undefined): string | undefined {
  if (!pathname) return undefined;
  return absolutize(pathname.startsWith('/') ? pathname : `/${pathname}`);
}

export function buildMeta(input: BuildMetaInput): MetaDescriptor[] {
  const titleBase = input.title ? `${input.title} | ${SITE_NAME}` : SITE_NAME;
  const description = input.description || DEFAULT_DESCRIPTION;
  const ogType = input.type || 'website';
  const canonical = buildCanonical(input.pathname || '/');
  // Use provided image, or fall back to default OG image
  const imageAbsolute = absolutize(input.imageUrl || DEFAULT_OG_IMAGE);

  const twitterCard = imageAbsolute ? 'summary_large_image' : 'summary';

  const tags: MetaDescriptor[] = [
    { title: titleBase },
    { name: 'description', content: description },
    { name: 'theme-color', content: '#0B6B3A' },
    canonical ? { tagName: 'link', rel: 'canonical', href: canonical } as MetaDescriptor : ({} as any),

    // Open Graph
    { property: 'og:title', content: titleBase },
    { property: 'og:description', content: description },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: SITE_NAME },
    canonical ? { property: 'og:url', content: canonical } : {},
    imageAbsolute ? { property: 'og:image', content: imageAbsolute } : {},
    imageAbsolute && input.imageAlt ? { property: 'og:image:alt', content: input.imageAlt } : {},

    // Twitter
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: titleBase },
    { name: 'twitter:description', content: description },
    imageAbsolute ? { name: 'twitter:image', content: imageAbsolute } : {},
  ];

  // Filter out any empty objects
  return tags.filter((t) => Object.keys(t).length > 0);
}
