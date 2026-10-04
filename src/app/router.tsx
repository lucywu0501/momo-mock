import { createBrowserRouter } from 'react-router'
import { lazy } from 'react'
import RootLayout from './RootLayout'
import { RouteError } from './RouteError'

const HomePage = lazy(() => import('../pages/HomePage'))
const SearchPage = lazy(() => import('../pages/SearchPage'))
const GoodsPage = lazy(() => import('../pages/GoodsPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const DiscoverPage = lazy(() => import('../pages/DiscoverPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export const router = createBrowserRouter([
  {
    path: '/', element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search/:keyword', element: <SearchPage /> },
      { path: 'goods/:goodsId', element: <GoodsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })
