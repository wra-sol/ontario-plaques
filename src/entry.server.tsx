import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import Root, { loader as rootLoader, Layout } from '../app/root';
import Index, { loader as indexLoader } from '../app/routes/_index';
import Plaques, { loader as plaquesLoader } from '../app/routes/plaques';
import PlaqueDetail, { loader as plaqueLoader } from '../app/routes/plaques.$id';
import About from '../app/routes/about';
import { action as themeAction } from '../app/routes/theme';

const routes = [
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
];

export async function render(request: Request) {
  const { query, dataRoutes } = createStaticHandler(routes);
  
  const context = await query(request);
  
  if (context instanceof Response) {
    throw context;
  }
  
  const router = createStaticRouter(dataRoutes, context);
  
  const html = renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>
  );
  
  return html;
}

