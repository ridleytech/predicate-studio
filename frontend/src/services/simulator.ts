import { apiFetch } from './apiClient'
import type { Evaluation } from '@/types/evaluation'

export type EvaluateRequest = {
  policyId: string
  transaction: Record<string, unknown>
}

export function evaluatePolicy(req: EvaluateRequest): Promise<Evaluation> {
  return apiFetch<Evaluation>('/evaluate', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
