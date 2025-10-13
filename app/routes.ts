import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("plaques", "routes/plaques.tsx"),
  route("plaques/:id", "routes/plaques.$id.tsx"),
  route("about", "routes/about.tsx"),
  route("theme", "routes/theme.tsx"),
] satisfies RouteConfig;
