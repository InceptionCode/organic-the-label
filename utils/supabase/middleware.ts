import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// NOTE: Add logger for server operations
// NOTE: Set Roles and Policies for tables and general access on supabase.
// NOTE: Add recaptcha confirm for NEW anon users. Confirmed anon users should almost never see recaptcha again.

export const privateRoutes: string[] = []

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  // @ts-expect-error the function itself is not deprecated just a particular usage within the options.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: []) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    try {
      const { error } = await supabase.auth.signInAnonymously()

      if (error) {
        console.error(error)
        return NextResponse.json({
          ok: false,
          message: 'Failed to authenticate user',
          error
        }, { status: 401 })
      }

    } catch (e) {
      console.error(e)
      return NextResponse.json({
        ok: false,
        message: 'Failed to authenticate user',
        error: e
      }, { status: 401 })
    }
  }
  // NOTE: Revisit redirect and authorization logic when membership becomes a thing.
  if (privateRoutes.includes(request.nextUrl.pathname) && user?.is_anonymous) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'

    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}