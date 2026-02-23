import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import {
  addAnalyticsEvent,
  createContract,
  createFolder,
  createUploadedFile,
  deleteContract,
  deleteFolder,
  deleteUploadedFile,
  listAnalyticsEvents,
  listContracts,
  listFolders,
  listUploadedFiles,
  moveFileToFolder,
  updateContract,
  updateFolder,
  updateUploadedFile,
} from "@/lib/cosmos/store"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as {
      action: string
      payload?: Record<string, unknown>
    }

    const action = body.action
    const payload = body.payload || {}

    switch (action) {
      case "getSavedContracts": {
        const data = await listContracts(user.id)
        return NextResponse.json({ data })
      }

      case "saveContract": {
        const data = await createContract(user.id, {
          title: String(payload.title || ""),
          contract_type: String(payload.contract_type || ""),
          content: String(payload.content || ""),
          form_data: (payload.form_data || {}) as Record<string, string>,
          status: (payload.status as "draft" | "completed" | "pending") || "completed",
        })
        return NextResponse.json({ data })
      }

      case "updateContract": {
        const id = String(payload.id || "")
        if (!id) return NextResponse.json({ error: "Missing contract id" }, { status: 400 })
        const updates = (payload.updates || {}) as Record<string, unknown>
        const data = await updateContract(user.id, id, updates as any)
        return NextResponse.json({ data })
      }

      case "deleteContract": {
        const id = String(payload.id || "")
        if (!id) return NextResponse.json({ error: "Missing contract id" }, { status: 400 })
        await deleteContract(user.id, id)
        return NextResponse.json({ data: true })
      }

      case "getUploadedFiles": {
        const data = await listUploadedFiles(user.id)
        return NextResponse.json({ data })
      }

      case "saveUploadedFile": {
        const data = await createUploadedFile(user.id, {
          file_name: String(payload.file_name || ""),
          file_type: String(payload.file_type || "application/octet-stream"),
          file_size: Number(payload.file_size || 0),
          storage_path: String(payload.storage_path || ""),
          folder_id: (payload.folder_id as string | null | undefined) || null,
          analysis_status: (payload.analysis_status as any) || "pending",
          analysis_result: (payload.analysis_result as Record<string, unknown> | null | undefined) || null,
          extracted_text: (payload.extracted_text as string | null | undefined) || null,
          contract_id: (payload.contract_id as string | null | undefined) || null,
        })
        return NextResponse.json({ data })
      }

      case "deleteUploadedFile": {
        const id = String(payload.id || "")
        if (!id) return NextResponse.json({ error: "Missing file id" }, { status: 400 })
        await deleteUploadedFile(user.id, id)
        return NextResponse.json({ data: true })
      }

      case "updateUploadedFile": {
        const id = String(payload.id || "")
        if (!id) return NextResponse.json({ error: "Missing file id" }, { status: 400 })
        const updates = (payload.updates || {}) as Record<string, unknown>
        const data = await updateUploadedFile(user.id, id, updates as any)
        return NextResponse.json({ data })
      }

      case "moveFileToFolder": {
        const fileId = String(payload.fileId || "")
        const folderId = (payload.folderId as string | null | undefined) || null
        if (!fileId) return NextResponse.json({ error: "Missing file id" }, { status: 400 })
        const data = await moveFileToFolder(user.id, fileId, folderId)
        return NextResponse.json({ data })
      }

      case "getFolders": {
        const data = await listFolders(user.id)
        return NextResponse.json({ data })
      }

      case "createFolder": {
        const name = String(payload.name || "").trim()
        if (!name) return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
        const data = await createFolder(user.id, name, payload.parent_id as string | undefined, payload.color as string | undefined)
        return NextResponse.json({ data })
      }

      case "updateFolder": {
        const id = String(payload.id || "")
        if (!id) return NextResponse.json({ error: "Missing folder id" }, { status: 400 })
        const updates = (payload.updates || {}) as Record<string, unknown>
        const data = await updateFolder(user.id, id, updates as any)
        return NextResponse.json({ data })
      }

      case "deleteFolder": {
        const id = String(payload.id || "")
        if (!id) return NextResponse.json({ error: "Missing folder id" }, { status: 400 })
        await deleteFolder(user.id, id)
        return NextResponse.json({ data: true })
      }

      case "trackEvent": {
        const eventType = String(payload.eventType || "")
        if (!eventType) return NextResponse.json({ error: "Missing event type" }, { status: 400 })
        await addAnalyticsEvent(user.id, eventType, (payload.eventData || {}) as Record<string, unknown>)
        return NextResponse.json({ data: true })
      }

      case "getAnalytics": {
        const [contracts, uploads, events] = await Promise.all([
          listContracts(user.id),
          listUploadedFiles(user.id),
          listAnalyticsEvents(user.id, 10),
        ])

        const contractsByType: Record<string, number> = {}
        for (const contract of contracts) {
          contractsByType[contract.contract_type] = (contractsByType[contract.contract_type] || 0) + 1
        }

        const data = {
          totalContracts: contracts.length,
          totalUploads: uploads.length,
          contractsByType,
          recentActivity: events.map((event) => ({
            type: event.event_type,
            date: event.created_at,
            data: event.event_data,
          })),
        }

        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Data API error:", error)
    return NextResponse.json({ error: "Data API request failed" }, { status: 500 })
  }
}
