import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,    proxy: {
      '/upload': 'http://express-server:3000',
      '/src/images': 'http://express-server:3000'
    }
  }
});
