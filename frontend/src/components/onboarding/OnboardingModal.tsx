'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

const STORAGE_KEY = 'pds_onboarding_v1_completed'

type Step = {
  title: string
  body: string
  ctaLabel: string
  href: string
}

const steps: Step[] = [
  {
    title: 'Welcome to Predicate Developer Studio',
    body: 'This app lets you build a policy, simulate a transaction, and (optionally) execute a protected on-chain action using a backend-signed authorization. You can follow these steps in order and you will have working screenshots in a few minutes.',
    ctaLabel: 'Go to Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Policy Builder (the “why” behind approvals)',
    body: 'Policies are visual graphs. Start by opening an existing policy, then click nodes to see what they do in the Inspector. A Condition node checks something (KYC, country, max amount). Logic nodes combine conditions (AND/OR). A Result node returns APPROVE or DENY.',
    ctaLabel: 'Go to Policy Builder',
    href: '/policy-builder',
  },
  {
    title: 'Simulator (the fastest way to understand the system)',
    body: 'Pick a policy, paste a transaction JSON, and click Run Simulation. You will get a Decision, a short Reason, and a detailed Trace. For APPROVE decisions you can also generate an Authorization (a signed approval token) and then execute the protected contract method using your wallet.',
    ctaLabel: 'Go to Simulator',
    href: '/simulator',
  },
  {
    title: 'Audit Explorer (what happened, when, and why)',
    body: 'Every policy create/update and every evaluation/authorization can be recorded as an audit event. Use this page to show activity history and open evaluation replays for screenshots.',
    ctaLabel: 'Go to Audit Explorer',
    href: '/audit',
  },
]

function readCompleted(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === 'true'
}

function writeCompleted(v: boolean) {
  window.localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false')
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!isOpen) setIdx(0)
  }, [isOpen])

  const step = steps[idx]!
  const isFirst = idx === 0
  const isLast = idx === steps.length - 1

  const canNavigate = useMemo(() => pathname !== step.href, [pathname, step.href])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-950 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Getting Started
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-100">{step.title}</div>
            <div className="mt-2 text-sm text-slate-300">Step {idx + 1} of {steps.length}</div>
          </div>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="text-sm leading-6 text-slate-200">{step.body}</div>

          <div className="rounded-md border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended next click</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  router.push(step.href)
                }}
                variant="primary"
                disabled={!canNavigate}
              >
                {step.ctaLabel}
              </Button>
              <div className="text-xs text-slate-400">Current page: {pathname}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 p-5">
          <div className="flex items-center gap-2">
            <Button onClick={() => setIdx((v) => Math.max(0, v - 1))} disabled={isFirst}>
              Back
            </Button>
            <Button onClick={() => setIdx((v) => Math.min(steps.length - 1, v + 1))} disabled={isLast}>
              Next
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                writeCompleted(false)
                onClose()
              }}
            >
              Show on next visit
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                writeCompleted(true)
                onComplete()
              }}
            >
              {isLast ? 'Finish' : 'Finish early'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useOnboarding() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!readCompleted()) setOpen(true)
  }, [])

  return {
    open,
    setOpen,
    markComplete: () => {
      writeCompleted(true)
      setOpen(false)
    },
    reset: () => {
      writeCompleted(false)
      setOpen(true)
    },
  }
}
