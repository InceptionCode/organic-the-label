'use server'

import { createSupabaseServerClient } from "@/lib/supabase/server-base"
import type { AuthStoreState } from "@/lib/store"
import { AuthError } from "@supabase/supabase-js"

export type GetUserActionState = {
  user: AuthStoreState['user']
  error: AuthError | unknown | null;
}

export const getUserAction = async (): Promise<GetUserActionState> => {
  const supabase = await createSupabaseServerClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error(error)
      return { user: null, error }
    }

    return {
      user: {
        username: user.user_metadata.username || user.email!,
        isAnon: user.is_anonymous!,
        created_at: user.created_at,
        confirmed_at: user.confirmed_at ?? '',
        updated_at: user.updated_at,
        last_signed_in: user.last_sign_in_at
      },
      error: null
    }

  } catch (e) {
    console.error(e)
    return {
      user: null,
      error: e
    }
  }
}