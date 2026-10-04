import { describe, expect, it } from 'vitest'
import { cartReducer, cartTotal, cartCount, type CartItem } from './cartReducer'

const base = { productId: '3c-1', name: '耳機', price: 1000, image: 'x.jpg' }

describe('cartReducer', () => {
  it('add 新商品 → qty 1', () => {
    const s = cartReducer([], { type: 'add', item: base })
    expect(s).toEqual([{ ...base, qty: 1 }])
  })
  it('add 既有商品（同 variant）→ 合併數量', () => {
    const s0: CartItem[] = [{ ...base, variant: '白色', qty: 1 }]
    const s = cartReducer(s0, { type: 'add', item: { ...base, variant: '白色' }, qty: 2 })
    expect(s).toEqual([{ ...base, variant: '白色', qty: 3 }])
  })
  it('同商品不同 variant 視為不同列', () => {
    const s0: CartItem[] = [{ ...base, variant: '白色', qty: 1 }]
    const s = cartReducer(s0, { type: 'add', item: { ...base, variant: '黑色' } })
    expect(s).toHaveLength(2)
  })
  it('setQty 下限為 1', () => {
    const s0: CartItem[] = [{ ...base, qty: 2 }]
    const s = cartReducer(s0, { type: 'setQty', productId: '3c-1', qty: 0 })
    expect(s[0].qty).toBe(1)
  })
  it('remove 與 clear', () => {
    const s0: CartItem[] = [{ ...base, qty: 2 }]
    expect(cartReducer(s0, { type: 'remove', productId: '3c-1' })).toEqual([])
    expect(cartReducer(s0, { type: 'clear' })).toEqual([])
  })
  it('total 與 count', () => {
    const s: CartItem[] = [{ ...base, qty: 2 }, { ...base, productId: 'b', price: 500, qty: 1 }]
    expect(cartTotal(s)).toBe(2500)
    expect(cartCount(s)).toBe(3)
  })
})
