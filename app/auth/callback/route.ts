import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { APP_ID } from "@/lib/constants"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("user_profiles").upsert(
          {
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            registered_app_id: APP_ID,
            platform: APP_ID,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
