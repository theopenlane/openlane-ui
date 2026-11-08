import { isAfter, startOfDay, subMonths } from 'date-fns'
import { siteUrl } from '@repo/dally/auth'

export const AICPA_LOGO_GUIDELINES_URL = 'https://www.aicpa-cima.com/resources/download/soc-for-service-organizations-logo-guidelines-for-service-organization'
const AICPA_SOC_LINK_URL = 'https://www.aicpa.org/soc4so'
export const SOC_REPORT_MAX_AGE_MONTHS = 12
export const SOC_BADGE_EMBED_WIDTH = 120
export const SOC_BADGE_TITLE = 'AICPA SOC Badge'
export const SOC_BADGE_DESCRIPTION = 'Show the official AICPA SOC logo on your website once you have a current SOC report.'

export enum SocReportType {
  SOC_1_TYPE_1 = 'SOC_1_TYPE_1',
  SOC_1_TYPE_2 = 'SOC_1_TYPE_2',
  SOC_2_TYPE_1 = 'SOC_2_TYPE_1',
  SOC_2_TYPE_2 = 'SOC_2_TYPE_2',
  SOC_3 = 'SOC_3',
}

export enum SocBadgeLogo {
  SOC_2 = 'SOC_2',
  SERVICE_ORGANIZATIONS = 'SERVICE_ORGANIZATIONS',
}

export const DEFAULT_SOC_REPORT_TYPE = SocReportType.SOC_2_TYPE_2

export const SOC_REPORT_TYPE_LABELS: Record<SocReportType, string> = {
  [SocReportType.SOC_1_TYPE_1]: 'SOC 1 Type 1',
  [SocReportType.SOC_1_TYPE_2]: 'SOC 1 Type 2',
  [SocReportType.SOC_2_TYPE_1]: 'SOC 2 Type 1',
  [SocReportType.SOC_2_TYPE_2]: 'SOC 2 Type 2',
  [SocReportType.SOC_3]: 'SOC 3',
}

type TSocBadgeLogoMeta = {
  label: string
  path: string
  fileName: string
  alt: string
  width: number
  height: number
}

export const SOC_BADGE_LOGOS: Record<SocBadgeLogo, TSocBadgeLogoMeta> = {
  [SocBadgeLogo.SOC_2]: {
    label: 'SOC 2',
    path: '/images/badges/aicpa-soc-2.png',
    fileName: 'aicpa-soc-2.png',
    alt: 'AICPA SOC 2 for Service Organizations',
    width: 329,
    height: 338,
  },
  [SocBadgeLogo.SERVICE_ORGANIZATIONS]: {
    label: 'SOC for Service Organizations',
    path: '/images/badges/aicpa-soc-for-service-organizations.png',
    fileName: 'aicpa-soc-for-service-organizations.png',
    alt: 'AICPA SOC for Service Organizations',
    width: 224,
    height: 223,
  },
}

const SOC_2_REPORT_TYPES = new Set([SocReportType.SOC_2_TYPE_1, SocReportType.SOC_2_TYPE_2])

export const logosForReportType = (reportType: SocReportType): SocBadgeLogo[] =>
  SOC_2_REPORT_TYPES.has(reportType) ? [SocBadgeLogo.SOC_2, SocBadgeLogo.SERVICE_ORGANIZATIONS] : [SocBadgeLogo.SERVICE_ORGANIZATIONS]

export const oldestEligibleReportDate = (): Date => startOfDay(subMonths(new Date(), SOC_REPORT_MAX_AGE_MONTHS))

export const isReportDateEligible = (reportDate: Date): boolean => !isAfter(oldestEligibleReportDate(), startOfDay(reportDate))

export const socBadgeEmbedHeight = (logo: SocBadgeLogo): number => {
  const { width, height } = SOC_BADGE_LOGOS[logo]
  return Math.round((SOC_BADGE_EMBED_WIDTH * height) / width)
}

export const buildSocBadgeEmbedCode = (logo: SocBadgeLogo): string => {
  const { path, alt } = SOC_BADGE_LOGOS[logo]
  const src = new URL(path, siteUrl).toString()

  return [`<a href="${AICPA_SOC_LINK_URL}" target="_blank" rel="noopener">`, `  <img src="${src}" alt="${alt}" width="${SOC_BADGE_EMBED_WIDTH}" height="${socBadgeEmbedHeight(logo)}">`, `</a>`].join(
    '\n',
  )
}
