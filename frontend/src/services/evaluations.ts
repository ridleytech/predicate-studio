import { apiFetch } from "./apiClient";
import type { Evaluation } from "@/types/evaluation";

export function listEvaluations(): Promise<Evaluation[]> {
  return apiFetch<Evaluation[]>("/evaluations");
}

export function getEvaluation(id: string): Promise<Evaluation> {
  return apiFetch<Evaluation>(`/evaluations/${id}`);
}
