import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    // Ensure assets use relative paths
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});