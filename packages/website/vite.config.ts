import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  root: 'src',
  envDir: '../',
  publicDir: '../public',
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: '../build',
  },
  resolve: {
    alias: {
      '@storybook/jest': 'vitest',
    },
  },
});
