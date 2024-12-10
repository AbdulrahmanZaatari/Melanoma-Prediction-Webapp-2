import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/static/', // Ensures the built assets are served under the '/static/' path
  build: {
    outDir: 'dist', // Output directory for the built files
    assetsDir: 'assets', // Subdirectory for static assets like JS, CSS, images
  },
  server: {
    port: 5173, // Development server port
    open: true, // Automatically opens the browser when dev server starts
  },
});
