import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
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

  // IMPORTANT: Do NOT use getSession() here.
  // getUser() sends a request to the Supabase Auth server every time to revalidate.
  // getSession() reads from the local cookie and is not secure for middleware.
  const { data: { user } } = await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Only run middleware on routes that need auth session refresh
    // /api/* 제외 — API 라우트는 자체적으로 인증 처리하므로 미들웨어 불필요
    '/mypage/:path*',
    '/project/upload/:path*',
    '/project/edit/:path*',
    '/review/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
}
