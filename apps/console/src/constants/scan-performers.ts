export const SCAN_PERFORMER = {
  REPORT_PARSE: 'openlane_report_parse',
  VENDOR_REPORT_REVIEW: 'openlane_vendor_report_review',
  DOMAIN_SCAN: 'openlane_domain_scan',
} as const

export type TReportScanPerformer = typeof SCAN_PERFORMER.REPORT_PARSE | typeof SCAN_PERFORMER.VENDOR_REPORT_REVIEW

export const SOC2_REPORT_DOCUMENT_KIND = 'soc2_report'

export type TReportScanSection = 'controls' | 'programs' | 'domains' | 'entities' | 'assets' | 'groups' | 'platforms' | 'systemdetails' | 'contacts' | 'findings' | 'reviews' | 'assessment'
