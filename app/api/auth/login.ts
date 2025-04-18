'use server'

import { LoginFormSchema } from "@/lib/schemas"
import { parseForm } from "react-zorm"
import { createSupabaseServerClient } from "@/lib/supabase"
// NOTE: Make sure errors are properly handled and passed to the client.
  export const loginAction = async (_, formData: FormData) => {
    const supabase = await createSupabaseServerClient()

    try {
        const { email, password } = parseForm(LoginFormSchema, formData)
        const { data: response, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) return new Response(JSON.stringify({ error }), { status: 401 })
        // TODO: redirect to the user's account page.
        return new Response(JSON.stringify({ session: response.session }), { status: 200 })

    } catch (e) {
        return {
            errors: e
        }
    }
}