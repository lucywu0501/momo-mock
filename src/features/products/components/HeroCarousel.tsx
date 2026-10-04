import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { HeroBanner } from '../types'
import { Skeleton } from '../../../shared/ui/Skeleton'

const AUTOPLAY_MS = 4000

/**
 * 無限循環輪播：頭尾各放一張複製 slide（[最後張, ...全部, 第一張]），
 * 滑到複製品後在 transitionend 瞬間（關閉動畫）跳回對應的真實 slide，
 * 視覺上永遠朝同一方向循環。
 */
export function HeroCarousel() {
  const { data: banners } = useQuery({ queryKey: ['hero'], queryFn: api.getHeroBanners })
  const [pos, setPos] = useState(1)          // 在含複製品的軌道上的位置，1 = 第一張真實 slide
  const [animated, setAnimated] = useState(true)
  const [paused, setPaused] = useState(false)
  const moving = useRef(false)

  const n = banners?.length ?? 0

  const go = useCallback((delta: number) => {
    if (moving.current || !n) return
    moving.current = true
    setAnimated(true)
    setPos(p => p + delta)
  }, [n])

  useEffect(() => {
    if (!n || paused) return
    const t = setInterval(() => go(1), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [n, paused, go])

  if (!banners) return <Skeleton className="h-40 sm:h-56" />

  const track: HeroBanner[] = [banners[n - 1], ...banners, banners[0]]
  const activeDot = (pos - 1 + n) % n

  const handleTransitionEnd = () => {
    moving.current = false
    if (pos === n + 1) { setAnimated(false); setPos(1) }      // 滑到「第一張複製品」→ 跳回真第一張
    else if (pos === 0) { setAnimated(false); setPos(n) }     // 滑到「最後張複製品」→ 跳回真最後張
  }

  return (
    <div className="group relative h-40 overflow-hidden rounded-xl sm:h-56"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={`flex h-full ${animated ? 'transition-transform duration-500' : ''}`}
        style={{ transform: `translateX(-${pos * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}>
        {track.map((b, i) => (
          <Link key={`${b.id}-${i}`} to={b.href} aria-hidden={i !== pos}
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
          <button key={b.id} aria-label={`第 ${i + 1} 張`}
            onClick={() => { if (!moving.current) { setAnimated(true); setPos(i + 1) } }}
            className={`h-2 rounded-full transition-all ${i === activeDot ? 'w-5 bg-white' : 'w-2 bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
