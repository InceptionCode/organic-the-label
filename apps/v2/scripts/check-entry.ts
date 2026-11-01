/**
 * Phase 07.6 bundle check. Run after `bun run build`: `bun run check:entry`.
 *
 * Reads the client build manifest (dist/client-manifest.json, moved there by vite.config.ts), starts at the
 * chunk marked `isEntry`, walks its static `imports` recursively and sums the gzip size of every JS chunk in
 * that set: the JavaScript a first visit downloads before any route chunk. Fails when the total is over
 * budget or when a heavy library (WebGL, shaders, the Supabase client) is statically reachable from the entry.
 */
import { gzipSync } from 'node:zlib'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ManifestChunk = {
  file: string
  src?: string
  name?: string
  isEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
}

const ROOT = resolve(import.meta.dir, '..')
const MANIFEST = resolve(ROOT, 'dist/client-manifest.json')
const CLIENT_DIR = resolve(ROOT, 'dist/client')
const BUDGET_KB = 150
const FORBIDDEN = ['three', 'ogl', '@paper-design/shaders-react', '@supabase/supabase-js']

if (!existsSync(MANIFEST)) {
  console.error(`Missing ${MANIFEST}. Run \`bun run build\` first.`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, ManifestChunk>
const entries = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry)
if (entries.length !== 1) {
  console.error(`Expected exactly one isEntry chunk, found ${entries.length}.`)
  process.exit(1)
}
const [entryKey] = entries[0]

// Every manifest key whose source module lives in a forbidden package, so a chunk can be flagged by key.
const packageOf = (path: string) => {
  const match = /node_modules\/(?:\.bun\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(path)
  return match?.[1]
}

const kb = (bytes: number) => (bytes / 1024).toFixed(2).padStart(7)
const sizes = new Map<string, { raw: number; gzip: number }>()
function sizeOf(file: string) {
  let size = sizes.get(file)
  if (!size) {
    const code = readFileSync(resolve(CLIENT_DIR, file))
    size = { raw: code.byteLength, gzip: gzipSync(code, { level: 9 }).byteLength }
    sizes.set(file, size)
  }
  return size
}

const visited = new Set<string>()
const lines: string[] = []
function walk(key: string, depth: number) {
  const chunk = manifest[key]
  if (!chunk) throw new Error(`Manifest has no chunk ${key}`)
  const seen = visited.has(key)
  const { gzip } = sizeOf(chunk.file)
  lines.push(`${'  '.repeat(depth)}${chunk.file}  ${kb(gzip).trim()} KB${seen ? '  (counted above)' : ''}`)
  if (seen) return
  visited.add(key)
  for (const child of chunk.imports ?? []) walk(child, depth + 1)
}
walk(entryKey, 0)

const total = [...visited].reduce((sum, key) => sum + sizeOf(manifest[key].file).gzip, 0)

// A chunk is flagged when its own source module, or (for shared chunks) its file contents, come from a
// forbidden package. Rolldown names vendor chunks after their first module, so check both the manifest
// key and the bundled code's package markers.
const offenders: string[] = []
for (const key of visited) {
  const chunk = manifest[key]
  const pkg = packageOf(chunk.src ?? key)
  const code = readFileSync(resolve(CLIENT_DIR, chunk.file), 'utf8')
  for (const name of FORBIDDEN) {
    const inCode =
      (name === 'three' && /\bWebGLRenderer\b|REVISION\s*=\s*["']\d+/.test(code)) ||
      (name === 'ogl' && /\bclass\s+\w*\s*{[^}]*gl\.createProgram/.test(code)) ||
      (name === '@paper-design/shaders-react' && /ShaderMount|paper-design/.test(code)) ||
      (name === '@supabase/supabase-js' && /\bSupabaseClient\b|GoTrueClient|supabase-js\//.test(code))
    if (pkg === name || inCode) offenders.push(`${chunk.file} contains ${name}`)
  }
}

console.log(`Entry graph (static imports from ${manifest[entryKey].file}):\n`)
console.log(lines.join('\n'))
console.log(`\n${visited.size} chunks, ${kb(total).trim()} KB gzip (budget ${BUDGET_KB} KB)`)

const failures: string[] = []
if (total / 1024 > BUDGET_KB) failures.push(`Entry graph is ${kb(total).trim()} KB gzip, over the ${BUDGET_KB} KB budget.`)
failures.push(...offenders)
if (failures.length) {
  console.error(`\nFAIL\n${failures.map((f) => `- ${f}`).join('\n')}`)
  process.exit(1)
}
console.log('\nPASS: under budget, and no three, ogl, @paper-design/shaders-react or @supabase/supabase-js in the entry graph.')
