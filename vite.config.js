import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173
  },
  // Los archivos en /public se copiarán automáticamente al directorio de salida
  publicDir: 'public'
});
