import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { buildAuthorizationUrl, isAzureAuthConfigured } from "@/lib/azure/oidc"
import { setOAuthStateCookie } from "@/lib/auth/session"

function encodeStateCookie(payload: { state: string; nonce: string; next: string }) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

export async function GET(request: Request) {
  if (!isAzureAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Azure auth is not configured. Set AZURE_B2C_TENANT_NAME, AZURE_B2C_POLICY, AZURE_B2C_CLIENT_ID, and AZURE_B2C_CLIENT_SECRET.",
      },
      { status: 500 },
    )
  }

  const url = new URL(request.url)
  const nextPath = (url.searchParams.get("next") || "/dashboard").trim()
  const next = nextPath.startsWith("/") ? nextPath : "/dashboard"

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
