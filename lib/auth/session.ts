import { SignJWT, jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { AuthUser } from "@/lib/auth/types"

export const AUTH_SESSION_COOKIE = "ca_session"
export const AUTH_STATE_COOKIE = "ca_oauth_state"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getSessionSecret() {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-only-change-auth-session-secret" : undefined)

  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET")
  }

  return new TextEncoder().encode(secret)
}

export async function createSessionToken(user: AuthUser, ttlSeconds = SESSION_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000)

  return await new SignJWT({
    sub: user.id,
    email: user.email || undefined,
    name: user.name || undefined,
    provider: user.provider,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .setSubject(user.id)
    .sign(getSessionSecret())
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret())

    if (!payload.sub) {
      return null
    }

    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
      provider: payload.provider === "azure" ? "azure" : "supabase",
    }
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export function setOAuthStateCookie(response: NextResponse, value: string) {
  response.cookies.set(AUTH_STATE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(AUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value
  if (!token) return null
  return await verifySessionToken(token)
}
