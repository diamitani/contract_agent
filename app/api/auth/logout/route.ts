import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth/session"

function handle(origin: string, redirectTo: string | null) {
  const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/"
  const response = NextResponse.redirect(new URL(target, origin))
  clearSessionCookie(response)
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  return handle(url.origin, url.searchParams.get("next"))
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  return handle(url.origin, url.searchParams.get("next"))
}
