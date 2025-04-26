'use client'

import { SigninFormSchema, SignupFormSchema } from "@/lib/schemas"
import { parseForm } from "react-zorm"
import { redirect } from "next/navigation"
import { AuthError } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase/client-base"

export type LoginActionState = {
    ok: boolean;
    error: {
        message: string;
        error: AuthError | unknown | null;
    }
}

export const signinAction = async (_: unknown, formData: FormData): Promise<LoginActionState> => {
    const supabase = await createSupabaseBrowserClient()

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

export const signupAction = async (_: unknown, formData: FormData): Promise<LoginActionState> => {
    const supabase = await createSupabaseBrowserClient()

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