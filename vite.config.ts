import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, isSsrBuild }) => ({
  plugins: [react()],
  build: isSsrBuild ? {
    // SSR build config
    ssr: true,
    outDir: 'dist/server',
    rollupOptions: {
      input: 'src/entry.server.tsx',
      output: {
        entryFileNames: 'entry.server.js',
        format: 'esm',
      },
    },
  } : {
    // Client build config
    outDir: 'dist/client',
    manifest: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  ssr: {
    target: 'webworker',
    noExternal: true,
  },
}));
