import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const style = variant === 'primary'
    ? 'bg-momo text-white hover:opacity-90'
    : 'border border-momo text-momo hover:bg-momo/5'
  return <button className={`rounded px-4 py-2 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${style} ${className}`} {...rest} />
}
