import { apiFetch } from './apiClient'
import type { CreatePolicyRequest, Policy, UpdatePolicyRequest } from '@/types/policy'

export function listPolicies(): Promise<Policy[]> {
  return apiFetch<Policy[]>('/policies')
}

export function createPolicy(req: CreatePolicyRequest): Promise<Policy> {
  return apiFetch<Policy>('/policies', { method: 'POST', body: JSON.stringify(req) })
}

export function getPolicy(id: string): Promise<Policy> {
  return apiFetch<Policy>(`/policies/${id}`)
}

export function updatePolicy(id: string, req: UpdatePolicyRequest): Promise<Policy> {
  return apiFetch<Policy>(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(req) })
}

export function deletePolicy(id: string): Promise<void> {
  return apiFetch<void>(`/policies/${id}`, { method: 'DELETE' })
}
