import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: Props) {
  return (
    <input
      {...props}
      className={[
        'h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-slate-600',
        className ?? '',
      ].join(' ')}
    />
  )
}
