import { createClient } from "@/lib/supabase/client"

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
}

export interface UploadedFile {
  id: string
  user_id?: string
  contract_id?: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  created_at: string
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

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      user_id: user.id,
      title: contract.title,
      contract_type: contract.contract_type,
      content: contract.content,
      form_data: contract.form_data,
    })
    .select()
    .single()

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

  const { data, error } = await supabase
    .from("uploaded_files")
    .insert({
      user_id: user.id,
      ...file,
    })
    .select()
    .single()

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
