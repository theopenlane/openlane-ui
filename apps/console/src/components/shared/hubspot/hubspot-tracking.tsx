'use client'

import { useEffect } from 'react'

const HUBSPOT_PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
const HUBSPOT_SCRIPT_ID = 'hs-script-loader'

const MARKETING_QUERY_PARAM = /^(utm_[a-z]+|hsa_[a-z]+|_hsenc|_hsmi|_hsfp|__hstc|__hssc|__hsfp|hsCtaTracking|gclid|fbclid|msclkid|li_fat_id|ref)$/

const hasOnlyMarketingParams = (search: string): boolean => Array.from(new URLSearchParams(search).keys()).every((param) => MARKETING_QUERY_PARAM.test(param))

const HubspotTracking = (): null => {
  useEffect(() => {
    if (!HUBSPOT_PORTAL_ID || !hasOnlyMarketingParams(window.location.search)) {
      return
    }

    if (document.getElementById(HUBSPOT_SCRIPT_ID)) {
      window._hsq ??= []
      window._hsq.push(['setPath', window.location.pathname])
      window._hsq.push(['trackPageView'])
      return
    }

    const loader = document.createElement('script')
    loader.id = HUBSPOT_SCRIPT_ID
    loader.async = true
    loader.src = `https://js-na2.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`
    document.head.appendChild(loader)
  }, [])

  return null
}

export default HubspotTracking
