import React from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';

export default function Root() {
  return (
    <div className="app">
      <div className="header">
        <div className="container header-inner">
          <Link className="brand" to="/">ONTARIO <strong>PLAQUES</strong></Link>
          <nav className="nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/plaques">Plaques</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>
      </div>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="footer">
        <div className="container small">© Ontario Historical Plaques</div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
