import { render } from './server/entry.server.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve static assets directly from Pages storage
    if (
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/data/') ||
      url.pathname.startsWith('/images/')
    ) {
      return env.ASSETS.fetch(request);
    }

    try {
      // Expose origin to SSR for absolute asset fetches (e.g., JSON dataset)
      // eslint-disable-next-line no-undef
      globalThis.__ORIGIN__ = url.origin;

      // Perform SSR to get the app HTML to inject
      const appHtml = await render(request);

      if (appHtml instanceof Response) {
        // Allow loaders/actions to short-circuit with a Response
        return appHtml;
      }

      // Load built index.html (contains correct asset and CSS links)
      const indexResponse = await env.ASSETS.fetch(
        new Request(url.origin + '/index.html', request)
      );

      // If we can't load the template, return SSR result as a minimal HTML document
      if (!indexResponse.ok) {
        return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><div id="root">' + appHtml + '</div></body></html>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const templateHtml = await indexResponse.text();

      // Inject SSR HTML into #root
      const injectedHtml = templateHtml.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      return new Response(injectedHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      // Log and fall back to static SPA index (client will handle routing)
      console.error('SSR Error:', error);
      return env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
    }
  },
};
