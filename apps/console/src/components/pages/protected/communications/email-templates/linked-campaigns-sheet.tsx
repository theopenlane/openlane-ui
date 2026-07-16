'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Link2, LoaderCircle, Megaphone, Unlink, X } from 'lucide-react'
import { useCampaignsWithFilter, useUpdateCampaign } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'

interface LinkedCampaignsSheetProps {
  templateId: string
  templateName: string
  onClose: () => void
}

const listPagination = { page: 1, pageSize: 100, query: { first: 100 } }

const listOrderBy = [{ field: CampaignOrderField.name, direction: OrderDirection.ASC }]

export const LinkedCampaignsSheet: React.FC<LinkedCampaignsSheetProps> = ({ templateId, templateName, onClose }) => {
  const [campaignToLink, setCampaignToLink] = useState('')

  const { mutateAsync: updateCampaign, isPending } = useUpdateCampaign()
  const { successNotification, errorNotification } = useNotification()

  const {
    CampaignsNodes: linkedCampaigns,
    isFetching,
    data: linkedData,
  } = useCampaignsWithFilter({
    where: { hasEmailTemplateWith: [{ id: templateId }] },
    orderBy: listOrderBy,
    pagination: listPagination,
  })

  const { CampaignsNodes: linkableCampaigns, isFetching: isLoadingLinkable } = useCampaignsWithFilter({
    where: { not: { hasEmailTemplateWith: [{ id: templateId }] } },
    orderBy: listOrderBy,
    pagination: listPagination,
  })

  const linkedTotal = linkedData?.campaigns?.totalCount ?? linkedCampaigns.length

  const linkableOptions = useMemo(() => linkableCampaigns.map((campaign) => ({ label: campaign.name, value: campaign.id })), [linkableCampaigns])

  const handleLink = useCallback(async () => {
    if (!campaignToLink || !templateId) return
    try {
      await updateCampaign({ updateCampaignId: campaignToLink, input: { emailTemplateID: templateId } })
      setCampaignToLink('')
      successNotification({ title: 'Campaign linked' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }, [campaignToLink, templateId, updateCampaign, successNotification, errorNotification])

  const handleUnlink = useCallback(
    async (campaignId: string) => {
      try {
        await updateCampaign({ updateCampaignId: campaignId, input: { clearEmailTemplate: true } })
        successNotification({ title: 'Campaign unlinked' })
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [updateCampaign, successNotification, errorNotification],
  )

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col"
        minWidth="35vw"
        initialWidth="45vw"
        header={
          <SheetHeader>
            <SheetTitle className="sr-only">Linked Campaigns</SheetTitle>
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground">
                Email Templates / <span className="font-semibold text-foreground">Linked Campaigns</span>
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{templateName}</h2>
                <button type="button" onClick={onClose} className="cursor-pointer mr-6">
                  <X size={16} />
                </button>
              </div>
            </div>
          </SheetHeader>
        }
      >
        <div className="mt-2 flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <span className="text-sm font-medium">Link a campaign</span>
            <div className="flex items-center gap-2">
              <Select value={campaignToLink || undefined} onValueChange={setCampaignToLink}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a campaign to link" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingLinkable ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading campaigns...</div>
                  ) : linkableOptions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No campaigns available to link</div>
                  ) : (
                    linkableOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button variant="primary" type="button" icon={<Link2 size={16} />} iconPosition="left" onClick={handleLink} disabled={!campaignToLink || isPending}>
                Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Linking a campaign that already uses another template will reassign it to this one.</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Linked campaigns ({linkedTotal})</span>
            {linkedTotal > linkedCampaigns.length && <span className="text-xs text-muted-foreground">Showing the first {linkedCampaigns.length}.</span>}
            {isFetching && linkedCampaigns.length === 0 ? (
              <div className="flex justify-center py-8">
                <LoaderCircle className="animate-spin text-muted-foreground" size={20} />
              </div>
            ) : linkedCampaigns.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Megaphone size={32} className="opacity-50" />
                <p className="text-sm">No campaigns use this template yet</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {linkedCampaigns.map((campaign) => (
                  <li key={campaign.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">Created {formatDate(campaign.createdAt)}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {getEnumLabel(campaign.status)}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      className="ml-auto shrink-0"
                      icon={<Unlink size={14} />}
                      iconPosition="left"
                      onClick={() => handleUnlink(campaign.id)}
                      disabled={isPending}
                    >
                      Unlink
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
