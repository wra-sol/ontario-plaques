import { hydrateRoot, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { createClientRouter, RouterProvider } from 'react-router/dom';
import routes from 'virtual:react-router/routes';

// React Router v7 client entry
const router = createClientRouter({ routes });

const container = document.documentElement;
const render = container.hasChildNodes() ? hydrateRoot : (container as any) && createRoot;

// hydrate the whole document via RSC entry
if (render === hydrateRoot) {
  hydrateRoot(container, (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  ));
} else {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
