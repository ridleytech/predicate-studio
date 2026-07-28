import type { Edge, Node } from 'reactflow'

export type PolicyNodeKind =
  | 'trigger'
  | 'condition'
  | 'logic'
  | 'result'

export type ConditionType =
  | 'wallet_kyc'
  | 'wallet_allow_list'
  | 'wallet_deny_list'
  | 'country'
  | 'risk_score'
  | 'max_amount'

export type LogicType = 'and' | 'or'
export type ResultDecision = 'APPROVE' | 'DENY'

export type TriggerData = {
  kind: 'trigger'
  label: string
}

export type ConditionData = {
  kind: 'condition'
  label: string
  conditionType: ConditionType
  params: Record<string, unknown>
}

export type LogicData = {
  kind: 'logic'
  label: string
  logicType: LogicType
}

export type ResultData = {
  kind: 'result'
  label: string
  decision: ResultDecision
}

export type PolicyNodeData = TriggerData | ConditionData | LogicData | ResultData

export type PolicyNode = Node<PolicyNodeData>
export type PolicyEdge = Edge

export type PolicyGraph = {
  nodes: PolicyNode[]
  edges: PolicyEdge[]
}

export type CompiledPolicy =
  | { type: 'and' | 'or'; rules: CompiledPolicy[] }
  | { type: 'condition'; key: ConditionType; params: Record<string, unknown> }
  | { type: 'result'; decision: ResultDecision }

export type PersistedPolicy = {
  schemaVersion: 1
  graph: PolicyGraph
  compiled: CompiledPolicy
}
