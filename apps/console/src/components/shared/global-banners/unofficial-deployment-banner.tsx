'use client'

import { useEffect } from 'react'
import { useIsOfficialDeployment } from '@repo/ui/lib/official-deployment'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import { BOTTOM_BANNER_HEIGHT_VAR, SIDEBAR_WIDTH_VAR } from '@/constants/layout'

const AFFILIATION = 'This instance is not operated by or affiliated with Openlane'
const TRADEMARKS = 'Openlane branding and trademarks are not licensed for third-party use.'
const BANNER_HEIGHT = '24px'

const UnofficialDeploymentBanner = () => {
  const isOfficial = useIsOfficialDeployment()

  useEffect(() => {
    if (isOfficial) return

    const root = document.documentElement
    root.style.setProperty(BOTTOM_BANNER_HEIGHT_VAR, BANNER_HEIGHT)

    return () => {
      root.style.removeProperty(BOTTOM_BANNER_HEIGHT_VAR)
    }
  }, [isOfficial])

  if (isOfficial) {
    return null
  }

  return (
    <div
      role="status"
      title={`Unofficial Openlane deployment. ${AFFILIATION}. ${TRADEMARKS}`}
      style={{ left: `var(${SIDEBAR_WIDTH_VAR}, 0px)`, height: BANNER_HEIGHT }}
      className="fixed bottom-0 right-0 z-30 flex items-center justify-center truncate bg-background px-4 text-xs text-muted-foreground transition-[left] duration-200"
    >
      <span className="truncate">
        <span className="font-medium text-brand">Unofficial Openlane deployment.</span> This instance is not operated by or affiliated with{' '}
        <a href={OPENLANE_WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          Openlane
        </a>
        . {TRADEMARKS}
      </span>
    </div>
  )
}

export default UnofficialDeploymentBanner
