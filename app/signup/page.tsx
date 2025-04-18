'use client'

import { useActionState } from "react";
import { signupAction } from "@/app/api/auth/signup";
import { LoginFormSchema } from "@/lib/schemas"
import { TextField, Button } from "@/ui-components"
import { useZorm } from 'react-zorm'
import Link from "next/link";
// NOTE: Fully design login and signup page. Include error handling and error boundary.
export default function SignUp () {
    const zo = useZorm("signup", LoginFormSchema);
    const disabled = zo.validation?.success === false;
    const [state, action, pending] = useActionState(signupAction, undefined)
    
    return (
        <main>
            <form ref={zo.ref} action={action}>
                <TextField name={zo.fields.username()} label="Username" type="text"  />
                <TextField name={zo.fields.email()} label="Email" type="email"  />
                <TextField name={zo.fields.password()} label="Password" type="password" />
                <Button disabled={disabled || pending} type="submit" kind="primary">Sign Up</Button>
            </form>
            <div>
                <p>Have an account? <Link href="/login">Sign in here...</Link></p>
            </div>
        </main>
    )
}