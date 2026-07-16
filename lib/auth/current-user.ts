// localStorage-based auth for server + client components
// Stripped of Supabase — uses client-side localStorage only

export type AuthProvider = "local"

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
  provider: AuthProvider
  created_at?: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // In server context, return null (auth is client-side only)
  if (typeof window === "undefined") return null
  try {
    const loggedIn = localStorage.getItem("artispreneur_logged_in") === "true"
    const profileStr = localStorage.getItem("artispreneur_profile")
    if (loggedIn && profileStr) {
      const profile = JSON.parse(profileStr)
      return {
        id: profile.email || "local-user",
        email: profile.email || "",
        name: profile.stageName || profile.firstName || "",
        provider: "local",
      }
    }
  } catch {}
  return null
}

export function hasSupabaseSessionCookie(_cookieNames: string[]): boolean {
  return false
}
