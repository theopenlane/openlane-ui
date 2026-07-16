export const VENDOR_LOGO_DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export const VENDOR_LOGO_SIZE = {
  default: 128,
  min: 16,
  max: 256,
} as const

export const toVendorLogoHost = (domain: string): string | null => {
  const trimmed = domain.trim().toLowerCase()
  if (!trimmed) return null
  try {
    const { hostname } = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return VENDOR_LOGO_DOMAIN_REGEX.test(hostname) ? hostname : null
  } catch {
    return null
  }
}

export const buildVendorLogoProxyUrl = (host: string, size: number = VENDOR_LOGO_SIZE.default): string => `/api/vendor-logo?domain=${encodeURIComponent(host)}&sz=${size}`
