import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from './features/cart/store/CartContext'
import { router } from './app/router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Suspense fallback={<div className="p-12 text-center text-gray-400">載入中…</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </CartProvider>
    </QueryClientProvider>
  </StrictMode>,
)
