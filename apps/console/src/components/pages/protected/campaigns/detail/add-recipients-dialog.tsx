'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { TargetsStep } from '../create/steps/targets-step'
import { type CampaignTargetEntry, type TargetTab } from '../create/steps/targets/target-entry'
import { useCreateBulkCampaignTarget } from '@/lib/graphql-hooks/campaign-target'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isValidEmail } from '@/lib/validators'

interface AddRecipientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

export const AddRecipientsDialog: React.FC<AddRecipientsDialogProps> = ({ open, onOpenChange, campaignId }) => {
  const [targets, setTargets] = useState<CampaignTargetEntry[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<TargetTab>('personnel')

  const { mutateAsync: createBulkTarget, isPending } = useCreateBulkCampaignTarget()
  const { successNotification, errorNotification } = useNotification()

  const validTargets = targets.filter((target) => isValidEmail(target.email.trim()))

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
        input: validTargets.map((target) => ({
          campaignID: campaignId,
          email: target.email.trim(),
          fullName: target.fullName.trim() || undefined,
          contactID: target.contactID || undefined,
        })),
      })
      successNotification({ title: `Added ${validTargets.length} recipient${validTargets.length === 1 ? '' : 's'}` })
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
        </DialogHeader>

        <TargetsStep targets={targets} onTargetsChange={setTargets} uploadedFile={uploadedFile} onFileUpload={setUploadedFile} activeTab={activeTab} onActiveTabChange={setActiveTab} />

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => handleClose(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSave} disabled={isPending || validTargets.length === 0}>
            {isPending ? 'Adding...' : `Add ${validTargets.length} recipient${validTargets.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
