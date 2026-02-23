import { cookies } from "next/headers"
import type { AuthUser } from "@/lib/auth/types"
import { AUTH_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value

  if (token) {
    const sessionUser = await verifySessionToken(token)
    if (sessionUser) {
      return sessionUser
    }
  }

  if (!hasSupabaseEnv()) {
    return null
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || null,
      name: (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined) || null,
      provider: "supabase",
      created_at: user.created_at,
    }
  } catch {
    return null
  }
}

export function hasSupabaseSessionCookie(cookieNames: string[]) {
  return cookieNames.some((name) => name.startsWith("sb-") && name.includes("auth-token"))
}
