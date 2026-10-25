import { getCookies, setCookie, setResponseHeader } from '@tanstack/react-start/server'
import type { CookieAdapter } from '~/server/supabase/server'

export function tanstackCookieAdapter(): CookieAdapter {
  return {
    getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
    setAll: (list, headers) => {
      for (const { name, value, options } of list) setCookie(name, value, options)
      for (const [name, value] of Object.entries(headers ?? {})) setResponseHeader(name, value)
    },
  }
}
