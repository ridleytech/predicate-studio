export type TraceOutcome = 'PASS' | 'FAIL'

export type TraceEvent = {
  type: string
  key?: string
  outcome: TraceOutcome
  message: string
}
