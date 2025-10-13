// @ts-ignore - build output is not typed
import * as build from "./build/server/index.js";
import { createRequestHandler as createReactRouterRequestHandler } from "react-router";

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Try to serve static assets from ASSETS binding first
      if (
        url.pathname.startsWith("/assets/") ||
        url.pathname.startsWith("/images/") ||
        url.pathname.startsWith("/data/") ||
        url.pathname === "/favicon.svg" ||
        url.pathname.endsWith(".webp") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".gif")
      ) {
        const asset = await env.ASSETS.fetch(request);
        if (asset.status < 400) {
          return asset;
        }
        // If asset not found (404), fall through to SSR
      }

      // Handle all other requests via SSR using React Router's request handler
      const loadContext = {
        env,
        ctx,
      };
      
      // Create the React Router request handler with the server build
      const handler = createReactRouterRequestHandler(
        build,
        process.env.NODE_ENV
      );
      
      return await handler(request, loadContext);
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  },
} satisfies ExportedHandler<Env>;

