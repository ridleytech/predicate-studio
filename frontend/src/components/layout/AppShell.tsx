'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/policy-builder', label: 'Policy Builder' },
  { href: '/simulator', label: 'Policy Simulator' },
  { href: '/audit', label: 'Audit Explorer' },
  { href: '/settings', label: 'Settings' },
]

export default function AppShell({ children }: Props) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 px-4 py-4 md:block">
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Predicate
          </div>
          <div className="px-2 pb-3 text-sm font-semibold text-slate-100">
            Developer Studio
          </div>

          <nav className="mt-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'block rounded-md px-3 py-2 text-sm',
                    active
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-50',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
            <div className="text-sm font-semibold text-slate-100">Predicate Developer Studio</div>
            <div className="text-xs text-slate-400">PoC</div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
