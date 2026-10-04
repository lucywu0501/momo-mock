import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { ProductSummary } from '../../../services/api'

export interface DiscoverEntry {
  id: string
  title: string
  intro: string
  products: ProductSummary[]
}

// 內容導購 feed：以既有 service 組合出「主題文章＋推薦商品」的輕量資料形狀，
// 不新增 mock 來源 —— 示範新 feature 僅消費既有資料層即可成立。
export function useDiscoverFeed() {
  return useQuery({
    queryKey: ['discover'],
    queryFn: async (): Promise<DiscoverEntry[]> => {
      const [sports, home, food] = await Promise.all([
        api.searchProducts({ keyword: '', category: 'sports' }),
        api.searchProducts({ keyword: '', category: 'home' }),
        api.searchProducts({ keyword: '', category: 'food' }),
      ])
      return [
        { id: 'fit', title: '在家練出好狀態', intro: '不用上健身房，從瑜珈墊到可調啞鈴，小空間也能動起來。', products: sports.items.slice(0, 4) },
        { id: 'cozy', title: '把臥室變成飯店', intro: '天絲床包＋記憶棉枕頭，睡眠品質立刻升級。', products: home.items.slice(0, 4) },
        { id: 'brew', title: '辦公室咖啡自救指南', intro: '掛耳咖啡與點心常備清單，下午三點不再斷電。', products: food.items.slice(0, 4) },
      ]
    },
  })
}
