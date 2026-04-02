import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { createSupabaseServerClient } from '@/utils/supabase/server-base'
import { redirect } from 'next/navigation'
import { bootstrapAuthenticatedUser } from '@/lib/supabase/boostrap-authenticate-user'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/explore'

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient()

    const { error, data: { user } } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error || !user) {
      console.error(error)

      return NextResponse.json({
        errorMessage: 'Internal Server Error: There was an error confirming user\'s email',
        error
      }, {
        status: Number(error?.code) || 400
      })
    }
    // Prefer query-param username (legacy), fall back to user_metadata set during signUp
    const username =
      searchParams.get('username') ??
      (user.user_metadata?.username as string | undefined) ??
      null

    // verify the user and merge the anonymous visitor into the user
    console.info('verifying user and merging anonymous visitor into user', user.id)
    await bootstrapAuthenticatedUser({
      userId: user.id,
      email: user.email,
      emailVerified: !!(user.email_confirmed_at ?? user.confirmed_at),
      displayName: username
    })

    redirect(next)
  }

  console.error('Missing token_hash or type')

  return NextResponse.json({
    errorMessage: 'Internal Server Error: There was an error confirming user\'s email'
  }, {
    status: 500
  })
}