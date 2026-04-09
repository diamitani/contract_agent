import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { buildAuthorizationUrl, isAzureAuthConfigured } from "@/lib/azure/oidc"
import { createSessionToken, setSessionCookie, setOAuthStateCookie } from "@/lib/auth/session"

function encodeStateCookie(payload: { state: string; nonce: string; next: string }) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nextPath = (url.searchParams.get("next") || "/dashboard").trim()
  const next = nextPath.startsWith("/") ? nextPath : "/dashboard"

  // Dev mode: if Azure auth not configured and we're in development, create a mock session
  if (!isAzureAuthConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      // Create a mock user for development
      const mockUser = {
        id: "dev-user-123",
        email: "dev@example.com",
        name: "Development User",
        provider: "azure" as const,
      }
      const sessionToken = await createSessionToken(mockUser)
      const response = NextResponse.redirect(new URL(next, url.origin))
      setSessionCookie(response, sessionToken)
      return response
    } else {
      return NextResponse.json(
        {
          error:
            "Azure auth is not configured. Set AZURE_B2C_TENANT_NAME, AZURE_B2C_POLICY, AZURE_B2C_CLIENT_ID, and AZURE_B2C_CLIENT_SECRET.",
        },
        { status: 500 },
      )
    }
  }

  const state = randomUUID()
  const nonce = randomUUID()

  const authUrl = await buildAuthorizationUrl({
    origin: url.origin,
    state,
    nonce,
    next,
  })

  const response = NextResponse.redirect(authUrl)
  setOAuthStateCookie(
    response,
    encodeStateCookie({
      state,
      nonce,
      next,
    }),
  )

  return response
}
