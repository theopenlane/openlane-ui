import { isAfter, startOfDay, subMonths } from 'date-fns'
import { soc1BadgeImageUrl, soc2BadgeImageUrl, soc3BadgeImageUrl } from '@repo/dally/auth'
import { isOneOf } from '@/utils/type-guards'

export const AICPA_LOGO_GUIDELINES_URL = 'https://www.aicpa-cima.com/resources/download/soc-for-service-organizations-logo-guidelines-for-service-organization'
const AICPA_SOC_LINK_URL = 'https://www.aicpa.org/soc4so'
export const SOC_REPORT_MAX_AGE_MONTHS = 12
export const SOC_BADGE_EMBED_WIDTH = 120
export const SOC_BADGE_TITLE = 'AICPA SOC Badge'
export const SOC_BADGE_DESCRIPTION = 'Show the official AICPA SOC logo on your website once you have a current SOC report.'

export type TSocBadge = {
  label: string
  imageUrl: string
  fileName: string
  alt: string
}

const httpsUrlOrNull = (raw: string | undefined): string | null => {
  const trimmed = raw?.trim()
  if (!trimmed || !URL.canParse(trimmed)) return null
  const url = new URL(trimmed)
  return url.protocol === 'https:' ? url.href : null
}

const socBadge = (socNumber: 1 | 2 | 3, rawImageUrl: string | undefined): TSocBadge | null => {
  const imageUrl = httpsUrlOrNull(rawImageUrl)
  return imageUrl ? { label: `SOC ${socNumber}`, imageUrl, fileName: `aicpa-soc-${socNumber}.png`, alt: `AICPA SOC ${socNumber} for Service Organizations` } : null
}

const SOC_1_BADGE = socBadge(1, soc1BadgeImageUrl)
const SOC_2_BADGE = socBadge(2, soc2BadgeImageUrl)
const SOC_3_BADGE = socBadge(3, soc3BadgeImageUrl)

const SOC_REPORT_TYPES = [
  { value: 'SOC_1_TYPE_1', label: 'SOC 1 Type 1', badge: SOC_1_BADGE },
  { value: 'SOC_1_TYPE_2', label: 'SOC 1 Type 2', badge: SOC_1_BADGE },
  { value: 'SOC_2_TYPE_1', label: 'SOC 2 Type 1', badge: SOC_2_BADGE },
  { value: 'SOC_2_TYPE_2', label: 'SOC 2 Type 2', badge: SOC_2_BADGE },
  { value: 'SOC_3', label: 'SOC 3', badge: SOC_3_BADGE },
] as const

export type SocReportType = (typeof SOC_REPORT_TYPES)[number]['value']

type TAvailableSocReportType = { value: SocReportType; label: string; badge: TSocBadge }

export const AVAILABLE_SOC_REPORT_TYPES: TAvailableSocReportType[] = SOC_REPORT_TYPES.flatMap(({ value, label, badge }) => (badge ? [{ value, label, badge }] : []))

export const isAvailableSocReportType = isOneOf(AVAILABLE_SOC_REPORT_TYPES.map(({ value }) => value))

export const isSocBadgeConfigured = AVAILABLE_SOC_REPORT_TYPES.length > 0

export const DEFAULT_SOC_REPORT_TYPE: SocReportType = isAvailableSocReportType('SOC_2_TYPE_2') ? 'SOC_2_TYPE_2' : (AVAILABLE_SOC_REPORT_TYPES[0]?.value ?? 'SOC_2_TYPE_2')

export const socBadgeForReportType = (reportType: SocReportType): TSocBadge | null => AVAILABLE_SOC_REPORT_TYPES.find(({ value }) => value === reportType)?.badge ?? null

export const oldestEligibleReportDate = (): Date => startOfDay(subMonths(new Date(), SOC_REPORT_MAX_AGE_MONTHS))

export const isReportDateEligible = (reportDate: Date): boolean => !isAfter(oldestEligibleReportDate(), startOfDay(reportDate))

export const buildSocBadgeEmbedCode = ({ imageUrl, alt }: TSocBadge): string =>
  [`<a href="${AICPA_SOC_LINK_URL}" target="_blank" rel="noopener">`, `  <img src="${imageUrl}" alt="${alt}" width="${SOC_BADGE_EMBED_WIDTH}">`, `</a>`].join('\n')
