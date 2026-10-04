import { expect, test } from '@playwright/test'

// 確定性 mock：搜尋「耳機」命中 6 件，第一件為 3c-1（有顏色規格、有庫存、$1,690）
test('搜尋 → 商品 → 加入購物車 → 購物車調量 → 重整後持久，且記錄 add_to_cart 事件', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('請輸入關鍵字或品號').fill('耳機')
  await page.getByRole('button', { name: '搜尋' }).click()

  await expect(page).toHaveURL(/\/search\//)
  await expect(page.getByText('共 6 件商品')).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: /耳機/ }).first().click()
  await expect(page).toHaveURL(/\/goods\/3c-1$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('真無線藍牙耳機')

  await page.getByRole('button', { name: '黑色' }).click()
  await page.getByRole('button', { name: '增加數量' }).click()
  await page.getByRole('button', { name: '加入購物車' }).click()
  await expect(page.getByRole('button', { name: '✓ 已加入' })).toBeVisible()
  await expect(page.getByTestId('cart-badge')).toHaveText('2')

  await page.getByRole('link', { name: '購物車' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('購物車（1 項）')
  await expect(page.getByText('黑色')).toBeVisible()

  await page.getByRole('button', { name: '增加數量' }).click()
  await expect(page.getByTestId('cart-badge')).toHaveText('3')
  // 3 × $1,690 = $5,070；MiniCart 也會顯示同一金額，所以限定在總計側欄內找
  await expect(page.locator('aside', { hasText: '商品總計' }).getByText('$5,070')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('購物車（1 項）')
  await expect(page.getByTestId('cart-badge')).toHaveText('3')

  const events = await page.evaluate(() => JSON.parse(localStorage.getItem('momo-mock.analytics.v1') ?? '[]') as Array<Record<string, unknown>>)
  expect(events).toContainEqual(expect.objectContaining({ type: 'add_to_cart', productId: '3c-1', variant: '黑色', qty: 2 }))
})
