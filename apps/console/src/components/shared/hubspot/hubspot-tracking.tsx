'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const HUBSPOT_PORTAL_ID = '246070700'
const HUBSPOT_SCRIPT_SRC = `https://js-na2.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`

const TRACKED_PATHS = new Set(['/login', '/signup'])
const MARKETING_QUERY_PARAM = /^(utm_[a-z]+|hsa_[a-z]+|_hsenc|_hsmi|_hsfp|__hstc|__hssc|__hsfp|hsCtaTracking|gclid|fbclid|msclkid|li_fat_id|ref)$/

const isTrackablePage = (pathname: string): boolean => {
  if (!TRACKED_PATHS.has(pathname)) {
    return false
  }

  return Array.from(new URLSearchParams(window.location.search).keys()).every((param) => MARKETING_QUERY_PARAM.test(param))
}

const HubspotTracking = (): null => {
  const pathname = usePathname()
  const trackerRequestedRef = useRef(false)
  const trackerReadyRef = useRef(false)

  useEffect(() => {
    if (!isTrackablePage(pathname)) {
      return
    }

    if (trackerRequestedRef.current) {
      if (!trackerReadyRef.current) {
        return
      }

      window._hsq ??= []
      window._hsq.push(['setPath', pathname])
      window._hsq.push(['trackPageView'])
      return
    }

    trackerRequestedRef.current = true

    const loader = document.createElement('script')
    loader.id = 'hs-script-loader'
    loader.async = true
    loader.src = HUBSPOT_SCRIPT_SRC
    loader.onload = () => {
      trackerReadyRef.current = true
    }
    document.head.appendChild(loader)
  }, [pathname])

  return null
}

export default HubspotTracking
