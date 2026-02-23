"use client"

import { useCallback, useEffect, useState } from "react"
import type { AuthUser } from "@/lib/auth/types"

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" })
      const json = (await response.json()) as { user?: AuthUser | null }
      setUser(json.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }, [])

  return { user, loading, refresh, signOut }
}
