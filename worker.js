import { render } from './server/entry.server.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Serve static assets
    if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/data/') || url.pathname.startsWith('/images/')) {
      return env.ASSETS.fetch(request);
    }
    
    // Handle all other requests with SSR (including POST /theme)
    try {
      const html = await render(request);
      
      // If render returned a Response (redirect from action), return it
      if (html instanceof Response) {
        return html;
      }
      
      return new Response('<!DOCTYPE html>' + html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    } catch (error) {
      // If render threw a Response (redirect), return it
      if (error instanceof Response) {
        return error;
      }
      
      console.error('SSR Error:', error);
      
      // Fallback to serving the static index.html
      return env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
    }
  },
};
