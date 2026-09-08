import { test } from '@playwright/test'

import { RUN_ID } from './constants'

let counter = 0

/** Build a name that cannot collide with another worker's. */
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

export const uniqueRef = (prefix: string): string => uniqueName(prefix).replace(/\s+/g, '-')
