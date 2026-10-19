import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    // tanstackStart must come before the React plugin.
    tanstackStart({ srcDirectory: 'src' }),
    // Stable Nitro v2 engine (Nitro v3 is still beta); writes .vercel/output on build.
    nitroV2Plugin({ preset: 'vercel', compatibilityDate: '2026-10-18' }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 3001, strictPort: true },
})
