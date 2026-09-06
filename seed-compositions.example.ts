/**
 * seed-compositions.example.ts
 *
 * Template for seeding the `compositions` table used by /composition.
 * This file is safe to commit. Do not put real CDN URLs or media permalinks here.
 *
 * ---------------------------------------------------------------------------
 * How to seed
 * ---------------------------------------------------------------------------
 * 1. Copy this template to a local (gitignored) file:
 *      cp seed-compositions.example.ts seed-compositions.ts
 *
 * 2. Replace every placeholder in COMPOSITIONS:
 *    - slug: unique key used for upserts (onConflict: 'slug')
 *    - title / description / bpm / musical_key / tags
 *    - platform: 'instagram' | 'youtube'
 *    - embed_url: real Instagram permalink or YouTube Short URL
 *    - posted_at: ISO-8601 timestamp
 *    - audio_file_url / terms_file_url: Shopify Files CDN URLs
 *      (Shopify admin → Content → Files)
 *    - audio_file_name: filename shown to the downloader
 *    - active: false to insert without publishing on /composition
 *
 * 3. Ensure env vars exist in `.env.development` or `.env.production`:
 *      SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *      SUPABASE_SERVICE_ROLE_KEY
 *
 * 4. Run against the matching environment:
 *      Dev:  pnpm seed:compositions:dev
 *      Prod: pnpm seed:compositions:prod
 *
 *    Or:
 *      NODE_ENV=development ts-node seed-compositions.ts
 *      NODE_ENV=production  ts-node seed-compositions.ts
 *
 * The script upserts by slug, so re-running updates the same row instead of
 * duplicating it. Never commit seed-compositions.ts.
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

const COMPOSITIONS = [
  {
    slug: 'your-composition-slug',
    title: 'Your Composition Title',
    description: 'Short description of the loop or texture.',
    bpm: 120,
    musical_key: 'C minor',
    tags: ['tag-one', 'tag-two'],
    platform: 'instagram',
    embed_url: 'https://www.instagram.com/p/YOUR_POST_ID/',
    posted_at: '2026-01-01T12:00:00.000Z',
    audio_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/your-audio.wav',
    terms_file_url: 'https://cdn.shopify.com/s/files/1/0000/0000/files/your-terms.txt',
    audio_file_name: 'Your Composition Title.wav',
    active: true,
  },
]

async function seed() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log(`\n🌱 Seeding compositions into ${isProd ? 'PRODUCTION' : 'DEV'} Supabase...`)
  console.log(`   URL: ${supabaseUrl}\n`)

  for (const composition of COMPOSITIONS) {
    const { data, error } = await supabase
      .from('compositions')
      .upsert(composition, { onConflict: 'slug' })
      .select('id, slug, title, platform, active')
      .single()

    if (error) {
      console.error(`❌ Failed to upsert "${composition.slug}":`, error.message)
    } else {
      console.log(`✅ Upserted: ${data.slug} (id: ${data.id})`)
      console.log(`   Title:    ${data.title}`)
      console.log(`   Platform: ${data.platform}`)
      console.log(`   Active:   ${data.active}`)
    }
  }

  console.log('\n✅ Done.')
}

seed()
