'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node } from 'reactflow'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

import type { TraceEvent } from '@/types/trace'

type PersistedPolicyGraph = {
  nodes: Array<Node<any>>
  edges: Array<Edge>
}

type Props = {
  graph: PersistedPolicyGraph
  trace: TraceEvent[]
}

type NodeTone = 'neutral' | 'pass' | 'fail' | 'active_pass' | 'active_fail'

function toneToStyle(t: NodeTone): React.CSSProperties {
  switch (t) {
    case 'pass':
      return { border: '1px solid rgb(6 95 70)', boxShadow: '0 0 0 1px rgb(6 95 70)' }
    case 'fail':
      return { border: '1px solid rgb(153 27 27)', boxShadow: '0 0 0 1px rgb(153 27 27)' }
    case 'active_pass':
      return { border: '2px solid rgb(16 185 129)', boxShadow: '0 0 0 2px rgb(16 185 129 / 0.35)' }
    case 'active_fail':
      return { border: '2px solid rgb(248 113 113)', boxShadow: '0 0 0 2px rgb(248 113 113 / 0.35)' }
    default:
      return { border: '1px solid rgb(51 65 85)' }
  }
}

function matchNodeId(nodes: Array<Node<any>>, ev: TraceEvent): string | null {
  if (!ev.key) return null

  if (ev.type === 'condition') {
    const n = nodes.find((x) => x.data?.kind === 'condition' && x.data?.conditionType === ev.key)
    return n?.id ?? null
  }
  if (ev.type === 'logic') {
    const n = nodes.find((x) => x.data?.kind === 'logic' && x.data?.logicType === ev.key)
    return n?.id ?? null
  }
  if (ev.type === 'result') {
    const n = nodes.find((x) => x.data?.kind === 'result' && x.data?.decision === ev.key)
    return n?.id ?? null
  }

  return null
}

export default function TraceReplayFlow({ graph, trace }: Props) {
  const [idx, setIdx] = useState<number>(-1)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setIdx((cur) => {
        const next = cur + 1
        if (next >= trace.length) {
          setPlaying(false)
          return cur
        }
        return next
      })
    }, 650)
    return () => clearInterval(t)
  }, [playing, trace.length])

  const styledNodes = useMemo(() => {
    const nodes = graph.nodes

    const outcomes = new Map<string, NodeTone>()

    for (let i = 0; i <= idx; i++) {
      const ev = trace[i]
      if (!ev) continue
      const id = matchNodeId(nodes, ev)
      if (!id) continue
      const tone: NodeTone = ev.outcome === 'PASS' ? 'pass' : 'fail'
      outcomes.set(id, tone)
    }

    const active = idx >= 0 ? trace[idx] : null
    if (active) {
      const id = matchNodeId(nodes, active)
      if (id) {
        outcomes.set(id, active.outcome === 'PASS' ? 'active_pass' : 'active_fail')
      }
    }

    return nodes.map((n) => {
      const tone = outcomes.get(n.id) ?? 'neutral'
      return {
        ...n,
        style: {
          ...(n.style ?? {}),
          ...toneToStyle(tone),
          borderRadius: 10,
          padding: 0,
        },
      }
    })
  }, [graph.nodes, idx, trace])

  return (
    <div className="space-y-3">
      <Card title="Replay Controls">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIdx(-1)} variant="secondary">
            Reset
          </Button>
          <Button
            onClick={() => setIdx((v) => Math.max(-1, v - 1))}
            disabled={idx < 0}
            variant="secondary"
          >
            Prev
          </Button>
          <Button
            onClick={() => setIdx((v) => Math.min(trace.length - 1, v + 1))}
            disabled={idx >= trace.length - 1}
            variant="secondary"
          >
            Next
          </Button>
          <Button
            onClick={() => setPlaying((v) => !v)}
            disabled={trace.length === 0}
            variant="primary"
          >
            {playing ? 'Pause' : 'Play'}
          </Button>
          <div className="text-xs text-slate-400">
            Step: {Math.max(0, idx + 1)} / {trace.length}
          </div>
        </div>
      </Card>

      <Card title="Graph Replay">
        <div className="h-[520px] overflow-hidden rounded-lg border border-slate-800">
          <ReactFlow nodes={styledNodes} edges={graph.edges} fitView>
            <Background gap={16} size={1} color="#1f2937" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </Card>

      <Card title="Trace">
        {trace.length === 0 ? (
          <div className="text-sm text-slate-400">No trace available.</div>
        ) : (
          <div className="space-y-2">
            {trace.map((t, i) => (
              <div
                key={i}
                className={[
                  'flex items-start justify-between gap-3 rounded-md border px-3 py-2',
                  i === idx ? 'border-slate-600 bg-slate-900/40' : 'border-slate-800 bg-slate-950/40',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="text-sm text-slate-100">
                    {t.type}
                    {t.key ? `: ${t.key}` : ''}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">{t.message}</div>
                </div>
                <div className={t.outcome === 'PASS' ? 'text-xs text-emerald-300' : 'text-xs text-red-300'}>
                  {t.outcome}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
