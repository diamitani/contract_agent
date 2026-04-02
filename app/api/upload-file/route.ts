import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isCosmosConfigured, createUploadedFile } from "@/lib/cosmos/store"
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "crypto"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const folderId = formData.get("folder_id") as string | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
    return NextResponse.json({ error: "Unsupported file type. Use PDF, DOC, DOCX, or TXT." }, { status: 400 })
  }

  const maxSize = 25 * 1024 * 1024 // 25 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large. Maximum size is 25 MB." }, { status: 400 })
  }

  const fileId = randomUUID()
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf"
  const storagePath = `${user.id}/${fileId}.${ext}`
  let publicUrl = ""

  // Upload to Supabase Storage if configured
  const supabase = getSupabaseAdmin()
  if (supabase) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (uploadError) {
      console.error("[upload-file] Supabase storage error:", uploadError)
      // Non-fatal: continue without storage URL
    } else {
      const { data } = supabase.storage.from("contracts").getPublicUrl(storagePath)
      publicUrl = data?.publicUrl || ""
    }
  }

  // Extract text via process-document endpoint
  let extractedText = ""
  try {
    const processFormData = new FormData()
    processFormData.append("file", file)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const processRes = await fetch(`${baseUrl}/api/process-document`, {
      method: "POST",
      body: processFormData,
    })

    if (processRes.ok) {
      const processData = await processRes.json()
      extractedText = processData.content || ""
    }
  } catch (err) {
    console.warn("[upload-file] Text extraction failed:", err)
  }

  // Persist metadata
  let savedFile: { id: string; file_name: string; file_type: string; file_size: number; storage_path: string; created_at: string } | null = null

  if (isCosmosConfigured()) {
    savedFile = await createUploadedFile(user.id, {
      file_name: file.name,
      file_type: file.type || `application/${ext}`,
      file_size: file.size,
      storage_path: publicUrl || storagePath,
      folder_id: folderId || null,
      analysis_status: "pending",
      extracted_text: extractedText,
    })
  }

  return NextResponse.json({
    id: savedFile?.id || fileId,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_path: publicUrl || storagePath,
    extracted_text: extractedText,
    created_at: savedFile?.created_at || new Date().toISOString(),
  })
}
