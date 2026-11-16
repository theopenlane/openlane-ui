import { normalizeUrl } from '@/utils/normalizeUrl'

export const buildPreviewUrl = (cnameRecord?: string | null, params?: Record<string, string>): string => {
  const base = normalizeUrl(cnameRecord)
  if (!base) return ''
  const query = new URLSearchParams(params).toString()
  return query ? `${base}?${query}` : base
}
