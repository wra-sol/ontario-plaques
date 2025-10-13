export type Theme = 'light' | 'dark' | 'system';

const THEME_COOKIE = 'theme';

export function getTheme(request: Request): Theme {
  // Try to get from request headers (SSR / production)
  const cookieHeader = request.headers.get('Cookie');
  
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const theme = cookies[THEME_COOKIE];
    
    if (theme === 'dark' || theme === 'light' || theme === 'system') {
      return theme;
    }
  }
  
  // Fallback: try to read from document.cookie (dev mode / client-side loaders)
  if (typeof document !== 'undefined') {
    const value = document.cookie.match('(^|;)\\s*theme\\s*=\\s*([^;]+)');
    const theme = value ? value.pop() : undefined;
    
    if (theme === 'dark' || theme === 'light' || theme === 'system') {
      return theme as Theme;
    }
  }
  
  return 'system';
}

export function setThemeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
}

