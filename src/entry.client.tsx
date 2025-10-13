import { StrictMode, startTransition } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import Root, { loader as rootLoader } from '../app/root';
import Index, { loader as indexLoader } from '../app/routes/_index';
import Plaques, { loader as plaquesLoader } from '../app/routes/plaques';
import PlaqueDetail, { loader as plaqueLoader } from '../app/routes/plaques.$id';
import About from '../app/routes/about';
import { action as themeAction } from '../app/routes/theme';

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    loader: rootLoader,
    children: [
      { index: true, Component: Index, loader: indexLoader },
      { path: 'plaques', Component: Plaques, loader: plaquesLoader },
      { path: 'plaques/:id', Component: PlaqueDetail, loader: plaqueLoader },
      { path: 'about', Component: About },
      { path: 'theme', action: themeAction },
    ],
  },
]);

// Check if we're in SSR mode (production) or client-only mode (dev)
const rootElement = document.getElementById('root');

if (rootElement && rootElement.hasChildNodes()) {
  // SSR mode: hydrate the existing server-rendered content
  startTransition(() => {
    hydrateRoot(
      rootElement,
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  });
} else if (rootElement) {
  // Client-only mode (dev): render from scratch
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

