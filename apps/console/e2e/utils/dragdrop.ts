import type { Page, Locator } from '@playwright/test'

/**
 * Pointer-based drag-and-drop. Kanban/board libraries (dnd-kit,
 * react-beautiful-dnd) ignore a single mouse down→up and require a sequence of
 * intermediate pointer moves to register a drag, so this does:
 *   move to source → down → small nudge → stepped move to target → up.
 *
 * Use for tasks kanban, assessment question reorder, workflow-editor blocks.
 * (Helper only — no kanban spec consumes it yet; written without running.)
 */
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
  // A small nudge first — dnd-kit's activation constraint needs initial movement.
  await page.mouse.move(sx + 8, sy + 8, { steps: 5 })
  await page.mouse.move(tx, ty, { steps: 12 })
  // Settle on the target before releasing so the drop lands in the right column.
  await page.mouse.move(tx, ty, { steps: 3 })
  await page.mouse.up()
}
