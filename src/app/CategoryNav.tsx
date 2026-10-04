import { NavLink } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
    isActive ? 'border-momo text-momo' : 'border-transparent hover:text-momo'
  }`

export function CategoryNav() {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })
  return (
    <nav className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl items-center overflow-x-auto px-4">
        <NavLink to="/" end className={linkClass}>首頁</NavLink>
        <NavLink to="/discover" className={linkClass}>發現好物</NavLink>
        {categories?.map(c => (
          <NavLink key={c.id} to={`/search/${c.name}`} className={linkClass}>{c.name}</NavLink>
        ))}
      </div>
    </nav>
  )
}
