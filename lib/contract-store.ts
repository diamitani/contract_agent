import { createClient } from "@/lib/supabase/client"
import { APP_ID } from "@/lib/constants"

export interface SavedContract {
  id: string
  user_id?: string
  title: string
  contract_type: string
  content: string
  form_data: Record<string, string>
  status: "draft" | "completed" | "pending"
  created_at: string
  updated_at: string
  app_id: string // Added app_id field
}

export interface UploadedFile {
  id: string
  user_id?: string
  contract_id?: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  folder_id?: string
  analysis_status?: "pending" | "analyzing" | "completed" | "failed"
  analysis_result?: {
    summary?: string
    key_terms?: string[]
    risks?: string[]
    obligations?: string[]
    dates?: string[]
  }
  extracted_text?: string
  created_at: string
  app_id: string // Added app_id field
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id?: string
  color: string
  created_at: string
  updated_at: string
}

export async function getSavedContracts(): Promise<SavedContract[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contracts:", error)
    return []
  }

  return data || []
}

export async function saveContract(
  contract: Omit<SavedContract, "id" | "user_id" | "created_at" | "updated_at">,
): Promise<SavedContract | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    title: contract.title,
    contract_type: contract.contract_type,
    content: contract.content,
    form_data: contract.form_data,
    app_id: APP_ID,
  }

  let { data, error } = await supabase.from("contracts").insert(insertData).select().single()

  // If app_id column doesn't exist, retry without it
  if (error?.message?.includes("app_id") || error?.code === "42703") {
    const { app_id, ...insertWithoutAppId } = insertData
    const result = await supabase.from("contracts").insert(insertWithoutAppId).select().single()
    data = result.data
    error = result.error
  }

  if (error) {
    console.error("Error saving contract:", error)
    return null
  }

  return data
}

export async function updateContract(id: string, updates: Partial<SavedContract>): Promise<SavedContract | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("contracts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating contract:", error)
    return null
  }

  return data
}

export async function deleteContract(id: string): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase.from("contracts").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting contract:", error)
    return false
  }

  return true
}

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching uploaded files:", error)
    return []
  }

  return data || []
}

export async function saveUploadedFile(
  file: Omit<UploadedFile, "id" | "user_id" | "created_at">,
): Promise<UploadedFile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    file_name: file.file_name,
    file_type: file.file_type,
    file_size: file.file_size,
    storage_path: file.storage_path,
    folder_id: file.folder_id,
    analysis_status: file.analysis_status,
    analysis_result: file.analysis_result,
    extracted_text: file.extracted_text,
    app_id: APP_ID,
  }

  let { data, error } = await supabase.from("uploaded_files").insert(insertData).select().single()

  // If app_id column doesn't exist, retry without it
  if (error?.message?.includes("app_id") || error?.code === "42703") {
    const { app_id, ...insertWithoutAppId } = insertData
    const result = await supabase.from("uploaded_files").insert(insertWithoutAppId).select().single()
    data = result.data
    error = result.error
  }

  if (error) {
    console.error("Error saving uploaded file:", error)
    return null
  }

  return data
}

export async function deleteUploadedFile(id: string): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase.from("uploaded_files").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting uploaded file:", error)
    return false
  }

  return true
}

export async function getFolders(): Promise<Folder[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    if (error.message?.includes("Could not find the table") || error.code === "42P01") {
      console.warn("Folders table not yet created. Run scripts/006-file-management.sql")
      return []
    }
    console.error("Error fetching folders:", error)
    return []
  }

  return data || []
}

export async function createFolder(name: string, parentId?: string, color?: string): Promise<Folder | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId,
      color: color || "#6366f1",
    })
    .select()
    .single()

  if (error) {
    if (error.message?.includes("Could not find the table") || error.code === "42P01") {
      console.warn("Folders table not yet created. Run scripts/006-file-management.sql")
      return null
    }
    console.error("Error creating folder:", error)
    return null
  }

  return data
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("folders")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating folder:", error)
    return null
  }

  return data
}

export async function deleteFolder(id: string): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase.from("folders").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting folder:", error)
    return false
  }

  return true
}

export async function updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("uploaded_files")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating file:", error)
    return null
  }

  return data
}

export async function moveFileToFolder(fileId: string, folderId: string | null): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from("uploaded_files")
    .update({ folder_id: folderId })
    .eq("id", fileId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error moving file:", error)
    return false
  }

  return true
}

export async function trackEvent(eventType: string, eventData: Record<string, unknown>): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  try {
    const { error } = await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_type: eventType,
      event_data: eventData,
      app_id: APP_ID,
    })

    if (error?.message?.includes("app_id") || error?.code === "42703") {
      await supabase.from("analytics_events").insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
      })
    }
  } catch (err) {
    console.warn("Analytics table not available:", err)
  }
}

export async function getAnalytics(): Promise<{
  totalContracts: number
  totalUploads: number
  contractsByType: Record<string, number>
  recentActivity: Array<{ type: string; date: string; data: Record<string, unknown> }>
}> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { totalContracts: 0, totalUploads: 0, contractsByType: {}, recentActivity: [] }
  }

  const [contractsResult, uploadsResult, eventsResult] = await Promise.all([
    supabase.from("contracts").select("*").eq("user_id", user.id),
    supabase.from("uploaded_files").select("*").eq("user_id", user.id),
    supabase
      .from("analytics_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then((res) => res)
      .catch(() => ({ data: [], error: null })),
  ])

  const contracts = contractsResult.data || []
  const uploads = uploadsResult.data || []
  const events = eventsResult.data || []

  const contractsByType: Record<string, number> = {}
  contracts.forEach((c) => {
    contractsByType[c.contract_type] = (contractsByType[c.contract_type] || 0) + 1
  })

  return {
    totalContracts: contracts.length,
    totalUploads: uploads.length,
    contractsByType,
    recentActivity: events.map((e) => ({
      type: e.event_type,
      date: e.created_at,
      data: e.event_data,
    })),
  }
}
