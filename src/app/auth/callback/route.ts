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
    allParams: Object.fromEntries(searchParams.entries())
  });

  if (code) {
    const cookieStore = cookies()

    // Collect cookies so we can apply them to the final response
    const collectedCookies: Array<{ name: string; value: string; options: any }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {
                // ignore
              }
              collectedCookies.push({ name, value, options })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      console.log('[Auth Callback] ✅ Session exchanged successfully:', {
        userId: data.session.user.id,
        email: data.session.user.email,
        provider: data.session.user.app_metadata.provider,
      });

      const response = NextResponse.redirect(`${origin}${next}`)
      // Apply all collected cookies to the redirect response
      collectedCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }

    const errorMsg = error?.message || 'Session exchange failed'
    console.error('[Auth Callback] ❌ Exchange error:', {
      message: errorMsg,
      status: error?.status,
      code: error?.code,
    });
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}&error_source=callback`)
  }

  // If no code, look for error parameters from Supabase redirect
  const errorName = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (errorName || errorDescription) {
    const fullError = errorDescription || errorName || 'Unknown Auth Error';
    console.error('[Auth Callback] ❌ Supabase returned error:', fullError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(fullError)}`)
  }

  // No code and no error - something went wrong
  console.error('[Auth Callback] ❌ No code or error received');
  return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
}
