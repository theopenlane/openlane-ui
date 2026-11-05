'use client'

import React from 'react'
import { Copy, FileText } from 'lucide-react'
import { useWatch } from 'react-hook-form'
import { ReportReportVisibility } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Form } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Sheet, SheetContent, SheetDescription } from '@repo/ui/sheet'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SaveButton } from '@/components/shared/save-button/save-button'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useNotification } from '@/hooks/useNotification'
import { useRetainedWhileOpen } from '@/hooks/useRetainedWhileOpen'
import type { TSavedReportRef } from '@/lib/graphql-hooks/report'
import { savedReportDataLabel, savedReportUrl } from '@/lib/report/saved-report'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import ReportSharingFields from './report-sharing-fields'
import { type TReportSharingForm, useReportSharingForm } from './use-report-sharing-form'
import { useCopySavedReportLink } from './use-saved-report-actions'

type TShareReportSheetProps = {
  report: TSavedReportRef | null
  onClose: () => void
}

const ShareReportForm: React.FC<{ report: TSavedReportRef; onClose: () => void }> = ({ report, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const copyLink = useCopySavedReportLink()
  const { form, update, isSaving, isLoadingSharing, sharingFailed, excludedUserIds } = useReportSharingForm({ report })
  const visibility = useWatch({ control: form.control, name: 'visibility' })

  const handleSave = async (values: TReportSharingForm) => {
    try {
      const saved = await update(report.id, values)
      if (!saved) return

      successNotification({ title: 'Sharing updated', description: `"${report.name}" sharing settings were saved.` })
      onClose()
    } catch (saveError) {
      errorNotification({ title: 'Could not update sharing', description: parseErrorMessage(saveError) })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.stopPropagation()
          void form.handleSubmit(handleSave)(event)
        }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Report</p>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <FileText size={16} className="shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm">{report.name}</span>
              <span className="text-xs text-muted-foreground">{savedReportDataLabel(report.variables)}</span>
            </span>
          </div>
        </div>

        {isLoadingSharing ? <Skeleton height={220} className="w-full rounded-md" /> : <ReportSharingFields excludedUserIds={excludedUserIds} />}

        {visibility !== ReportReportVisibility.PRIVATE && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Share link</p>
            <p className="text-xs text-muted-foreground">Anyone with access to this report can use this link.</p>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Input readOnly value={savedReportUrl(report.id)} aria-label="Share link" className="w-full" />
              </div>
              <Button type="button" variant="secondary" icon={<Copy size={14} />} iconPosition="left" onClick={() => copyLink(report.id)}>
                Copy
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <CancelButton onClick={onClose} disabled={isSaving} />
          <SaveButton isSaving={isSaving} disabled={isSaving || isLoadingSharing || sharingFailed} />
        </div>
      </form>
    </Form>
  )
}

const ShareReportSheet: React.FC<TShareReportSheetProps> = ({ report, onClose }) => {
  const retainedReport = useRetainedWhileOpen(!!report, report)

  return (
    <Sheet
      open={!!report}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        minWidth={420}
        initialWidth={520}
        header={<SlideoutHeader title="Share report" belowTitle={<SheetDescription>Choose who can access this saved report.</SheetDescription>} onClose={onClose} />}
      >
        {retainedReport && <ShareReportForm key={retainedReport.id} report={retainedReport} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

export default ShareReportSheet
