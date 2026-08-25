import { test } from '@playwright/test'

import { RUN_ID } from './constants'

let counter = 0

/**
 * Build a name that cannot collide with another worker's, and that points back
 * at the attempt that made it.
 *
 * Specs used to roll their own `${RUN_ID} ${Date.now().toString(36)}` (plus, in
 * a few files, a module-level counter). Both are per-process: every worker
 * starts its counter at 0, and eight workers seeding at once routinely land in
 * the same millisecond. Two records sharing a "unique" name make
 * search-then-assert tests operate on the wrong row.
 *
 * The worker/retry segment comes from Playwright's own TestInfo rather than the
 * TEST_WORKER_INDEX env var, which would have to be declared in turbo.json.
 * Outside a running test there is no TestInfo, so fall back to a static segment
 * — the counter and salt still keep the name unique.
 */
const attempt = (): string => {
  try {
    const info = test.info()
    return `w${info.workerIndex}r${info.retry}`
  } catch {
    return 'w-'
  }
}

export const uniqueName = (prefix: string): string => {
  counter += 1
  const salt = Math.random().toString(36).slice(2, 6)
  return `${prefix} ${RUN_ID} ${attempt()}-${counter}-${salt}`
}

/** Dash-joined form, for identifiers that must not contain spaces (ref codes). */
export const uniqueRef = (prefix: string): string => uniqueName(prefix).replace(/\s+/g, '-')
