import type { RouteConfigEntry } from '@react-router/dev/routes';

const routes: RouteConfigEntry[] = [
  { file: 'root.tsx' },
  { path: '/', file: 'routes/_index.tsx' },
  { path: '/plaques', file: 'routes/plaques.tsx' },
  { path: '/plaques/:id', file: 'routes/plaques.$id.tsx' },
  { path: '/about', file: 'routes/about.tsx' },
];

export default routes;
