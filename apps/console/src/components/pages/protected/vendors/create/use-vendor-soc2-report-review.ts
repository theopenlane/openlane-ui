'use client'

import { useState } from 'react'
import { SCAN_PERFORMER } from '@/constants/scan-performers'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'
import { useNotification } from '@/hooks/useNotification'
import { REPORT_SCAN_STARTED_NOTIFICATION, type TReportScanFile, useCreateReportScan } from '@/lib/graphql-hooks/report-scan'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const useVendorSoc2ReportReview = () => {
  const [soc2Report, setSoc2Report] = useState<TReportScanFile | null>(null)
  const { mutateAsync: createReportScan } = useCreateReportScan()
  const { successNotification, errorNotification } = useNotification()

  const submitReview = async ({ vendorId, vendorName, hasSoc2 }: { vendorId: string; vendorName: string; hasSoc2: boolean }) => {
    setSoc2Report(null)
    if (!soc2Report || !hasSoc2) return

    try {
      await createReportScan({ performer: SCAN_PERFORMER.VENDOR_REPORT_REVIEW, report: soc2Report, vendorId })
      successNotification({
        title: `Reviewing ${vendorName}'s ${SOC_2_FRAMEWORK_NAME} report`,
        description: REPORT_SCAN_STARTED_NOTIFICATION[SCAN_PERFORMER.VENDOR_REPORT_REVIEW].description,
      })
    } catch (error) {
      errorNotification({ title: `${vendorName} was created, but its ${SOC_2_FRAMEWORK_NAME} report could not be reviewed`, description: parseErrorMessage(error) })
    }
  }

  return { soc2Report, setSoc2Report, submitReview }
}
