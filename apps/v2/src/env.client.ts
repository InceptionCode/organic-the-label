import { z } from 'zod'

// Public environment. Only VITE_* variables are bundled for the browser.
const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith('sb_publishable_'),
  VITE_HCAPTCHA_SITE_KEY: z.string().min(1),
})

const result = schema.safeParse(import.meta.env)
if (!result.success) {
  const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Invalid public environment: ${names}`)
}

export const clientEnv = Object.freeze(result.data)
