export const runtime = "edge"

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { contracts } from "@/lib/contracts"
import ContractPreviewClient from "@/components/contract-preview-client"

export async function generateStaticParams() {
  return contracts.map((contract) => ({
    slug: contract.slug,
  }))
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ data?: string }>
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { data } = await searchParams

  const contract = contracts.find((c) => c.slug === slug)

  if (!contract) {
    notFound()
  }

  const formData = data ? JSON.parse(decodeURIComponent(data)) : {}

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading preview...</div>}>
        <ContractPreviewClient contract={contract} formData={formData} />
      </Suspense>
    </div>
  )
}
