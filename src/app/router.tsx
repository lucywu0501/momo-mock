import { createBrowserRouter } from 'react-router'
import { lazy } from 'react'
import RootLayout from './RootLayout'

const HomePage = lazy(() => import('../pages/HomePage'))
const SearchPage = lazy(() => import('../pages/SearchPage'))
const GoodsPage = lazy(() => import('../pages/GoodsPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const DiscoverPage = lazy(() => import('../pages/DiscoverPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export const router = createBrowserRouter([
  {
    path: '/', element: <RootLayout />,
    errorElement: <div className="p-12 text-center">頁面發生錯誤，請重新整理。</div>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search/:keyword', element: <SearchPage /> },
      { path: 'goods/:goodsId', element: <GoodsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
