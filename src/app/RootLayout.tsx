import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { Search, ShoppingCart } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useCart } from '../features/cart/hooks/useCart'
import { MiniCart } from '../features/cart/components/MiniCart'
import { CategoryNav } from './CategoryNav'
import { analytics } from '../services/analytics'

export default function RootLayout() {
  const { count } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => { analytics.track({ type: 'page_view', path: pathname }) }, [pathname])
  const [kw, setKw] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (kw.trim()) navigate(`/search/${encodeURIComponent(kw.trim())}`)
  }
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="hidden bg-gray-100 text-xs text-gray-500 sm:block">
        <div className="mx-auto flex max-w-6xl justify-between px-4 py-1">
          <span>回首頁｜APP下載｜書店</span><span>登入｜註冊｜會員中心｜查訂單</span>
        </div>
      </div>
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 flex-col items-start leading-none">
            <span className="text-3xl font-black tracking-tight text-momo" style={{ fontFamily: "'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', system-ui" }}>momo</span>
            <span className="text-[11px] font-bold text-momo">全站超取$290免運 ✦</span>
          </Link>
          <form onSubmit={submit} className="flex max-w-xl flex-1 overflow-hidden rounded-full border border-gray-300 bg-gray-100 focus-within:border-gray-500">
            <input value={kw} onChange={e => setKw(e.target.value)} placeholder="請輸入關鍵字或品號"
              className="min-w-0 flex-1 bg-transparent px-4 py-1.5 outline-none" />
            <button aria-label="搜尋" className="flex items-center gap-1 rounded-full bg-gray-600 px-6 font-bold text-white hover:bg-gray-700">
              <Search size={16} />搜尋
            </button>
          </form>
          <Link to="/cart" aria-label="購物車" className="relative shrink-0 text-gray-600">
            <ShoppingCart />
            {count > 0 && (
              <span data-testid="cart-badge" className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-momo px-1 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
        <CategoryNav />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <MiniCart />
      <footer className="mt-12 border-t bg-white py-6 text-center text-xs text-gray-400">
        <p>momo mock — Frontend take-home（純前端練習，非商業用途）</p>
        <Link to="/stats" className="mt-1 inline-block underline hover:text-momo">站內統計</Link>
      </footer>
    </div>
  )
}
