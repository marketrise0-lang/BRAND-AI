import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(),
        nodePolyfills({
          protocolImports: true,
          globals: {
            global: false,
          }
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'global': 'window.global',
      },
      optimizeDeps: {
        exclude: ['node-fetch', 'formdata-polyfill']
      },
      resolve: {
        alias: [
          { find: '@', replacement: path.resolve(__dirname, '.') },
          { find: 'node-fetch', replacement: path.resolve(__dirname, './fetch-polyfill.js') },
          { find: 'cross-fetch', replacement: path.resolve(__dirname, './fetch-polyfill.js') },
          { find: 'isomorphic-fetch', replacement: path.resolve(__dirname, './fetch-polyfill.js') },
          { find: 'whatwg-fetch', replacement: path.resolve(__dirname, './fetch-polyfill.js') },
          { find: /^formdata-polyfill(\/.*)?$/, replacement: path.resolve(__dirname, './formdata-polyfill-mock.js') },
        ]
      }
    };
});
