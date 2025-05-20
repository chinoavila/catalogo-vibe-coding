import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,    proxy: {
      '/upload': 'http://localhost:3000',
      '/src/images': 'http://localhost:3000'
    }
  }
});
