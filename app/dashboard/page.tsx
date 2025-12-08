import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/sign-in")
  }

  // Fetch contracts from Supabase
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch uploaded files from Supabase
  const { data: uploadedFiles } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <DashboardClient initialContracts={contracts || []} initialUploadedFiles={uploadedFiles || []} user={user} />
}
