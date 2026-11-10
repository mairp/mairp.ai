// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mairp.ai',
  trailingSlash: 'always',
  output: 'static',
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes('/404') })],
  build: {
    format: 'directory',
    // Keep every style and script in its own file so the CSP needs no 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  // One small stylesheet for the whole site: a single render-blocking request.
  vite: {
    build: {
      assetsInlineLimit: 0,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          // Isolate the 3D vendor graph (three + r3f/drei/postprocessing) from island
          // app code so shader/app edits don't invalidate the long-cached three chunk.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/(three|three-stdlib|maath|meshline|troika[^/]*|@react-three\/(fiber|drei))\//.test(id)) return 'three';
            return undefined;
          },
        },
      },
    },
  },
});
