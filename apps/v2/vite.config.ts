import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

// Vite writes vite.config.timestamp_*.js next to the config on every hot-reload.
// This plugin sweeps them up once the dev server is ready.
function cleanConfigTimestamps() {
  return {
    name: 'clean-config-timestamps',
    configureServer(server: { config: { root: string } }) {
      return () => {
        const root = server.config.root
        try {
          readdirSync(root)
            .filter((f) => /\.(vite|app)\.config\.timestamp_\d+\.(js|mjs)$/.test(f))
            .forEach((f) => unlinkSync(join(root, f)))
        } catch {
          // non-fatal
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    cleanConfigTimestamps(),
    tanstackStart({
      srcDirectory: 'app',
      vite: {
        installDevServerMiddleware: true,
      },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
  ],
  server: {
    port: 3001,
  },
})
