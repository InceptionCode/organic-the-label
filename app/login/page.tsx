'use client'

import { useActionState } from "react";
import { loginAction } from "@/app/api/auth/login";
import { LoginFormSchema } from "@/lib/schemas"
import { TextField, Button } from "@/ui-components"
import { useZorm } from 'react-zorm'
import Link from "next/link";

// NOTE: Fully design login and signup page. Include error handling and error boundary.
export default function Login () {
    const zo = useZorm("login", LoginFormSchema);
    const disabled = zo.validation?.success === false;
    const [state, action, pending] = useActionState(loginAction, undefined)
    
    return (
        <main>
            <form ref={zo.ref} action={action}>
                <TextField name={zo.fields.email()} label="Email" type="email"  />
                <TextField name={zo.fields.password()} label="Password" type="password" />
                <Button disabled={disabled || pending} type="submit" kind="primary">Sign In</Button>
            </form>
            <p>Sign in with Google:</p>
            <p>Or sign in with magic link</p>
            <div>
                <p>Don&apos;t have an account? <Link href="/signup">Sign up here...</Link></p>
            </div>
        </main>
    )
}