'use client'

import { SigninFormSchema, SignupFormSchema, type SigninForm, type SignupForm } from "@/lib/schemas"
import { parseWithZod } from '@conform-to/zod/v4';
import { parseSubmission } from '@conform-to/react/future';
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
        const { status, reply } = parseWithZod(formData, { schema: SigninFormSchema })
        const { payload } = parseSubmission(formData)

        if (status === 'error') {
            console.error('Submission failed: replying...')

            return {
                ok: false,
                error: { message: 'Form submission error', error: reply() }
            }
        }

        const { email, password } = payload as SigninForm

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
        const { status, reply } = parseWithZod(formData, { schema: SignupFormSchema })
        const { payload } = parseSubmission(formData)

        if (status === 'error') {
            console.error('Submission failed: replying...')

            return {
                ok: false,
                error: { message: 'Form submission error', error: reply() }
            }
        }

        console.info('parsed user form data')

        const { email, password, username } = payload as SignupForm

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