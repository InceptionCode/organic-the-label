// ✅ seed.ts (loads sample product data)
import fs from 'fs/promises'
import 'dotenv/config'

import type { Product } from './lib/schemas.ts'
import { createClient } from '@supabase/supabase-js'

const isDev = process.env.NODE_ENV === 'development'

async function seed() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
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