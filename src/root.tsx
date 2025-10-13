import React from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Nav, Footer } from '../app/components';

export default function Root() {
  return (
    <div className="app">
      <Nav />
      <main className="main" style={{ minHeight: '90vh' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
