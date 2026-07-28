export type Policy = {
  id: string
  name: string
  version: number
  policy: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreatePolicyRequest = {
  name: string
  policy: Record<string, unknown>
}

export type UpdatePolicyRequest = {
  name?: string
  policy?: Record<string, unknown>
}
