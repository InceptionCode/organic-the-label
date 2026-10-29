import { renameSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// The client build manifest feeds scripts/check-entry.ts (phase 07.6). Vite writes it inside the public
// assets folder (dist/client/.vite), which Nitro copies to the static output, so move it next to that
// folder (dist/client-manifest.json) before Nitro runs: it is never deployed.
function moveClientManifest(): Plugin {
  return {
    name: 'organic:move-client-manifest',
    apply: 'build',
    applyToEnvironment: (environment) => environment.name === 'client',
    writeBundle(options) {
      if (!options.dir) return
      renameSync(resolve(options.dir, '.vite/manifest.json'), resolve(options.dir, '../client-manifest.json'))
      rmdirSync(resolve(options.dir, '.vite'))
    },
  }
}

export default defineConfig({
  plugins: [
    // tanstackStart must come before the React plugin.
    tanstackStart({ srcDirectory: 'src' }),
    // Stable Nitro v2 engine (Nitro v3 is still beta); writes .vercel/output on build.
    nitroV2Plugin({ preset: 'vercel', compatibilityDate: '2026-10-18' }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    moveClientManifest(),
  ],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Tailwind runs through @tailwindcss/vite. An inline (empty) PostCSS config stops Vite from
  // walking up to v1's root postcss.config.mjs, which breaks the v2 build.
  css: { postcss: {} },
  environments: {
    client: {
      build: {
        manifest: true,
        rolldownOptions: {
          output: {
            // Everything the entry statically imports goes into one chunk instead of ~25 tiny shared ones:
            // the same modules, fewer requests and better gzip (phase 07.6 budget). Lazy chunks are unchanged.
            codeSplitting: { groups: [{ name: 'initial', tags: ['$initial'] }] },
          },
        },
      },
    },
  },
  server: { port: 3001, strictPort: true },
})
