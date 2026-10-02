import { withReturnTo } from '@/utils/return-to'

export const DOMAIN_SCAN_EXIT_FALLBACK_HREF = '/dashboard'

export const domainScanReviewHref = (scanId: string, returnTo?: string | null) => withReturnTo(`/exposure/scans/domain-scan?scanId=${encodeURIComponent(scanId)}`, returnTo)
