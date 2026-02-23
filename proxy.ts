import { NextResponse, type NextRequest } from "next/server"
import { AUTH_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"
import { hasSupabaseSessionCookie } from "@/lib/auth/current-user"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const cookieToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value
  const sessionUser = cookieToken ? await verifySessionToken(cookieToken) : null
  const supabaseSession = hasSupabaseSessionCookie(request.cookies.getAll().map((cookie) => cookie.name))

  const isAuthenticated = Boolean(sessionUser || supabaseSession)

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = "/auth/sign-in"
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (pathname.startsWith("/auth") && isAuthenticated) {
    if (
      pathname !== "/auth/error" &&
      pathname !== "/auth/callback" &&
      pathname !== "/auth/sign-up-success" &&
      pathname !== "/auth/forgot-password"
    ) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = "/dashboard"
      dashboardUrl.search = ""
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
