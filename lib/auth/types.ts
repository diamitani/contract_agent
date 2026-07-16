export type AuthProvider = "azure" | "supabase" | "local"

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
  provider: AuthProvider
  created_at?: string
}
