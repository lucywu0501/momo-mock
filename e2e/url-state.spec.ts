import { expect, test } from '@playwright/test'

// 「3C」命中整個 3C 分類 21 件（PAGE_SIZE 20 → 2 頁）；priceAsc 最低價 $1,690、第 2 頁唯一一件 $3,690
test('直連帶 sort 的搜尋網址會還原排序，分頁與 URL 同步', async ({ page }) => {
  await page.goto('/search/3C?sort=priceAsc')
  await expect(page.getByText('共 21 件商品')).toBeVisible()
  await expect(page.getByRole('button', { name: '價格由低到高' })).toHaveAttribute('aria-pressed', 'true')

  const grid = page.getByRole('main')
  const firstCard = grid.getByRole('link', { name: /【/ }).first()
  await expect(firstCard).toContainText('$1,690')

  await page.getByRole('button', { name: '下一頁' }).click()
  await expect(page).toHaveURL(/sort=priceAsc/)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('頁數 2/2')).toBeVisible()
  await expect(grid.getByRole('link', { name: /【/ })).toHaveCount(1)
  await expect(grid.getByRole('link', { name: /【/ })).toContainText('$3,690')
  await expect(page.getByRole('button', { name: '下一頁' })).toBeDisabled()
})

test('切換排序會回到第 1 頁', async ({ page }) => {
  await page.goto('/search/3C?sort=priceAsc&page=2')
  await expect(page.getByText('頁數 2/2')).toBeVisible()
  await page.getByRole('button', { name: '價格由高到低' }).click()
  await expect(page).toHaveURL(/sort=priceDesc/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByText('頁數 1/2')).toBeVisible()
})
