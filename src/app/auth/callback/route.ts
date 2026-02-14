import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[Auth Callback] 🔍 Request received:', {
    hasCode: !!code,
    next,
    origin,
    fullUrl: request.url,
    allParams: Object.fromEntries(searchParams.entries())
  });

  if (code) {
    const cookieStore = cookies()
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Set on both the server-side cookie store and the client-bound response
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Official exchange pattern
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      console.log('[Auth Callback] ✅ Session exchanged successfully:', {
        userId: data.session.user.id,
        email: data.session.user.email,
        provider: data.session.user.app_metadata.provider,
        redirectTo: `${origin}${next}`
      });
      return response
    }

    console.error('[Auth Callback] ❌ Exchange error:', {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'Session exchange failed')}`)
  }

  // If no code, look for error parameters from Supabase redirect
  const errorName = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  if (errorName || errorDescription) {
    const fullError = errorDescription || errorName || 'Unknown Auth Error';
    console.error('[Auth Callback] ❌ Supabase returned error:', fullError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(fullError)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
}
