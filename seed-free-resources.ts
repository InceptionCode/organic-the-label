/**
 * seed-free-resources.ts
 *
 * Inserts the "starter-kit" free resource row into the free_resources table.
 *
 * Usage:
 *   Dev:  NODE_ENV=development ts-node seed-free-resources.ts
 *   Prod: NODE_ENV=production  ts-node seed-free-resources.ts
 *
 * Or via pnpm scripts (see package.json):
 *   pnpm seed:free-resources:dev
 *   pnpm seed:free-resources:prod
 */

import { existsSync } from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Pick env file based on NODE_ENV
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
    slug: 'starter-kit',
    name: 'Organic Sonics Starter Kit',
    description:
      'A curated collection of drums, one-shots, and samples to get you started.',
    // ⚠️  Replace with the real download URL before running against production.
    // This should be a direct link (Google Drive, Dropbox, S3, etc.) that can
    // be emailed to subscribers without requiring a login.
    download_url: 'https://drive.google.com/drive/folders/1BKu5IKQwHeEUTXs-JBwvxLfhamXSVjuT?usp=drive_link',
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
