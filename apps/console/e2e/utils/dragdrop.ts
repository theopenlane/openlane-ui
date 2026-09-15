import type { Page, Locator } from '@playwright/test'

/** Pointer-based drag-and-drop. dnd-kit ignores a bare down→up; it needs intermediate move events. */
export const dragTo = async (page: Page, source: Locator, target: Locator): Promise<void> => {
  const s = await source.boundingBox()
  const t = await target.boundingBox()
  if (!s || !t) throw new Error('dragTo: source or target has no bounding box (not visible?)')

  const sx = s.x + s.width / 2
  const sy = s.y + s.height / 2
  const tx = t.x + t.width / 2
  const ty = t.y + t.height / 2

  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(sx + 8, sy + 8, { steps: 5 })
  await page.mouse.move(tx, ty, { steps: 12 })
  await page.mouse.move(tx, ty, { steps: 3 })
  await page.mouse.up()
}
