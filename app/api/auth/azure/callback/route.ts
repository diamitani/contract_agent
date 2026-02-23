import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { clearOAuthStateCookie, createSessionToken, setSessionCookie, AUTH_STATE_COOKIE } from "@/lib/auth/session"
import { exchangeCodeForTokens, verifyIdToken } from "@/lib/azure/oidc"
import { ensureUserProfile, isCosmosConfigured, upsertUserProfile } from "@/lib/cosmos/store"
import { APP_ID } from "@/lib/constants"

function decodeStateCookie(raw: string | undefined | null) {
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      state: string
      nonce: string
      next: string
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL("/auth/error", url.origin))
  }

  const cookieStore = await cookies()
  const storedStateRaw = cookieStore.get(AUTH_STATE_COOKIE)?.value
  const storedState = decodeStateCookie(storedStateRaw)

  if (!storedState || storedState.state !== state) {
    return NextResponse.redirect(new URL("/auth/error", url.origin))
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(code, url.origin)
    const claims = await verifyIdToken(tokenResponse.id_token, storedState.nonce)

    if (!claims.id) {
      throw new Error("Azure ID token missing subject")
    }

    const sessionUser = {
      id: claims.id,
      email: claims.email,
      name: claims.name,
      provider: "azure" as const,
    }

    const sessionToken = await createSessionToken(sessionUser)

    if (isCosmosConfigured()) {
      const profile = await ensureUserProfile(sessionUser)
      await upsertUserProfile(profile.user_id, {
        email: claims.email,
        full_name: claims.name,
        registered_app_id: APP_ID,
        platform: APP_ID,
      })
    }

    const target = storedState.next && storedState.next.startsWith("/") ? storedState.next : "/dashboard"
    const response = NextResponse.redirect(new URL(target, url.origin))
    setSessionCookie(response, sessionToken)
    clearOAuthStateCookie(response)
    return response
  } catch (error) {
    console.error("Azure auth callback failed:", error)
    const response = NextResponse.redirect(new URL("/auth/error", url.origin))
    clearOAuthStateCookie(response)
    return response
  }
}
