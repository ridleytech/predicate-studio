import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const styles: Record<Variant, string> = {
  primary: 'bg-slate-50 text-slate-900 hover:bg-white',
  secondary: 'bg-slate-800 text-slate-50 hover:bg-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

export default function Button({ variant = 'secondary', className, ...props }: Props) {
  return (
    <button
      {...props}
      className={[
        'inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition disabled:opacity-50',
        styles[variant],
        className ?? '',
      ].join(' ')}
    />
  )
}
