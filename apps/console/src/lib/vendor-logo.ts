export const VENDOR_LOGO_DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export const VENDOR_LOGO_SIZE = {
  default: 128,
  min: 16,
  max: 256,
} as const
