import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server-base'
import { redirect } from 'next/navigation'
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/account'

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.error(error)

      return NextResponse.json({
        errorMessage: 'Internal Server Error: There was an error confirming user\'s email',
        error
      }, {
        status: Number(error.code) || 400
      })
    }

    redirect(next)
  }

  console.error('Missing token_hash or type')

  return NextResponse.json({
    errorMessage: 'Internal Server Error: There was an error confirming user\'s email'
  }, {
    status: 500
  })
}