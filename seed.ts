// ✅ seed.ts (loads sample product data)
import fs from 'fs/promises'
import 'dotenv/config'

import type { Product } from './lib/schemas.ts'
import { supabaseServer as supabase } from './lib/supabase.ts'

// const supabase = createSupabaseBrowser(process.env.SUPABASE_URL)

async function seed() {
  const data = await fs.readFile('./public/sample-data.json', 'utf8')
  const products: Product[] = JSON.parse(data)

  const { data: dbData, error } = await supabase.from('dev_products').insert(products)

  if (error) {
    console.error('Seeding Error', error)
    return
  }

  console.log('✅ Seeded products', dbData)
}

seed()