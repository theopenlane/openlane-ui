import { announcementBannerEnabled, announcementBannerLinkLabel, announcementBannerLinkUrl, announcementBannerMessage } from '@repo/dally/auth'
import { STATUS_PAGE_URL } from '@/constants'

const DEFAULT_LINK_LABEL = 'View status page'

const toHttpUrl = (value: string | undefined): string | null => {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

export const announcementMessage = announcementBannerMessage?.trim() ?? ''
export const announcementLinkUrl = toHttpUrl(announcementBannerLinkUrl?.trim()) ?? STATUS_PAGE_URL
export const announcementLinkLabel = announcementBannerLinkLabel?.trim() || DEFAULT_LINK_LABEL
export const hasAnnouncement = announcementBannerEnabled && announcementMessage.length > 0
