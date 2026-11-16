import type { Page, Route } from '@playwright/test'

interface TrustCenterSettingPayload {
  data?: {
    trustCenters?: {
      edges?: Array<{ node: { setting: { disableDefaultDomain?: boolean | null } | null } }>
    }
  }
}

export const isGetTrustCenter = (route: Route): boolean => {
  const body = route.request().postData() ?? ''
  return route.request().method() === 'POST' && /"operationName":"GetTrustCenter"|query GetTrustCenter\b/.test(body)
}

export const stubDefaultDomainEnabled = async (page: Page) => {
  await page.route('**/query', async (route) => {
    if (!isGetTrustCenter(route)) return route.fallback()
    const response = await route.fetch()
    const payload = (await response.json()) as TrustCenterSettingPayload
    const setting = payload.data?.trustCenters?.edges?.[0]?.node?.setting
    if (setting) setting.disableDefaultDomain = false
    await route.fulfill({ response, json: payload })
  })
}
