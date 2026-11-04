'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SaveButton } from '@/components/shared/save-button/save-button'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useNotification } from '@/hooks/useNotification'
import type { TSavedReportRef } from '@/lib/graphql-hooks/report'
import { describeReportQuery, type TReportQueryConfig } from '@/lib/report/report-config'
import { buildSavedReportDefinition } from '@/lib/report/saved-report'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { diffBuiltInput } from '@/utils/input-diff'
import ReportSharingFields from './report-sharing-fields'
import { type TReportSharingForm, useReportSharingForm } from './use-report-sharing-form'

type TSaveReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: TReportQueryConfig
  report: (TSavedReportRef & { query: string }) | null
  canCreate: boolean
  onCreated: (id: string) => void
}

const SaveReportForm: React.FC<Omit<TSaveReportDialogProps, 'open'>> = ({ onOpenChange, config, report, canCreate, onCreated }) => {
  const { successNotification, warningNotification, errorNotification } = useNotification()
  const { form, create, update, isSaving, isLoadingSharing, sharingFailed, excludedUserIds } = useReportSharingForm({ report, suggestedName: describeReportQuery(config) })

  const saveBlocked = isSaving || isLoadingSharing || sharingFailed

  const saveAsNew = async (values: TReportSharingForm) => {
    const definition = buildSavedReportDefinition(config)
    if (!definition) return

    try {
      const result = await create(values, definition)
      if (!result) return

      if (result.sharingError) {
        warningNotification({ title: 'Report saved, but not shared', description: `${parseErrorMessage(result.sharingError)} You can share it again from Saved Reports.` })
      } else {
        successNotification({ title: 'Report saved', description: `"${values.name}" is in your saved reports.` })
      }

      onCreated(result.id)
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Could not save report', description: parseErrorMessage(error) })
    }
  }

  const saveChanges = async (values: TReportSharingForm) => {
    const definition = buildSavedReportDefinition(config)
    if (!report || !definition) return

    try {
      const saved = await update(report.id, values, diffBuiltInput(definition, { query: report.query, variables: report.variables }))
      if (!saved) return

      successNotification({ title: 'Report updated', description: `"${values.name}" was saved.` })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Could not update report', description: parseErrorMessage(error) })
    }
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.stopPropagation()
    void form.handleSubmit(report ? saveChanges : saveAsNew)(event)
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Report name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isLoadingSharing ? <Skeleton height={220} className="w-full rounded-md" /> : <ReportSharingFields excludedUserIds={excludedUserIds} />}

        <DialogFooter className="gap-2">
          <CancelButton onClick={() => onOpenChange(false)} disabled={isSaving} />
          {report && canCreate && (
            <Button type="button" variant="secondary" disabled={saveBlocked} onClick={() => void form.handleSubmit(saveAsNew)()}>
              Save as new
            </Button>
          )}
          <SaveButton title={report ? 'Save changes' : 'Save report'} isSaving={isSaving} disabled={saveBlocked} />
        </DialogFooter>
      </form>
    </Form>
  )
}

const SaveReportDialog: React.FC<TSaveReportDialogProps> = ({ open, ...props }) => (
  <Dialog open={open} onOpenChange={props.onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Save report</DialogTitle>
        <DialogDescription>Save your current report configuration so you can easily run it again or share it with your organization.</DialogDescription>
      </DialogHeader>
      <SaveReportForm {...props} />
    </DialogContent>
  </Dialog>
)

export default SaveReportDialog
