'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@theopenlane/ui/dialog'
import { Button } from '@theopenlane/ui/button'
import { TargetsStep } from '../create/steps/targets-step'
import { toCampaignTargetInputs, toEmailKeys, type CampaignTargetEntry, type TargetTab } from '../create/steps/targets/target-entry'
import { useCreateBulkCampaignTarget } from '@/lib/graphql-hooks/campaign-target'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'

interface AddRecipientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  existingEmails: string[]
}

export const AddRecipientsDialog: React.FC<AddRecipientsDialogProps> = ({ open, onOpenChange, campaignId, existingEmails }) => {
  const [targets, setTargets] = useState<CampaignTargetEntry[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<TargetTab>('personnel')

  const { mutateAsync: createBulkTarget, isPending } = useCreateBulkCampaignTarget()
  const { successNotification, errorNotification } = useNotification()

  const lockedEmails = useMemo(() => toEmailKeys(existingEmails), [existingEmails])

  const validTargets = useMemo(() => toCampaignTargetInputs(targets, lockedEmails), [targets, lockedEmails])

  const reset = () => {
    setTargets([])
    setUploadedFile(null)
    setActiveTab('personnel')
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleSave = async () => {
    if (validTargets.length === 0) return
    try {
      await createBulkTarget({
        input: validTargets.map((target) => ({ ...target, campaignID: campaignId })),
      })
      successNotification({ title: `Added ${pluralizeWithCount(validTargets.length, 'recipient')}` })
      reset()
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Add recipients</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {existingEmails.length === 0
              ? 'This campaign has no recipients yet.'
              : `${pluralizeWithCount(existingEmails.length, 'recipient')} already added (marked "Already added"). To remove one, use its remove button in the Recipients table.`}
          </p>
        </DialogHeader>

        <TargetsStep
          targets={targets}
          onTargetsChange={setTargets}
          uploadedFile={uploadedFile}
          onFileUpload={setUploadedFile}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          lockedEmails={lockedEmails}
        />

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => handleClose(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSave} disabled={isPending || validTargets.length === 0}>
            {isPending ? 'Adding...' : `Add ${pluralizeWithCount(validTargets.length, 'recipient')}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
