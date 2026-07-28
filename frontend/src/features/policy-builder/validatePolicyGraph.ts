import type { PolicyGraph, PolicyNodeData } from './types'

export type ValidationIssue = {
  level: 'error' | 'warning'
  message: string
}

export function validatePolicyGraph(graph: PolicyGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  const triggers = graph.nodes.filter((n) => (n.data as PolicyNodeData).kind === 'trigger')
  const results = graph.nodes.filter((n) => (n.data as PolicyNodeData).kind === 'result')

  if (triggers.length !== 1) {
    issues.push({ level: 'error', message: 'Graph must contain exactly one Trigger node.' })
  }
  if (results.length < 1) {
    issues.push({ level: 'error', message: 'Graph must contain at least one Result node.' })
  }

  const nodeIds = new Set(graph.nodes.map((n) => n.id))
  for (const e of graph.edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
      issues.push({ level: 'error', message: 'Graph contains an edge with a missing source or target.' })
      break
    }
  }

  // Basic connectivity: all nodes should be reachable from the Trigger if it exists.
  if (triggers.length === 1) {
    const start = triggers[0]!.id
    const adj = new Map<string, string[]>()
    for (const n of graph.nodes) adj.set(n.id, [])
    for (const e of graph.edges) {
      adj.get(e.source)?.push(e.target)
    }

    const visited = new Set<string>()
    const stack = [start]
    while (stack.length) {
      const cur = stack.pop()!
      if (visited.has(cur)) continue
      visited.add(cur)
      for (const nxt of adj.get(cur) ?? []) stack.push(nxt)
    }

    const disconnected = graph.nodes.filter((n) => !visited.has(n.id))
    if (disconnected.length > 0) {
      issues.push({ level: 'warning', message: 'Some nodes are disconnected from the Trigger.' })
    }
  }

  return issues
}
