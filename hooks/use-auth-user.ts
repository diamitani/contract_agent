"use client"

import { useState, useEffect, useCallback } from "react"

interface AuthUser {
  id: string
  email: string
  name?: string
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem("artispreneur_logged_in") === "true"
      const profileStr = localStorage.getItem("artispreneur_profile")
      if (loggedIn && profileStr) {
        const profile = JSON.parse(profileStr)
        setUser({
          id: profile.email || "user",
          email: profile.email || "",
          name: profile.stageName || profile.firstName || "",
        })
      }
    } catch {}
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem("artispreneur_logged_in")
    setUser(null)
  }, [])

  return { user, loading, signOut }
}
