import { expect, test } from '@playwright/test'

test('不存在的商品顯示無展售訊息，而非白屏或全域錯誤', async ({ page }) => {
  await page.goto('/goods/nope')
  await expect(page.getByText('很抱歉！此商品目前無展售')).toBeVisible()
  await page.getByRole('link', { name: '回首頁逛逛' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('未知路由顯示 404 頁', async ({ page }) => {
  await page.goto('/no/such/page')
  await expect(page.getByText('404')).toBeVisible()
  await expect(page.getByText('找不到這個頁面')).toBeVisible()
})
