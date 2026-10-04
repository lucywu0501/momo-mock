import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { cartCount, cartReducer, cartTotal, type CartAction, type CartItem } from './cartReducer'

const STORAGE_KEY = 'momo-mock.cart.v1'

function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export interface CartValue {
  items: CartItem[]; total: number; count: number
  dispatch: React.Dispatch<CartAction>
}

export const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, load)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }, [items])
  const value = useMemo(
    () => ({ items, dispatch, total: cartTotal(items), count: cartCount(items) }), [items])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
