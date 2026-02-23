import { CosmosClient, type Container } from "@azure/cosmos"
import type { AuthUser } from "@/lib/auth/types"
import { APP_ID } from "@/lib/constants"

export type SubscriptionStatus = "free" | "per_contract" | "unlimited"

export interface UserProfileDoc {
  id: string
  user_id: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  stripe_customer_id?: string | null
  subscription_status: SubscriptionStatus
  subscription_id?: string | null
  contracts_generated: number
  contracts_remaining: number
  last_free_contract_at?: string | null
  free_contracts_used_this_month?: number
  registered_app_id: string
  platform: string
  created_at: string
  updated_at: string
}

export interface PaymentDoc {
  id: string
  user_id: string
  stripe_payment_id?: string | null
  stripe_session_id?: string | null
  amount: number
  currency: string
  product_type: string
  status: string
  app_id: string
  created_at: string
}

export interface ContractDoc {
  id: string
  user_id: string
  title: string
  contract_type: string
  content: string
  form_data: Record<string, string>
  status: "draft" | "completed" | "pending"
  app_id: string
  created_at: string
  updated_at: string
}

export interface UploadedFileDoc {
  id: string
  user_id: string
  contract_id?: string | null
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  folder_id?: string | null
  analysis_status?: "pending" | "analyzing" | "completed" | "failed"
  analysis_result?: Record<string, unknown> | null
  extracted_text?: string | null
  app_id: string
  created_at: string
}

