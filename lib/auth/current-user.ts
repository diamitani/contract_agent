// localStorage-based auth for server components (stub — returns null in server context)
export interface AuthUser {
  id: string
  email: string
  name?: string
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
        id: profile.email || "user",
        email: profile.email || "",
        name: profile.stageName || profile.firstName || "",
      }
    }
  } catch {}
  return null
}
