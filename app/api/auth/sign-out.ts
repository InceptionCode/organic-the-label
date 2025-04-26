'use client'

import { createSupabaseBrowserClient } from "@/lib/supabase/client-base"
import { AuthError } from "@supabase/supabase-js"
import { redirect } from "next/navigation";

export type SignoutActionState = {
  error?: AuthError | unknown | null;
} | void

export const signOutAction = async (): Promise<SignoutActionState> => {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    return { error }
  }

  redirect('/')
}