export interface FolderDoc {
  id: string
  user_id: string
  name: string
  parent_id?: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface AnalyticsEventDoc {
  id: string
  user_id: string
  event_type: string
  event_data: Record<string, unknown>
  app_id: string
  created_at: string
}

const COSMOS_DATABASE = process.env.AZURE_COSMOS_DATABASE || "contract_agent"

const CONTAINERS = {
  profiles: "user_profiles",
  payments: "payments",
  contracts: "contracts",
  uploadedFiles: "uploaded_files",
  folders: "folders",
  analytics: "analytics_events",
} as const

let cosmosClient: CosmosClient | null = null
const containerCache = new Map<string, Promise<Container>>()

function nowIso() {
  return new Date().toISOString()
}

function randomId() {
  return crypto.randomUUID()
}

export function isCosmosConfigured() {
  return Boolean(process.env.AZURE_COSMOS_ENDPOINT && process.env.AZURE_COSMOS_KEY)
}

function getCosmosClient() {
  if (!isCosmosConfigured()) {
    throw new Error("Cosmos DB is not configured. Set AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY.")
  }

  if (!cosmosClient) {
    cosmosClient = new CosmosClient({
      endpoint: process.env.AZURE_COSMOS_ENDPOINT!,
      key: process.env.AZURE_COSMOS_KEY!,
    })
  }

  return cosmosClient
}

async function getContainer(id: string) {
  if (!containerCache.has(id)) {
    containerCache.set(
      id,
      (async () => {
        const client = getCosmosClient()
        const { database } = await client.databases.createIfNotExists({ id: COSMOS_DATABASE })
        const { container } = await database.containers.createIfNotExists({
          id,
          partitionKey: {
            paths: ["/user_id"],
          },
        })
        return container
      })(),
    )
  }

  return await containerCache.get(id)!
}

async function queryByUser<T>(containerId: string, userId: string, query: string, parameters: { name: string; value: unknown }[] = []) {
  const container = await getContainer(containerId)
  const { resources } = await container.items
    .query<T>(
      {
        query,
        parameters: [{ name: "@userId", value: userId }, ...parameters],
      },
      { partitionKey: userId },
    )
    .fetchAll()
  return resources
}

export async function ensureUserProfile(user: AuthUser) {
  const existing = await getUserProfile(user.id)
  if (existing) {
    return existing
  }

  const createdAt = nowIso()
  const doc: UserProfileDoc = {
    id: user.id,
    user_id: user.id,
    email: user.email || null,
    full_name: user.name || null,
    subscription_status: "free",
    contracts_generated: 0,
    contracts_remaining: 0,
    registered_app_id: APP_ID,
    platform: APP_ID,
    created_at: createdAt,
    updated_at: createdAt,
  }

  const container = await getContainer(CONTAINERS.profiles)
  const { resource } = await container.items.create<UserProfileDoc>(doc)
  return resource as UserProfileDoc
}

export async function getUserProfile(userId: string): Promise<UserProfileDoc | null> {
  const container = await getContainer(CONTAINERS.profiles)

  try {
    const { resource } = await container.item(userId, userId).read<UserProfileDoc>()
    return resource || null
  } catch {
    const rows = await queryByUser<UserProfileDoc>(
      CONTAINERS.profiles,
      userId,
      "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC OFFSET 0 LIMIT 1",
    )
    return rows[0] || null
  }
}

export async function findUserProfileByStripeCustomerId(customerId: string): Promise<UserProfileDoc | null> {
  const container = await getContainer(CONTAINERS.profiles)
  const { resources } = await container.items
    .query<UserProfileDoc>({
      query: "SELECT * FROM c WHERE c.stripe_customer_id = @customerId OFFSET 0 LIMIT 1",
      parameters: [{ name: "@customerId", value: customerId }],
    })
    .fetchAll()
  return resources[0] || null
}

export async function upsertUserProfile(userId: string, updates: Partial<UserProfileDoc>) {
  const current = await getUserProfile(userId)
  const base: UserProfileDoc =
    current ||
    ({
      id: userId,
      user_id: userId,
      subscription_status: "free",
      contracts_generated: 0,
      contracts_remaining: 0,
      registered_app_id: APP_ID,
      platform: APP_ID,
      created_at: nowIso(),
      updated_at: nowIso(),
    } as UserProfileDoc)

  const next: UserProfileDoc = {
    ...base,
    ...updates,
    id: userId,
    user_id: userId,
    updated_at: nowIso(),
  }

  const container = await getContainer(CONTAINERS.profiles)
  const { resource } = await container.items.upsert<UserProfileDoc>(next)
  return resource as UserProfileDoc
}

export async function consumeContractCredit(userId: string) {
  const profile = await getUserProfile(userId)
  if (!profile) {
    throw new Error("Profile not found")
  }

  if (profile.subscription_status === "unlimited") {
    const updated = await upsertUserProfile(userId, {
      contracts_generated: (profile.contracts_generated || 0) + 1,
    })
    return { success: true, contractsRemaining: updated.contracts_remaining }
  }

  if (profile.subscription_status === "per_contract" && (profile.contracts_remaining || 0) > 0) {
    const updated = await upsertUserProfile(userId, {
      contracts_remaining: (profile.contracts_remaining || 0) - 1,
      contracts_generated: (profile.contracts_generated || 0) + 1,
    })
    return { success: true, contractsRemaining: updated.contracts_remaining }
  }

  return { success: false, contractsRemaining: profile.contracts_remaining || 0 }
}

export async function listPayments(userId: string, limit = 20) {
  return await queryByUser<PaymentDoc>(
    CONTAINERS.payments,
    userId,
    "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC OFFSET 0 LIMIT @limit",
    [{ name: "@limit", value: limit }],
  )
}

export async function findPaymentBySessionId(sessionId: string): Promise<PaymentDoc | null> {
  const container = await getContainer(CONTAINERS.payments)
  const { resources } = await container.items
    .query<PaymentDoc>({
      query: "SELECT * FROM c WHERE c.stripe_session_id = @sessionId OFFSET 0 LIMIT 1",
      parameters: [{ name: "@sessionId", value: sessionId }],
    })
    .fetchAll()
  return resources[0] || null
}

export async function upsertPayment(payment: Partial<PaymentDoc> & Pick<PaymentDoc, "user_id" | "product_type" | "status" | "amount">) {
  const id = payment.id || randomId()
  const doc: PaymentDoc = {
    id,
    user_id: payment.user_id,
    stripe_payment_id: payment.stripe_payment_id || null,
    stripe_session_id: payment.stripe_session_id || null,
    amount: payment.amount,
    currency: payment.currency || "usd",
    product_type: payment.product_type,
    status: payment.status,
    app_id: payment.app_id || APP_ID,
    created_at: payment.created_at || nowIso(),
  }

  const container = await getContainer(CONTAINERS.payments)
  const { resource } = await container.items.upsert<PaymentDoc>(doc)
  return resource as PaymentDoc
}

export async function listContracts(userId: string) {
  return await queryByUser<ContractDoc>(
    CONTAINERS.contracts,
    userId,
    "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC",
  )
}

export async function createContract(
  userId: string,
  payload: Pick<ContractDoc, "title" | "contract_type" | "content" | "form_data" | "status">,
) {
  const now = nowIso()
  const doc: ContractDoc = {
    id: randomId(),
    user_id: userId,
    title: payload.title,
    contract_type: payload.contract_type,
    content: payload.content,
    form_data: payload.form_data,
    status: payload.status,
    app_id: APP_ID,
    created_at: now,
    updated_at: now,
  }

  const container = await getContainer(CONTAINERS.contracts)
  const { resource } = await container.items.create<ContractDoc>(doc)
  return resource as ContractDoc
}

export async function updateContract(userId: string, contractId: string, updates: Partial<ContractDoc>) {
  const container = await getContainer(CONTAINERS.contracts)
  const { resource } = await container.item(contractId, userId).read<ContractDoc>()
  if (!resource) return null

  const next: ContractDoc = {
    ...resource,
    ...updates,
    id: contractId,
    user_id: userId,
    updated_at: nowIso(),
  }

  const { resource: updated } = await container.item(contractId, userId).replace(next)
  return updated as ContractDoc
}

export async function deleteContract(userId: string, contractId: string) {
  const container = await getContainer(CONTAINERS.contracts)
  await container.item(contractId, userId).delete()
  return true
}

export async function listUploadedFiles(userId: string) {
  return await queryByUser<UploadedFileDoc>(
    CONTAINERS.uploadedFiles,
    userId,
    "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC",
  )
}

export async function getUploadedFileById(userId: string, fileId: string) {
  const container = await getContainer(CONTAINERS.uploadedFiles)
  try {
    const { resource } = await container.item(fileId, userId).read<UploadedFileDoc>()
    return resource || null
  } catch {
    return null
  }
}

export async function createUploadedFile(
  userId: string,
  payload: Omit<UploadedFileDoc, "id" | "user_id" | "app_id" | "created_at">,
) {
  const doc: UploadedFileDoc = {
    id: randomId(),
    user_id: userId,
    app_id: APP_ID,
    created_at: nowIso(),
    ...payload,
  }

  const container = await getContainer(CONTAINERS.uploadedFiles)
  const { resource } = await container.items.create<UploadedFileDoc>(doc)
  return resource as UploadedFileDoc
}

export async function updateUploadedFile(userId: string, fileId: string, updates: Partial<UploadedFileDoc>) {
  const container = await getContainer(CONTAINERS.uploadedFiles)
  const { resource } = await container.item(fileId, userId).read<UploadedFileDoc>()
  if (!resource) return null

  const next: UploadedFileDoc = {
    ...resource,
    ...updates,
    id: fileId,
    user_id: userId,
  }

  const { resource: updated } = await container.item(fileId, userId).replace(next)
  return updated as UploadedFileDoc
}

export async function deleteUploadedFile(userId: string, fileId: string) {
  const container = await getContainer(CONTAINERS.uploadedFiles)
  await container.item(fileId, userId).delete()
  return true
}

export async function listFolders(userId: string) {
  return await queryByUser<FolderDoc>(
    CONTAINERS.folders,
    userId,
    "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.name ASC",
  )
}

export async function createFolder(userId: string, name: string, parentId?: string, color = "#6366f1") {
  const now = nowIso()
  const doc: FolderDoc = {
    id: randomId(),
    user_id: userId,
    name,
    parent_id: parentId || null,
    color,
    created_at: now,
    updated_at: now,
  }

  const container = await getContainer(CONTAINERS.folders)
  const { resource } = await container.items.create<FolderDoc>(doc)
  return resource as FolderDoc
}

export async function updateFolder(userId: string, folderId: string, updates: Partial<FolderDoc>) {
  const container = await getContainer(CONTAINERS.folders)
  const { resource } = await container.item(folderId, userId).read<FolderDoc>()
  if (!resource) return null

  const next: FolderDoc = {
    ...resource,
    ...updates,
    id: folderId,
    user_id: userId,
    updated_at: nowIso(),
  }

  const { resource: updated } = await container.item(folderId, userId).replace(next)
  return updated as FolderDoc
}

export async function deleteFolder(userId: string, folderId: string) {
  const container = await getContainer(CONTAINERS.folders)
  await container.item(folderId, userId).delete()
  return true
}

export async function moveFileToFolder(userId: string, fileId: string, folderId: string | null) {
  const file = await updateUploadedFile(userId, fileId, { folder_id: folderId })
  return Boolean(file)
}

export async function addAnalyticsEvent(userId: string, eventType: string, eventData: Record<string, unknown>) {
  const doc: AnalyticsEventDoc = {
    id: randomId(),
    user_id: userId,
    event_type: eventType,
    event_data: eventData,
    app_id: APP_ID,
    created_at: nowIso(),
  }

  const container = await getContainer(CONTAINERS.analytics)
  const { resource } = await container.items.create<AnalyticsEventDoc>(doc)
  return resource as AnalyticsEventDoc
}

export async function listAnalyticsEvents(userId: string, limit = 20) {
  return await queryByUser<AnalyticsEventDoc>(
    CONTAINERS.analytics,
    userId,
    "SELECT * FROM c WHERE c.user_id = @userId ORDER BY c.created_at DESC OFFSET 0 LIMIT @limit",
    [{ name: "@limit", value: limit }],
  )
}
