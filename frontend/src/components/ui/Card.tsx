import type { ReactNode } from 'react'

type Props = {
  title?: string
  children: ReactNode
}

export default function Card({ title, children }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      {title ? <div className="mb-3 text-sm font-semibold text-slate-100">{title}</div> : null}
      {children}
    </div>
  )
}
