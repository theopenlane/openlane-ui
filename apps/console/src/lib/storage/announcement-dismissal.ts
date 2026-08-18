const ANNOUNCEMENT_DISMISSED_KEY = 'announcement-banner-dismissed'

export const getDismissedAnnouncement = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY)
  } catch {
    return null
  }
}

export const recordDismissedAnnouncement = (message: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, message)
  } catch {
    return
  }
}
