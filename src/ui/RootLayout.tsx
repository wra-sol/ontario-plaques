import { NavLink, Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/">
            ONTARIO <strong>PLAQUES</strong>
          </a>
          <nav className="nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/plaques">Plaques</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="footer">
        <div className="container small">© Ontario Historical Plaques</div>
      </footer>
    </div>
  );
}
