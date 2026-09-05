/**
 * seed-compositions.ts
 *
 * Upserts sample rows into the `compositions` table used by /composition.
 *
 * Usage:
 *   Dev:  NODE_ENV=development ts-node seed-compositions.ts
 *   Prod: NODE_ENV=production  ts-node seed-compositions.ts
 *
 * Or via pnpm scripts (see package.json):
 *   pnpm seed:compositions:dev
 *   pnpm seed:compositions:prod
 *
 * Before running against production, replace audio_file_url / terms_file_url
 * with real Shopify Files CDN URLs (Shopify admin → Content → Files) and set
 * embed_url to the real Instagram permalink or YouTube Short URL.
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
    slug: 'midnight-rhodes-loop',
    title: 'Midnight Rhodes Loop',
    description: 'Warm Rhodes chords with tape hiss and a slow vibrato. 8 bars, key-labelled.',
    bpm: 82,
    musical_key: 'F# minor',
    tags: ['melodic', 'r&b', 'vintage'],
    platform: 'instagram',
    embed_url: 'https://www.instagram.com/p/CxAmpleReelIdxxxx/',
    posted_at: '2026-08-20T15:00:00.000Z',
    audio_file_url:
      'https://cdn.shopify.com/s/files/1/0000/0000/files/midnight-rhodes-loop.wav',
    terms_file_url:
      'https://cdn.shopify.com/s/files/1/0000/0000/files/organic-sonics-terms-of-use.txt',
    audio_file_name: 'Midnight Rhodes Loop.wav',
    active: true,
  },
  {
    slug: 'grain-choir-texture',
    title: 'Grain Choir Texture',
    description: 'Granular vocal pad bounced dry. Layer under drums or pitch down an octave.',
    bpm: 140,
    musical_key: 'C minor',
    tags: ['ambient', 'dark', 'ost'],
    platform: 'youtube',
    embed_url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    posted_at: '2026-08-28T18:30:00.000Z',
    audio_file_url:
      'https://cdn.shopify.com/s/files/1/0000/0000/files/grain-choir-texture.wav',
    terms_file_url:
      'https://cdn.shopify.com/s/files/1/0000/0000/files/organic-sonics-terms-of-use.txt',
    audio_file_name: 'Grain Choir Texture.wav',
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
