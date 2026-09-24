import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'

export const REPORT_SCAN_EYEBROW = `${SOC_2_FRAMEWORK_NAME} import`

export const ReportScanHeading = ({ reportName }: { reportName: string }) => (
  <>
    <PageHeading eyebrow={REPORT_SCAN_EYEBROW} heading="Review what we found" />
    <p className="mt-1 text-sm text-muted-foreground">
      We read <span className="font-mono text-foreground">{reportName}</span> to identify what makes up your organization. Review and edit each section. Nothing is added to Openlane until you import.
    </p>
  </>
)
