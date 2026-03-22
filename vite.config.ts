import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'node-fetch': path.resolve(__dirname, './fetch-polyfill.js'),
          'cross-fetch': path.resolve(__dirname, './fetch-polyfill.js'),
          'isomorphic-fetch': path.resolve(__dirname, './fetch-polyfill.js'),
          'formdata-polyfill': path.resolve(__dirname, './empty.js'),
          'https': path.resolve(__dirname, './empty.js'),
          'http': path.resolve(__dirname, './empty.js'),
          'zlib': path.resolve(__dirname, './empty.js'),
          'stream': path.resolve(__dirname, './empty.js'),
          'buffer': path.resolve(__dirname, './empty.js'),
          'crypto': path.resolve(__dirname, './empty.js'),
        }
      }
    };
});
