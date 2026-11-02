'use client'

import { useEffect, useRef } from 'react'
import { devrevChatEnabled } from '@repo/dally/auth'
import { useIsOfficialDeployment } from '@repo/ui/lib/official-deployment'
import AnnouncementBanner from './announcement-banner'
import { hasAnnouncement } from '@/lib/announcement-banner'
import { useElementHeight } from '@/hooks/useElementHeight'
import { DEVREV_BANNER_CONTAINER_ID, GLOBAL_BANNER_HEIGHT_VAR } from '@/constants/layout'

const GlobalBanners = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const height = useElementHeight(containerRef)
  const isOfficial = useIsOfficialDeployment()
  const showDevrev = devrevChatEnabled && isOfficial

  useEffect(() => {
    const root = document.documentElement

    if (height > 0) {
      root.style.setProperty(GLOBAL_BANNER_HEIGHT_VAR, `${height}px`)
    } else {
      root.style.removeProperty(GLOBAL_BANNER_HEIGHT_VAR)
    }

    return () => {
      root.style.removeProperty(GLOBAL_BANNER_HEIGHT_VAR)
    }
  }, [height])

  if (!hasAnnouncement && !showDevrev) {
    return null
  }

  return (
    <div ref={containerRef} className="fixed top-0 left-0 right-0 z-40">
      <AnnouncementBanner />
      {showDevrev && <div id={DEVREV_BANNER_CONTAINER_ID} />}
    </div>
  )
}

export default GlobalBanners
