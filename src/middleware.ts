import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This is the critical line: getUser() refreshes the session if it's expired
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 1. Handle base /admin path
  if (pathname === '/admin' || pathname === '/admin/') {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 2. Redirect logged-in users away from login page
  if (user && pathname.startsWith('/admin/login')) {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. Protect admin routes from unauthenticated users
  if (!user && !pathname.startsWith('/admin/login')) {
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths starting with /admin
     * but exclude static files (images, favicon, etc.)
     */
    '/admin/:path*',
  ],
}