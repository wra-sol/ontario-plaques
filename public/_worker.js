import * as build from "../server/index.js";

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Serve static assets directly
      if (url.pathname.startsWith("/assets/") || 
          url.pathname.startsWith("/images/") ||
          url.pathname.startsWith("/data/") ||
          url.pathname === "/favicon.svg") {
        return env.ASSETS.fetch(request);
      }

      // Handle SSR requests
      const loadContext = { env, ctx };
      return await build.default.fetch(request, loadContext);
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

