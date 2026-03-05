import { useRouteError, isRouteErrorResponse, Link } from 'react-router';
import { Card } from './Card';
import { Button } from './Button';
import { Stack } from './Stack';

export function ErrorBoundary() {
  const error = useRouteError();
  
  let status = 500;
  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while loading the page.';
  let isNotFound = false;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.statusText || 'Error';
    message = error.data?.message || error.data || `Error ${error.status}`;
    isNotFound = error.status === 404;
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Check if we're in development mode by looking for dev-specific patterns
  const isDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
      <Card as="section">
        <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
          {isNotFound ? (
            <>
              <div 
                style={{ 
                  fontSize: '6rem', 
                  fontWeight: 700, 
                  color: 'var(--accent)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-4)'
                }}
              >
                404
              </div>
              <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>
                Page Not Found
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', maxWidth: '400px', margin: '0 auto var(--space-5)' }}>
                The page you're looking for doesn't exist. It might have been moved or deleted.
              </p>
            </>
          ) : (
            <>
              <div 
                style={{ 
                  fontSize: '4rem', 
                  marginBottom: 'var(--space-4)'
                }}
                aria-hidden="true"
              >
                ⚠️
              </div>
              <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>
                {title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', maxWidth: '500px', margin: '0 auto var(--space-5)' }}>
                {message}
              </p>
              {isDev && error instanceof Error && (
                <pre 
                  style={{ 
                    textAlign: 'left',
                    background: 'var(--bg-secondary)',
                    padding: 'var(--space-4)',
                    overflow: 'auto',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-4)',
                    border: 'var(--border-base) solid var(--border-secondary)'
                  }}
                >
                  {error.stack}
                </pre>
              )}
            </>
          )}
          
          <Stack direction="row" gap={12} wrap justify="center" style={{ justifyContent: 'center' }}>
            <Button to="/">
              ← Back to Home
            </Button>
            <Button to="/plaques" variant="secondary">
              Browse Plaques
            </Button>
          </Stack>
        </div>
      </Card>
    </div>
  );
}

export function RootErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Ontario Historical Plaques</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.6;
            padding: 48px 16px;
          }
          .container { max-width: 800px; margin: 0 auto; }
          .card {
            background: white;
            border: 3px solid #1a1a1a;
            padding: 48px;
            text-align: center;
          }
          h1 { font-size: 1.5rem; margin-bottom: 16px; }
          p { color: #666; margin-bottom: 24px; }
          a {
            display: inline-block;
            background: #198f3a;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          a:hover { background: #146b2d; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <h1>Critical Error</h1>
            <p>The application failed to load. Please try refreshing the page.</p>
            <a href="/">Go to Home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
