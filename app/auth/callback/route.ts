import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get("next") ?? "/dashboard"
  const safeNext = next.startsWith("/") ? next : "/dashboard"
  const redirect = new URL("/api/auth/azure/login", origin)
  redirect.searchParams.set("next", safeNext)

  return NextResponse.redirect(redirect)
}
