import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**', 'utils/**', 'store/**'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        // Shopify API client & GraphQL definitions — tested at E2E level, not unit
        'lib/Shopify/**',
        // Supabase DB service functions — require real Supabase client in integration
        'lib/supabase/**',
        // Supabase client factory utilities — infrastructure wiring
        'utils/supabase/**',
        // React hooks that require a rendered component tree
        'utils/hooks/**',
        // Type-only files
        'lib/filters/types.ts',
        // Store hydrator components (React components, not testable pure logic)
        'store/init-auth-store.tsx',
        'store/activity-hydrator.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
