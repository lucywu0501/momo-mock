import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the site under /<repo>/; CI sets VITE_BASE accordingly.
// Local dev and plain `npm run build` keep the default root base.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom', globals: true, setupFiles: './src/test-setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
