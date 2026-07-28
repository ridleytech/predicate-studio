import { apiFetch } from './apiClient'
import type { AuthorizeResponse } from '@/types/authorization'

export type AuthorizeRequest = {
  evaluationId: string
  subject: string
  ttlSeconds?: number
}

export function authorize(req: AuthorizeRequest): Promise<AuthorizeResponse> {
  return apiFetch<AuthorizeResponse>('/authorize', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
