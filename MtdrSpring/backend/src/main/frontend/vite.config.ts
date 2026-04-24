import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: false,
  },
  build: {
    outDir: 'build'
  },
  test: {
    globals: true,
    environment: "jsdom",
    //setupFiles: ['./src/test/setup.ts'],
    //pool: "forks",
  },
})


/*import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    tags: [
      { name: "frontend", description: "Tesy written for frontend." },
      { name: "backend", description: "Tesy written for backend." },
      {
        name: "db",
        description: "Test for database queries",
        timeout: 60_000,
        priority: 1,
      },
    ],
  },
});
*/