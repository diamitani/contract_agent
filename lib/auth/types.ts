export type AuthProvider = "azure" | "supabase"

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
  provider: AuthProvider
  created_at?: string
}
