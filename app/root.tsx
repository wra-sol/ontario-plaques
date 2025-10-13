import React from 'react';
import { 
  Links, 
  Meta, 
  Outlet, 
  Scripts, 
  ScrollRestoration, 
  useLoaderData 
} from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { Nav, Footer } from './components';
import { getTheme, type Theme } from './lib/theme';
import './styles.css';

export async function loader({ request }: LoaderFunctionArgs) {
  const theme = getTheme(request);
  return { theme };
}

function ThemeScript() {
  // This script runs immediately and blocks rendering to prevent flash
  // It reads directly from cookies (not from server data) for Cloudflare compatibility
  const script = `
    (function() {
      // Disable transitions during initial load to prevent flash
      document.documentElement.classList.add('no-transitions');
      
      // Read theme directly from cookie
      const match = document.cookie.match('(^|;)\\\\s*theme\\\\s*=\\\\s*([^;]+)');
      const theme = match ? match[2] : 'system';
      
      // Validate theme value
      const validTheme = (theme === 'light' || theme === 'dark' || theme === 'system') ? theme : 'system';
      
      let resolvedTheme = validTheme;
      
      if (validTheme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      
      // Re-enable transitions after a brief delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('no-transitions');
        });
      });
      
      // Listen for system theme changes if in system mode
      if (validTheme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateSystemTheme = () => {
          const systemTheme = mediaQuery.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', systemTheme);
        };
        
        // Modern browsers
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', updateSystemTheme);
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(updateSystemTheme);
        }
      }
    })();
  `;
  
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<{ theme: Theme }>();
  
  // Resolve theme for SSR - if system, we can't know on server, so use light as default
  // The client script will immediately fix this on load
  const ssrTheme = data.theme === 'system' ? 'light' : data.theme;
  
  return (
    <html lang="en" data-theme={ssrTheme} className="no-transitions">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ontario Historical Plaques</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Meta />
        <style dangerouslySetInnerHTML={{ __html: `
          .no-transitions,
          .no-transitions *,
          .no-transitions *::before,
          .no-transitions *::after {
            transition: none !important;
            animation: none !important;
          }
        ` }} />
        <ThemeScript />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const { theme } = useLoaderData<{ theme: Theme }>();
  
  return (
    <div className="app">
      <Nav theme={theme} />
      <main className="main" style={{ minHeight: '90vh' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

