'use server'

import { SigninFormSchema, SignupFormSchema } from "@/lib/schemas"
import { parseForm } from "react-zorm"
import { createSupabaseServerClient } from "@/lib/supabase/server-base"
import { redirect } from "next/navigation"

export const signinAction = async (_: unknown, formData: FormData) => {
    const supabase = await createSupabaseServerClient()

    console.info('instantiated supabase client')

    try {
        const { email, password } = parseForm(SigninFormSchema, formData)

        console.info('parsed user form data')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            console.error(error)

            return {
                ok: false,
                error: { message: 'Signin error', error: error.message }
            }
        }
    } catch (e) {
        console.error(e)

        return {
            ok: false,
            error: { message: 'Signin error', error: e }
        }
    }

    redirect('/account')
}

export const signupAction = async (_: unknown, formData: FormData) => {
    const supabase = await createSupabaseServerClient()

    console.info('instantiated supabase client')

    try {
        const { username, email, password } = parseForm(SignupFormSchema, formData)

        console.info('parsed user form data')

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        })

        if (error) {
            console.error(error)

            return {
                ok: false,
                error: { message: 'Signup error', error: error.message }
            }
        }
    } catch (e) {
        console.error(e)

        return {
            ok: false,
            error: { message: 'Signup error', error: e }
        }
    }

    redirect('/account')
}