export default {
  async fetch(request, env) {
    // Try to serve a static asset first
    let response = await env.ASSETS.fetch(request);

    // If not found, serve SPA index.html for client-side routes
    if (response.status === 404) {
      const accept = request.headers.get('Accept') || '';
      if (request.method === 'GET' && accept.includes('text/html')) {
        const url = new URL(request.url);
        response = await env.ASSETS.fetch(new Request(url.origin + '/index.html', request));
      }
    }

    return response;
  },
};
