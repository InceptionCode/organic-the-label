import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from './server'
import { mapSupabaseUser, type User } from './map-user'

// Returns the current user, creating an anonymous session on first visit if
// anonymous sign-in is enabled on the Supabase project. Returns null when the
// project has anonymous auth disabled or when sign-in fails.
export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<User | null> => {
    const supabase = createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return mapSupabaseUser(user)
    }

    const { data, error } = await supabase.auth.signInAnonymously()

    if (error || !data.user) {
      return null
    }

    return mapSupabaseUser(data.user)
  },
)
