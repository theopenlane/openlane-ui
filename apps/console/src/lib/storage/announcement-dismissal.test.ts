import { getDismissedAnnouncement, recordDismissedAnnouncement } from './announcement-dismissal'

/**
 * ISS-2770 — the announcement banner remembers a dismissal by storing the
 * MESSAGE, not a boolean. That is what makes a NEW announcement reappear for
 * someone who dismissed the previous one: the banner compares the stored string
 * against the current message rather than checking a dismissed flag.
 *
 * Not org-scoped, deliberately — an announcement is global to the deployment.
 */

const store = new Map<string, string>()

const globals = globalThis as unknown as { window?: unknown; localStorage?: unknown }
const originalWindow = globals.window
const originalLocalStorage = globals.localStorage

const workingStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
}

globals.window = globalThis
globals.localStorage = workingStorage

afterAll(() => {
  globals.window = originalWindow
  globals.localStorage = originalLocalStorage
})

beforeEach(() => {
  store.clear()
  globals.localStorage = workingStorage
})

describe('announcement dismissal', () => {
  test('reads null before anything is dismissed', () => {
    expect(getDismissedAnnouncement()).toBeNull()
  })

  test('records and reads back the dismissed message', () => {
    recordDismissedAnnouncement('Scheduled maintenance on Friday')

    expect(getDismissedAnnouncement()).toBe('Scheduled maintenance on Friday')
  })

  test('a newer announcement replaces the stored one', () => {
    // The banner compares stored-vs-current, so a new message must not read as
    // already dismissed.
    recordDismissedAnnouncement('Old announcement')
    recordDismissedAnnouncement('New announcement')

    expect(getDismissedAnnouncement()).toBe('New announcement')
    expect(getDismissedAnnouncement()).not.toBe('Old announcement')
  })

  test('stores an empty message without collapsing it to null', () => {
    recordDismissedAnnouncement('')

    expect(getDismissedAnnouncement()).toBe('')
  })
})

describe('when localStorage throws', () => {
  beforeEach(() => {
    globals.localStorage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    }
  })

  test('reading degrades to null rather than throwing', () => {
    expect(() => getDismissedAnnouncement()).not.toThrow()
    expect(getDismissedAnnouncement()).toBeNull()
  })

  test('recording swallows the failure', () => {
    // Worst case the banner reappears; it must never break the page shell.
    expect(() => recordDismissedAnnouncement('anything')).not.toThrow()
  })
})
