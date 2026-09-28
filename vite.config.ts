import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const ui = (path: string) => fileURLToPath(new URL(`./vendor/ui/src/${path}`, import.meta.url));

// `vite build --mode artifact` makes one self-contained HTML page (inlined by
// scripts/build-artifact.mjs) for sharing as a claude.ai Artifact.
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site from /<repo>/; the workflow sets BASE_PATH.
  base: mode === 'artifact' ? './' : (process.env.BASE_PATH ?? '/'),
  plugins: [react(), tailwindcss()],
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', assetsInlineLimit: 1e8, cssCodeSplit: false, chunkSizeWarningLimit: 1e4 }
      : {
          rollupOptions: {
            output: {
              // Keep third-party code in its own long-cached chunk.
              manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
            },
          },
        },
  resolve: {
    // @repo/ui is vendored from the design system (see vendor/ui/UPSTREAM.md).
    alias: [
      { find: /^@repo\/ui\/styles\/(.*)$/, replacement: ui('styles/$1') },
      { find: /^@repo\/ui$/, replacement: ui('index.ts') },
    ],
  },
}));
