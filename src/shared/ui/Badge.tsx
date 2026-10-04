import type { ReactNode } from 'react'
export function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-sm bg-momo px-1.5 py-0.5 text-xs text-white">{children}</span>
}
