import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router-dom';
import './styles.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Ontario Historical Plaques</title>
      </head>
      <body>
        <div className="header">
          <div className="container header-inner">
            <a className="brand" href="/">ONTARIO <strong>PLAQUES</strong></a>
            <nav className="nav">
              <a href="/">Home</a>
              <a href="/plaques">Plaques</a>
              <a href="/about">About</a>
            </nav>
          </div>
        </div>
        <main className="main">
          <div className="container">{children}</div>
        </main>
        <footer className="footer">
          <div className="container small">© Ontario Historical Plaques</div>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
