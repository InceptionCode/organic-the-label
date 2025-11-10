type FetchSupabaseProps = {
  query: string
  cacheOptions?: {
    cache?: 'no-store' | 'force-cache' | 'only-if-cached'
    next?: {
      revalidate?: number
      tags?: string[]
    }
  }
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
}

const fetchSupabase = async ({ query, method = 'GET', body, cacheOptions }: FetchSupabaseProps) => {
  return fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL!}/rest/v1/${query}`, {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    method,
    body,
    ...(cacheOptions ? cacheOptions : {})
  })
}