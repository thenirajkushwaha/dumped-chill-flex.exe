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

  // 1. Refresh Session
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 2. Redirect root /admin to dashboard
  if (pathname === '/admin' || pathname === '/admin/') {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 3. If Logged In -> Redirect away from Login
  if (user && pathname.startsWith('/admin/login')) {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 4. If NOT Logged In -> Protect Admin Routes
  // (We check if it starts with /admin, but isn't the login page)
  if (!user && pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}