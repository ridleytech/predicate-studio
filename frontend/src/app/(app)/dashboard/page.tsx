'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '@/components/ui/Card'
import type { Evaluation } from '@/types/evaluation'
import { listEvaluations } from '@/services/evaluations'

type Metric = {
  label: string
  value: string
  subtext?: string
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        const items = await listEvaluations()
        if (!cancelled) setEvaluations(items)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load evaluations'
        if (!cancelled) setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const metrics = useMemo<Metric[]>(() => {
    const total = evaluations.length
    const approved = evaluations.filter((e) => e.decision?.toUpperCase() === 'APPROVE').length
    const denied = evaluations.filter((e) => e.decision?.toUpperCase() === 'DENY').length
    const approvalRate = total === 0 ? 0 : approved / total
    const avgLatency = total === 0 ? 0 : evaluations.reduce((acc, e) => acc + (e.latencyMs ?? 0), 0) / total

    return [
      { label: 'Total Evaluations', value: String(total) },
      { label: 'Approval Rate', value: formatPercent(approvalRate), subtext: `${approved} approved` },
      { label: 'Denials', value: String(denied) },
      { label: 'Avg Latency', value: `${avgLatency.toFixed(0)} ms` },
    ]
  }, [evaluations])

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>()
    for (const e of evaluations) {
      const iso = e.createdAt || ''
      const day = iso ? iso.slice(0, 10) : 'unknown'
      buckets.set(day, (buckets.get(day) ?? 0) + 1)
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }))
  }, [evaluations])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Overview of recent policy evaluations.</p>
      </div>

      {error ? (
        <Card title="Error">
          <div className="text-sm text-red-300">{error}</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-50">{m.value}</div>
            {m.subtext ? <div className="mt-1 text-xs text-slate-500">{m.subtext}</div> : null}
          </Card>
        ))}
      </div>

      <Card title="Evaluations (last 14 days)">
        <div className="h-64">
          {loading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937', color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  )
}
