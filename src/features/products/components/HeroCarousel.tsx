import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import { Skeleton } from '../../../shared/ui/Skeleton'

const AUTOPLAY_MS = 4000

export function HeroCarousel() {
  const { data: banners } = useQuery({ queryKey: ['hero'], queryFn: api.getHeroBanners })
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!banners || paused) return
    const t = setInterval(() => setIndex(i => (i + 1) % banners.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [banners, paused])

  if (!banners) return <Skeleton className="h-40 sm:h-56" />

  const go = (delta: number) => setIndex(i => (i + delta + banners.length) % banners.length)

  return (
    <div className="group relative h-40 overflow-hidden rounded-xl sm:h-56"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex h-full transition-transform duration-500"
        style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map(b => (
          <Link key={b.id} to={b.href}
            className="grid h-full w-full shrink-0 place-items-center text-center text-white"
            style={{ backgroundImage: `linear-gradient(105deg, ${b.gradient[0]}, ${b.gradient[1]})` }}>
            <span>
              <span className="block text-2xl font-black sm:text-4xl">{b.title}</span>
              <span className="mt-1 block text-sm opacity-90 sm:text-base">{b.subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
      <button aria-label="上一張" onClick={() => go(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
        <ChevronLeft size={20} />
      </button>
      <button aria-label="下一張" onClick={() => go(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
        <ChevronRight size={20} />
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {banners.map((b, i) => (
          <button key={b.id} aria-label={`第 ${i + 1} 張`} onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-2 bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
