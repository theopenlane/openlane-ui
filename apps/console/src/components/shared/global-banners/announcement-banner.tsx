'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { announcementLinkLabel, announcementLinkUrl, announcementMessage, hasAnnouncement } from '@/lib/announcement-banner'
import { getDismissedAnnouncement, recordDismissedAnnouncement } from '@/lib/storage/announcement-dismissal'

const AnnouncementBanner = () => {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(getDismissedAnnouncement() === announcementMessage)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    recordDismissedAnnouncement(announcementMessage)
  }

  if (!hasAnnouncement || dismissed) {
    return null
  }

  return (
    <div role="status" className="relative flex items-center justify-center bg-warning px-10 py-2 text-sm font-medium text-black">
      <p className="text-center">
        {announcementMessage}{' '}
        <a href={announcementLinkUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {announcementLinkLabel}
        </a>
      </p>
      <button type="button" onClick={handleDismiss} aria-label="Dismiss announcement" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-black/70 hover:text-black">
        <X size={16} />
      </button>
    </div>
  )
}

export default AnnouncementBanner
