import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      // Use relative base so assets resolve on GitHub Pages project sites.
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) {
                return undefined;
              }

              if (id.includes('/react/') || id.includes('/react-dom/')) {
                return 'react-vendor';
              }

              if (
                id.includes('/react-markdown/') ||
                id.includes('/remark-gfm/') ||
                id.includes('/rehype-raw/') ||
                id.includes('/unified/') ||
                id.includes('/remark-parse/')
              ) {
                return 'markdown-vendor';
              }

              if (
                id.includes('/react-syntax-highlighter/') ||
                id.includes('/prismjs/') ||
                id.includes('/refractor/')
              ) {
                return 'syntax-vendor';
              }

              if (id.includes('/lucide-react/')) {
                return 'icons-vendor';
              }

              return undefined;
            },
          },
        },
      },
    };
});
