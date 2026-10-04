import { useEffect } from 'react'
import { Link, useLocation, useRouteError } from 'react-router'
import { analytics } from '../services/analytics'

/** router 層級的錯誤畫面：顯示友善訊息並記錄 error 事件（runtime observability 的 mock 實作） */
export function RouteError() {
  const error = useRouteError()
  const { pathname } = useLocation()
  useEffect(() => {
    analytics.track({ type: 'error', message: error instanceof Error ? error.message : String(error), path: pathname })
  }, [error, pathname])
  return (
    <div className="py-24 text-center">
      <p className="text-xl font-bold">頁面發生錯誤，請重新整理。</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">回首頁</Link>
    </div>
  )
}
