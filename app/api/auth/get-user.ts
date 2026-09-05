'use server'

import { headers } from "next/headers"
import { createSupabaseServerClient } from "@/utils/supabase/server-base"
import { mapSupabaseUser } from "@/lib/supabase/map-user"
import { AUTH_USER_HEADER } from "@/lib/supabase/auth-header"
import type { AuthStoreState } from "@/lib/store"
import { AuthError } from "@supabase/supabase-js"

export type GetUserActionState = {
  user: AuthStoreState['user']
  error: AuthError | unknown | null;
}

export const getUserAction = async (): Promise<GetUserActionState> => {
  const headerList = await headers()
  const forwardedUser = headerList.get(AUTH_USER_HEADER)

  if (forwardedUser !== null) {
    if (forwardedUser === '') return { user: null, error: null }

    try {
      return { user: JSON.parse(forwardedUser), error: null }
    } catch {
      // Malformed header — fall through to a real check below.
    }
  }

  const supabase = await createSupabaseServerClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error(error)
      return { user: null, error }
    }

    return { user: mapSupabaseUser(user), error: null }

  } catch (e) {
    console.error(e)
    return {
      user: null,
      error: e
    }
  }
}