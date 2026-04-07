'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { SaveIcon, Trash2, X } from 'lucide-react'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useCampaign, useUpdateCampaign, useDeleteCampaign } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignCampaignStatus, CampaignCampaignType } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Badge } from '@repo/ui/badge'
import Skeleton from '@/components/shared/skeleton/skeleton'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'

interface CampaignDetailSheetProps {
  campaignId: string | null
  onClose: () => void
}

const STATUS_OPTIONS = Object.values(CampaignCampaignStatus).map((value) => ({
  label: getEnumLabel(value),
  value,
}))

const TYPE_OPTIONS = Object.values(CampaignCampaignType).map((value) => ({
  label: getEnumLabel(value),
  value,
}))

export const CampaignDetailSheet: React.FC<CampaignDetailSheetProps> = ({ campaignId, onClose }) => {
  const { data, isLoading } = useCampaign(campaignId ?? undefined)
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign()
  const { mutateAsync: deleteCampaign, isPending: isDeleting } = useDeleteCampaign()
  const { successNotification, errorNotification } = useNotification()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<CampaignCampaignStatus | undefined>(undefined)
  const [campaignType, setCampaignType] = useState<CampaignCampaignType | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const campaign = data?.campaign

  useEffect(() => {
    if (campaign) {
      setName(campaign.name)
      setDescription(campaign.description ?? '')
      setStatus(campaign.status)
      setCampaignType(campaign.campaignType)
    }
  }, [campaign])

  const handleSave = useCallback(async () => {
    if (!campaignId || !name.trim()) return

    try {
      await updateCampaign({
        updateCampaignId: campaignId,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          clearDescription: !description.trim() ? true : undefined,
          status,
          campaignType,
        },
      })
      successNotification({ title: 'Campaign updated' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }, [campaignId, name, description, status, campaignType, updateCampaign, successNotification, errorNotification])

  const handleDelete = useCallback(async () => {
    if (!campaignId) return

    try {
      await deleteCampaign({ deleteCampaignId: campaignId })
      successNotification({ title: 'Campaign deleted' })
      setShowDeleteDialog(false)
      onClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }, [campaignId, deleteCampaign, successNotification, errorNotification, onClose])

  return (
    <>
      <Sheet open={!!campaignId} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent
          side="right"
          className="flex flex-col"
          minWidth="40vw"
          initialWidth="60vw"
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            onClose()
          }}
          header={
            <SheetHeader>
              <SheetTitle className="sr-only">Campaign Details</SheetTitle>
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">Campaigns / Details</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{campaign?.name ?? 'Campaign'}</h2>
                    {campaign?.status && (
                      <Badge variant="outline" className="text-xs">
                        {getEnumLabel(campaign.status)}
                      </Badge>
                    )}
                  </div>
                  <button type="button" onClick={onClose} className="cursor-pointer mr-6">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <CancelButton onClick={onClose} disabled={isUpdating} />
                  <Button variant="secondary" onClick={handleSave} disabled={isUpdating || !name.trim()} icon={<SaveIcon size={16} />} iconPosition="left">
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting} icon={<Trash2 size={16} />} iconPosition="left">
                    Delete
                  </Button>
                </div>
              </div>
            </SheetHeader>
          }
        >
          {isLoading ? (
            <Skeleton />
          ) : (
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Campaign description" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status || undefined} onValueChange={(val) => setStatus(val as CampaignCampaignStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={campaignType || undefined} onValueChange={(val) => setCampaignType(val as CampaignCampaignType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {campaign && (
                <div className="flex flex-col gap-3 rounded-md border border-border p-4">
                  <h4 className="text-sm font-semibold">Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {campaign.displayID && (
                      <div>
                        <span className="text-xs text-muted-foreground">ID</span>
                        <p className="text-sm">{campaign.displayID}</p>
                      </div>
                    )}
                    {campaign.recipientCount != null && (
                      <div>
                        <span className="text-xs text-muted-foreground">Recipients</span>
                        <p className="text-sm">{campaign.recipientCount}</p>
                      </div>
                    )}
                    {campaign.dueDate && (
                      <div>
                        <span className="text-xs text-muted-foreground">Due Date</span>
                        <p className="text-sm">{new Date(campaign.dueDate as string).toLocaleDateString()}</p>
                      </div>
                    )}
                    {campaign.scheduledAt && (
                      <div>
                        <span className="text-xs text-muted-foreground">Scheduled At</span>
                        <p className="text-sm">{new Date(campaign.scheduledAt as string).toLocaleDateString()}</p>
                      </div>
                    )}
                    {campaign.launchedAt && (
                      <div>
                        <span className="text-xs text-muted-foreground">Launched At</span>
                        <p className="text-sm">{new Date(campaign.launchedAt as string).toLocaleDateString()}</p>
                      </div>
                    )}
                    {campaign.completedAt && (
                      <div>
                        <span className="text-xs text-muted-foreground">Completed At</span>
                        <p className="text-sm">{new Date(campaign.completedAt as string).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showDeleteDialog} onConfirm={handleDelete} onCancel={() => setShowDeleteDialog(false)} />
    </>
  )
}
