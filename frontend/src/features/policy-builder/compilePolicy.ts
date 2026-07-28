import type { PolicyGraph, PolicyNodeData, CompiledPolicy, ConditionData, LogicData, ResultData } from './types'

export class CompileError extends Error {}

function nodeById(graph: PolicyGraph, id: string) {
  const n = graph.nodes.find((x) => x.id === id)
  if (!n) throw new CompileError(`Missing node: ${id}`)
  return n
}

function outgoing(graph: PolicyGraph, id: string): string[] {
  return graph.edges.filter((e) => e.source === id).map((e) => e.target)
}

export function compilePolicy(graph: PolicyGraph): CompiledPolicy {
  const trigger = graph.nodes.find((n) => (n.data as PolicyNodeData).kind === 'trigger')
  if (!trigger) throw new CompileError('Missing Trigger node')

  const visited = new Set<string>()

  function walk(nodeId: string): CompiledPolicy {
    if (visited.has(nodeId)) {
      throw new CompileError('Cycle detected in policy graph')
    }
    visited.add(nodeId)

    const n = nodeById(graph, nodeId)
    const data = n.data as PolicyNodeData

    if (data.kind === 'condition') {
      const cd = data as ConditionData
      const next = outgoing(graph, nodeId)
      if (next.length !== 1) throw new CompileError('Condition must have exactly one outgoing connection')
      const child = walk(next[0]!)
      // Conditions are treated as gates that must pass before continuing.
      // For Phase 5 we’ll interpret this as: evaluate condition, then evaluate child.
      return { type: 'and', rules: [{ type: 'condition', key: cd.conditionType, params: cd.params }, child] }
    }

    if (data.kind === 'logic') {
      const ld = data as LogicData
      const next = outgoing(graph, nodeId)
      if (next.length < 2) throw new CompileError('Logic node must have at least two outgoing connections')
      return { type: ld.logicType, rules: next.map((id) => walk(id)) }
    }

    if (data.kind === 'result') {
      const rd = data as ResultData
      return { type: 'result', decision: rd.decision }
    }

    // trigger
    const next = outgoing(graph, nodeId)
    if (next.length !== 1) throw new CompileError('Trigger must have exactly one outgoing connection')
    return walk(next[0]!)
  }

  return walk(trigger.id)
}
