'use client'

import type { ReactNode } from 'react'

type Props = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
}

export default function Tooltip({ content, children, side = 'top' }: Props) {
  const pos =
    side === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2'

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className={[
          'pointer-events-none absolute z-50 hidden max-w-xs rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-lg',
          'group-hover:block',
          pos,
        ].join(' ')}
      >
        {content}
      </span>
    </span>
  )
}
