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
  app_id: string
}

export interface UploadedFile {
  id: string
  user_id?: string
  contract_id?: string | null
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  folder_id?: string | null
  analysis_status?: "pending" | "analyzing" | "completed" | "failed"
  analysis_result?: {
    summary?: string
    key_terms?: string[]
    risks?: string[]
    obligations?: string[]
    dates?: string[]
  } | null
  extracted_text?: string | null
  created_at: string
  app_id: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id?: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface UploadedContract {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: string
  status: "uploaded" | "analyzing" | "analyzed"
  analysis?: {
    summary: string
    sections: Array<{ title: string; description: string }>
    risks: string[]
    recommendations: string[]
  }
}

async function callDataApi<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  })

  const json = (await response.json().catch(() => ({}))) as { data?: T; error?: string }

  if (!response.ok) {
    throw new Error(json.error || `Request failed: ${action}`)
  }

  return json.data as T
}

export async function getSavedContracts(): Promise<SavedContract[]> {
  try {
    return await callDataApi<SavedContract[]>("getSavedContracts")
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return []
  }
}

export async function saveContract(
  contract: Omit<SavedContract, "id" | "user_id" | "created_at" | "updated_at">,
): Promise<SavedContract | null> {
  try {
    return await callDataApi<SavedContract>("saveContract", {
      ...contract,
      app_id: contract.app_id || APP_ID,
    })
  } catch (error) {
    console.error("Error saving contract:", error)
    return null
  }
}

export async function updateContract(id: string, updates: Partial<SavedContract>): Promise<SavedContract | null> {
  try {
    return await callDataApi<SavedContract>("updateContract", { id, updates })
  } catch (error) {
    console.error("Error updating contract:", error)
    return null
  }
}

export async function deleteContract(id: string): Promise<boolean> {
  try {
    return await callDataApi<boolean>("deleteContract", { id })
  } catch (error) {
    console.error("Error deleting contract:", error)
    return false
  }
}

export async function getUploadedFiles(): Promise<UploadedFile[]> {
  try {
    return await callDataApi<UploadedFile[]>("getUploadedFiles")
  } catch (error) {
    console.error("Error fetching uploaded files:", error)
    return []
  }
}

export async function saveUploadedFile(
  file: Omit<UploadedFile, "id" | "user_id" | "created_at">,
): Promise<UploadedFile | null> {
  try {
    return await callDataApi<UploadedFile>("saveUploadedFile", {
      ...file,
      app_id: file.app_id || APP_ID,
    })
  } catch (error) {
    console.error("Error saving uploaded file:", error)
    return null
  }
}

export async function deleteUploadedFile(id: string): Promise<boolean> {
  try {
    return await callDataApi<boolean>("deleteUploadedFile", { id })
  } catch (error) {
    console.error("Error deleting uploaded file:", error)
    return false
  }
}

export async function getFolders(): Promise<Folder[]> {
  try {
    return await callDataApi<Folder[]>("getFolders")
  } catch (error) {
    console.error("Error fetching folders:", error)
    return []
  }
}

export async function createFolder(name: string, parentId?: string, color?: string): Promise<Folder | null> {
  try {
    return await callDataApi<Folder>("createFolder", {
      name,
      parent_id: parentId,
      color,
    })
  } catch (error) {
    console.error("Error creating folder:", error)
    return null
  }
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | null> {
  try {
    return await callDataApi<Folder>("updateFolder", { id, updates })
  } catch (error) {
    console.error("Error updating folder:", error)
    return null
  }
}

export async function deleteFolder(id: string): Promise<boolean> {
  try {
    return await callDataApi<boolean>("deleteFolder", { id })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return false
  }
}

export async function updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | null> {
  try {
    return await callDataApi<UploadedFile>("updateUploadedFile", { id, updates })
  } catch (error) {
    console.error("Error updating uploaded file:", error)
    return null
  }
}

export async function moveFileToFolder(fileId: string, folderId: string | null): Promise<boolean> {
  try {
    return await callDataApi<boolean>("moveFileToFolder", { fileId, folderId })
  } catch (error) {
    console.error("Error moving file to folder:", error)
    return false
  }
}

export async function trackEvent(eventType: string, eventData: Record<string, unknown>): Promise<void> {
  try {
    await callDataApi<boolean>("trackEvent", { eventType, eventData })
  } catch (error) {
    console.warn("Error tracking analytics event:", error)
  }
}

export async function getAnalytics(): Promise<{
  totalContracts: number
  totalUploads: number
  contractsByType: Record<string, number>
  recentActivity: Array<{ type: string; date: string; data: Record<string, unknown> }>
}> {
  try {
    return await callDataApi("getAnalytics")
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return {
      totalContracts: 0,
      totalUploads: 0,
      contractsByType: {},
      recentActivity: [],
    }
  }
}
