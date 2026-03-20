'use client';

import { SigninFormSchema, SignupFormSchema, type SigninForm, type SignupForm } from "@/lib/schemas"
import { parseWithZod } from '@conform-to/zod/v4';
import { parseSubmission } from '@conform-to/react/future';

import { AuthError, EmailOtpType } from "@supabase/supabase-js"

import { createSupabaseBrowserClient } from "@/utils/supabase/client-base"

export type LoginActionState = {
    ok: boolean;
    error: {
        message: string;
        serverError: AuthError | unknown | null;
    }
}

export const signinAction = async (
    _: unknown,
    formData: FormData
): Promise<LoginActionState | object> => {
    const supabase = createSupabaseBrowserClient()

    console.info('instantiated supabase client')

    try {
        const submission = parseWithZod(formData, { schema: SigninFormSchema })
        const { payload } = parseSubmission(formData)

        if (submission.status === 'error') {
            console.error('Submission failed: replying...')
            return submission.reply()
        }

        const { email, password } = payload as SigninForm

        console.info('parsed user form data')

        const { error, data: { user } } = await supabase.auth.signInWithPassword({ email, password })

        if (error || !user) {
            console.error(error ?? 'User not found')
            return submission.reply({ formErrors: [error?.message ?? 'User not found'] })
        }
    } catch (e) {
        console.error(e)

        return {
            ok: false,
            error: { message: 'Signup error', serverError: e }
        }
    }

    return {
        ok: true,
        error: null
    } as unknown as LoginActionState
}

export const signupAction = async (
    _: unknown,
    formData: FormData
): Promise<LoginActionState | object> => {
    const supabase = createSupabaseBrowserClient()

    console.info('instantiated supabase client')

    try {
        const submission = parseWithZod(formData, { schema: SignupFormSchema })
        const { payload } = parseSubmission(formData)

        if (submission.status === 'error') {
            console.error('Submission failed: replying...')

            return submission.reply()
        }

        console.info('parsed user form data')

        const { email, password, username, captchaToken } = payload as SignupForm

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username, type: 'email' as EmailOtpType },
                captchaToken
            }
        })

        if (error) {
            console.error(error)

            return submission.reply({ formErrors: [error.message] })
        }
    } catch (e) {
        console.error(e)

        return {
            ok: false,
            error: { message: 'Signup error', serverError: e }
        }
    }

    return {
        ok: true,
        error: null
    } as unknown as LoginActionState

}

export async function signOutAction(): Promise<{ ok: boolean; error?: string }> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Sign out failed', error);
        return { ok: false, error: error.message };
    }

    return { ok: true };
}
