'use client'

import React, { use, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { REPORT_SCAN_UPLOAD_PARAM, SCANS_ROUTE } from '@/constants/scan-routes'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { REPORT_SCAN_EYEBROW } from './components/report-scan-heading'
import { useReportScan } from './hooks/use-report-scan'
import { ReportScanWizard } from './report-scan-wizard'
import { reportStepVisibility } from './sections'
import { REPORT_SECTION_IDS } from './types'

const StatusMessage = ({ heading, message, children }: { heading: string; message: string; children?: React.ReactNode }) => (
  <div className="mx-auto max-w-3xl px-6 py-10">
    <PageHeading eyebrow={REPORT_SCAN_EYEBROW} heading={heading} />
    <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    {children ? <div className="mt-6 flex items-center gap-3">{children}</div> : null}
  </div>
)

const ReportScanImportPage = () => {
  const router = useRouter()
  const smartRouter = useSmartRouter()
  const searchParams = useSearchParams()
  const scanId = searchParams.get('scanId') ?? undefined
  const { setCrumbs } = use(BreadcrumbContext)
  const { report, reportName, isLoading, isNotFound, isProcessing, isFailed, isAlreadyImported, failureReason } = useReportScan(scanId)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Scans', href: SCANS_ROUTE }, { label: REPORT_SCAN_EYEBROW }])
  }, [setCrumbs])

  const uploadAgain = (
    <Button variant="primary" onClick={() => smartRouter.push({ [REPORT_SCAN_UPLOAD_PARAM]: 'upload' })}>
      Upload a report
    </Button>
  )

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-10" role="status" aria-live="polite" aria-label="Loading report">
        <Skeleton height={28} className="w-full max-w-[320px] rounded-md" />
        <Skeleton height={16} className="w-full max-w-[640px] rounded-md" />
        <SkeletonRows count={6} height={56} />
      </div>
    )
  }

  if (isNotFound) {
    return (
      <StatusMessage heading="Report not found" message="This report does not exist or you do not have access to it. Open it again from the notification, or upload a new one.">
        <Button variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push('/notifications')}>
          Back to notifications
        </Button>
        {uploadAgain}
      </StatusMessage>
    )
  }

  if (isProcessing) {
    return (
      <StatusMessage heading="We're reading your report" message="This usually takes a couple of minutes. Feel free to navigate away, you'll receive a notification when it's ready to review.">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle size={16} className="animate-spin" />
          Reading {reportName}
        </span>
      </StatusMessage>
    )
  }

  if (isFailed) {
    return (
      <StatusMessage heading="We couldn't read this report" message={failureReason ? `${failureReason.replace(/\.$/, '')}.` : 'The report could not be parsed. Please try again later.'}>
        {uploadAgain}
      </StatusMessage>
    )
  }

  if (isAlreadyImported) {
    return (
      <StatusMessage heading="Already imported" message={`${reportName} has already been imported into Openlane. Upload a new report to import it again.`}>
        <Button variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(SCANS_ROUTE)}>
          Back to scans
        </Button>
        {uploadAgain}
      </StatusMessage>
    )
  }

  if (!report || !scanId) {
    return <StatusMessage heading="Report not ready" message={`${reportName} has not finished parsing yet. Open it again from the notification once it is ready.`} />
  }

  if (!REPORT_SECTION_IDS.some((section) => reportStepVisibility(report)[section])) {
    return (
      <StatusMessage heading="Nothing to import" message={`We read ${reportName} but did not find anything to import.`}>
        {uploadAgain}
      </StatusMessage>
    )
  }

  return <ReportScanWizard key={scanId} scanId={scanId} reportName={reportName} report={report} />
}

export default ReportScanImportPage
