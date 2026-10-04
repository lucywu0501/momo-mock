import { Link } from 'react-router'

export interface Crumb { label: string; to?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-sm text-gray-400">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`}>
          {i > 0 && <span className="mx-1">\</span>}
          {c.to
            ? <Link to={c.to} className="hover:text-momo hover:underline">{c.label}</Link>
            : <b className="font-medium text-gray-700">{c.label}</b>}
        </span>
      ))}
    </nav>
  )
}
