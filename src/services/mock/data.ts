import type { Category, CategoryId, Product } from '../../features/products/types'

export const CATEGORIES: Category[] = [
  { id: '3c', name: '3C' }, { id: 'appliance', name: '家電' },
  { id: 'beauty', name: '美妝保養' }, { id: 'food', name: '食品/飲料' },
  { id: 'fashion', name: '流行時尚' }, { id: 'sports', name: '運動戶外' },
  { id: 'home', name: '居家生活' }, { id: 'baby', name: '母嬰用品' },
]

const NAMES: Record<CategoryId, string[]> = {
  '3c': ['真無線藍牙耳機', '降噪耳罩式耳機', '4K 行動螢幕', 'Type-C 100W 快充線', '電競滑鼠', '機械式鍵盤', '1TB 行動固態硬碟'],
  appliance: ['變頻空氣清淨機', '不鏽鋼快煮壺', '蒸氣掛燙機', '美型電暖器', '超靜音循環扇', '智慧電子鍋', '手持無線吸塵器'],
  beauty: ['保濕精華液 30ml', '防曬乳 SPF50+', '胺基酸洗面乳', '玻尿酸面膜 10 片', '霧面唇釉', '眼部修護霜', '護色洗髮精'],
  food: ['掛耳咖啡 30 入', '綜合堅果 500g', '即食雞胸肉 10 包', '黑豆茶 60 包', '燕麥餅乾禮盒', '冷凍藍莓 1kg', '蜂蜜檸檬醋'],
  fashion: ['oversize 落肩 T 恤', '高腰直筒牛仔褲', '輕量羽絨外套', '帆布托特包', '彈力休閒西裝褲', '針織開襟外套', '經典小白鞋'],
  sports: ['瑜珈墊 8mm', '可調式啞鈴 24kg', '運動緊身褲', '登山防水外套', '摺疊跑步機', '保冷水壺 1L', '羽球拍對拍組'],
  home: ['天絲四件式床包', '香氛擴香瓶', '整理收納箱 3 入', '記憶棉枕頭', '浴室置物架', '遮光窗簾', '原木餐桌墊'],
  baby: ['嬰兒紗布浴巾', '副食品調理機', '幼兒積木桌', '防脹氣奶瓶 3 入', '嬰兒推車', '寶寶爬行墊', '兒童安全座椅'],
}

const BRANDS: Record<CategoryId, string[]> = {
  '3c': ['SOUNDX', 'TechOne', 'AVIO'], appliance: ['HOMEPRO', '禾聯', 'AirMate'],
  beauty: ['LUMI', '雪肌坊', 'Dr.Pure'], food: ['山丘食研', 'Nutri+', '果然選'],
  fashion: ['UNITE', '植村衣所', 'MODA'], sports: ['FITLAB', '峰行', 'RUNUP'],
  home: ['好室集', 'NITORI 風', '木質研'], baby: ['mamaCare', '貝親選', 'KIDDO'],
}

function makeProduct(cat: CategoryId, i: number): Product {
  const id = `${cat}-${i + 1}`
  const brand = BRANDS[cat][i % 3]
  const name = NAMES[cat][i]
  const price = 290 + ((i * 97 + cat.length * 31) % 48) * 100 // 確定性價格 290–4990
  const hasPromo = i % 3 !== 0
  const image = `https://picsum.photos/seed/${id}/400/400`
  return {
    id, brand, name: `【${brand}】${name}`, category: cat,
    price, listPrice: hasPromo ? Math.round(price * 1.25) : undefined,
    image, images: [image, `https://picsum.photos/seed/${id}-b/400/400`, `https://picsum.photos/seed/${id}-c/400/400`],
    inStock: i !== 5, // 每分類第 6 筆缺貨（驗證邊界 UI）
    tags: hasPromo ? (i % 2 === 0 ? ['限時下殺'] : ['免運']) : [],
    specs: [`${brand} 原廠公司貨`, '7 天鑑賞期', '保固一年', '台灣出貨'],
    variant: i % 2 === 0 ? { label: '顏色', options: ['白色', '黑色', '粉色'] } : undefined,
  }
}

export const PRODUCTS: Product[] = CATEGORIES.flatMap(c =>
  Array.from({ length: 7 }, (_, i) => makeProduct(c.id, i)),
)
