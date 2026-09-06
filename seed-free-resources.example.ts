/**
 * seed-free-resources.example.ts
 *
 * Template for seeding the `free_resources` table. This file is safe to commit.
 * Do not put real download URLs or production data here.
 *
 * ---------------------------------------------------------------------------
 * How to seed
 * ---------------------------------------------------------------------------
 * 1. Copy this template to a local (gitignored) file:
 *      cp seed-free-resources.example.ts seed-free-resources.ts
 *
 * 2. Fill in real values in FREE_RESOURCES below:
 *    - slug: unique key used for upserts (onConflict: 'slug')
 *    - name / description: shown to subscribers
 *    - download_url: a direct link (Google Drive, Dropbox, S3, etc.) that can
 *      be emailed without requiring a login. Replace the placeholder before
 *      running against production.
 *    - active: false to insert a row without exposing it yet
 *
 * 3. Ensure env vars exist in `.env.development` or `.env.production`:
 *      SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *      SUPABASE_SERVICE_ROLE_KEY
 *
 * 4. Run against the matching environment:
 *      Dev:  pnpm seed:free-resources:dev
 *      Prod: pnpm seed:free-resources:prod
 *
 *    Or:
 *      NODE_ENV=development ts-node seed-free-resources.ts
 *      NODE_ENV=production  ts-node seed-free-resources.ts
 *
 * The script upserts by slug, so re-running updates the same row instead of
 * duplicating it. Never commit seed-free-resources.ts.
 */

import { existsSync } from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'

const isProd = process.env.NODE_ENV === 'production'
const envFile = isProd ? '.env.production' : '.env.development'
const envPath = resolve(process.cwd(), envFile)

if (existsSync(envPath)) {
  config({ path: envPath })
  console.log(`✅ Loaded environment from ${envFile}`)
} else {
  console.warn(`⚠️  ${envFile} not found — falling back to process.env`)
}

import { createClient } from '@supabase/supabase-js'

const FREE_RESOURCES = [
  {
    slug: 'your-resource-slug',
    name: 'Your Resource Name',
    description: 'Short description of what the download includes.',
    download_url: 'https://example.com/your-direct-download-link',
    active: true,
  },
]

async function seed() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:')
    console.error(
      '   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL:',
      supabaseUrl ? '✅' : '❌'
    )
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log(`\n🌱 Seeding free_resources into ${isProd ? 'PRODUCTION' : 'DEV'} Supabase...`)
  console.log(`   URL: ${supabaseUrl}\n`)

  for (const resource of FREE_RESOURCES) {
    const { data, error } = await supabase
      .from('free_resources')
      .upsert(resource, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error(`❌ Failed to upsert "${resource.slug}":`, error.message)
    } else {
      console.log(`✅ Upserted: ${data.slug} (id: ${data.id})`)
      console.log(`   Name:         ${data.name}`)
      console.log(`   Download URL: ${data.download_url}`)
      console.log(`   Active:       ${data.active}`)
    }
  }

  console.log('\n✅ Done.')
}

seed()
