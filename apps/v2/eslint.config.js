// v2-only ESLint flat config. Scope: React hooks rules (including the React Compiler-powered rules)
// plus the TypeScript parser. No stylistic rules. v1 keeps its own config at the repo root.
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist/**',
    '.output/**',
    '.vercel/**',
    '.nitro/**',
    '.tanstack/**',
    'node_modules/**',
    'src/routeTree.gen.ts',
    'tests/**',
  ]),
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: { parser: tseslint.parser },
    // Stale inline disables fail the run.
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    extends: [reactHooks.configs.flat['recommended-latest']],
  },
])
