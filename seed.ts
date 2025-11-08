// ✅ seed.ts (loads sample product data)
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file explicitly (dotenv defaults to .env)
// Fallback to .env if .env.local doesn't exist
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
  console.log('✅ Loaded environment variables from .env.local')
} else if (existsSync(envPath)) {
  config({ path: envPath })
  console.log('⚠️  Loaded environment variables from .env (consider creating .env.local)')
} else {
  console.warn('⚠️  No .env.local or .env file found. Make sure environment variables are set.')
}

import type { Product } from './lib/schemas.ts'
import { createClient } from '@supabase/supabase-js'

const isDev = process.env.NODE_ENV === 'development'

async function seed() {
  // Use NEXT_PUBLIC_SUPABASE_URL if SUPABASE_URL is not set (for consistency)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
    console.error('\nPlease check your .env.local file and ensure all required variables are set.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const data = await fs.readFile('./public/sample-data.json', 'utf8')
  const products: Product[] = JSON.parse(data)
  const productTable = isDev ? 'dev_products' : 'prod_products'

  const { data: dbData, error } = await supabase.from(productTable).insert(products)

  if (error) {
    console.error('Seeding Error', error)
    return
  }

  console.log('✅ Seeded products', dbData)
}

seed()