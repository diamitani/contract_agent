import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard-client"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isCosmosConfigured, listContracts, listUploadedFiles } from "@/lib/cosmos/store"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  const [contracts, uploadedFiles] = isCosmosConfigured()
    ? await Promise.all([listContracts(user.id), listUploadedFiles(user.id)])
    : [[], []]

  return <DashboardClient initialContracts={contracts || []} initialUploadedFiles={uploadedFiles || []} user={user} />
}
