// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* 1️⃣ /admin → /admin/dashboard */
if (
  pathname === "/admin" ||
  pathname === "/admin/"
) {
  return NextResponse.redirect(
    new URL("/admin/dashboard", req.url)
  );
}

  const isLoginRoute = pathname.startsWith("/admin/login");

  /* 2️⃣ logged-in user should never see login */
  if (user && isLoginRoute) {
    return NextResponse.redirect(
      new URL("/admin/dashboard", req.url)
    );
  }

  /* 3️⃣ protect admin routes */
  if (!user && !isLoginRoute) {
    return NextResponse.redirect(
      new URL("/admin/login", req.url)
    );
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
