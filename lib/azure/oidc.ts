import { createRemoteJWKSet, jwtVerify } from "jose"

interface OpenIdConfiguration {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
}

interface OAuthTokenResponse {
  id_token: string
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

type IdClaims = {
  sub?: string
  oid?: string
  email?: string
  emails?: string[]
  name?: string
  nonce?: string
}

let oidcConfigCache: OpenIdConfiguration | null = null

function getTenantName() {
  const raw = process.env.AZURE_B2C_TENANT_NAME || process.env.AZURE_TENANT_NAME || ""
  if (!raw) return ""
  return raw.replace(".onmicrosoft.com", "")
}

function getTenantDomain() {
  const raw = process.env.AZURE_B2C_TENANT_NAME || process.env.AZURE_TENANT_NAME || ""
  if (!raw) return ""
  return raw.includes(".onmicrosoft.com") ? raw : `${raw}.onmicrosoft.com`
}

function getPolicy() {
  return process.env.AZURE_B2C_POLICY || process.env.AZURE_B2C_SIGNIN_POLICY || ""
}

export function isAzureAuthConfigured() {
  const hasClientCreds = Boolean(process.env.AZURE_B2C_CLIENT_ID && process.env.AZURE_B2C_CLIENT_SECRET)
  const hasB2C = Boolean(getTenantName() && getPolicy())
  const hasStandardEntra = Boolean(process.env.AZURE_TENANT_ID || process.env.AZURE_TENANT_NAME)
  return hasClientCreds && (hasB2C || hasStandardEntra)
}

async function getOpenIdConfiguration(): Promise<OpenIdConfiguration> {
  if (oidcConfigCache) {
    return oidcConfigCache
  }

  const policy = getPolicy()
  let wellKnown = ""

  if (policy) {
    const tenant = getTenantName()
    const tenantDomain = getTenantDomain()
    if (!tenant || !tenantDomain) {
      throw new Error("Azure B2C tenant configuration is incomplete")
    }
    wellKnown = `https://${tenant}.b2clogin.com/${tenantDomain}/${policy}/v2.0/.well-known/openid-configuration`
  } else {
    const tenantIdOrDomain =
      process.env.AZURE_TENANT_ID || process.env.AZURE_TENANT_NAME || process.env.AZURE_B2C_TENANT_NAME || "common"
    wellKnown = `https://login.microsoftonline.com/${tenantIdOrDomain}/v2.0/.well-known/openid-configuration`
  }

  const response = await fetch(wellKnown)
  if (!response.ok) {
    throw new Error(`Failed to load Azure OpenID configuration (${response.status})`)
  }

  oidcConfigCache = (await response.json()) as OpenIdConfiguration
  return oidcConfigCache
}

function getRedirectUri(origin: string) {
  const configured = process.env.AZURE_B2C_REDIRECT_URI
  const fallback = `${origin}/api/auth/azure/callback`

  if (!configured) return fallback

  if (process.env.NODE_ENV !== "production") {
    try {
      const configuredUrl = new URL(configured)
      const requestUrl = new URL(origin)
      if (configuredUrl.origin !== requestUrl.origin) {
        return fallback
      }
    } catch {
      return fallback
    }
  }

  return configured
}

export async function buildAuthorizationUrl(input: {
  origin: string
  state: string
  nonce: string
  next: string
}) {
  const config = await getOpenIdConfiguration()

  const params = new URLSearchParams({
    client_id: process.env.AZURE_B2C_CLIENT_ID || "",
    response_type: "code",
    response_mode: "query",
    redirect_uri: getRedirectUri(input.origin),
    scope: process.env.AZURE_B2C_SCOPES || "openid profile email",
    state: input.state,
    nonce: input.nonce,
    prompt: "select_account",
  })

  if (input.next) {
    params.set("client_info", "1")
  }

  return `${config.authorization_endpoint}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, origin: string): Promise<OAuthTokenResponse> {
  const config = await getOpenIdConfiguration()
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.AZURE_B2C_CLIENT_ID || "",
    client_secret: process.env.AZURE_B2C_CLIENT_SECRET || "",
    code,
    redirect_uri: getRedirectUri(origin),
    scope: process.env.AZURE_B2C_SCOPES || "openid profile email",
  })

  const response = await fetch(config.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  const payload = (await response.json()) as OAuthTokenResponse & { error_description?: string }

  if (!response.ok || !payload.id_token) {
    throw new Error(payload.error_description || "Failed to exchange Azure auth code")
  }

  return payload
}

export async function verifyIdToken(idToken: string, expectedNonce: string | null) {
  const config = await getOpenIdConfiguration()
  const jwks = createRemoteJWKSet(new URL(config.jwks_uri))

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: config.issuer,
    audience: process.env.AZURE_B2C_CLIENT_ID,
  })

  const claims = payload as IdClaims

  if (expectedNonce && claims.nonce && claims.nonce !== expectedNonce) {
    throw new Error("Invalid nonce")
  }

  return {
    id: claims.oid || claims.sub || "",
    email: claims.email || claims.emails?.[0] || null,
    name: claims.name || null,
  }
}
