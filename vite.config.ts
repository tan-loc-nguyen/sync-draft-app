import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import wasm from 'vite-plugin-wasm'

// Automerge ships as WebAssembly, hence the wasm plugin. Top-level await is
// supported natively by the browsers this targets, so it needs no transform.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    wasm(),
  ],
  build: {
    target: 'es2022',
  },
  worker: {
    format: 'es',
    plugins: () => [wasm()],
  },
})
