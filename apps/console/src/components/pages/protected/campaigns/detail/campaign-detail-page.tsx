'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { CheckCircle, Play, Trash2 } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useCampaign, useUpdateCampaign } from '@/lib/graphql-hooks/campaign'
import { useCampaignTargetsWithFilter, type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignCampaignStatus } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import Menu from '@/components/shared/menu/menu'
import { useDeleteCampaign } from '@/lib/graphql-hooks/campaign'
import { useRouter } from 'next/navigation'
import { RecipientDetailPanel } from './recipient-detail-panel'

const getRecipientStatus = (recipient: CampaignTargetsNodeNonNull) => {
  if (recipient.completedAt) return { label: 'Completed', color: 'bg-green-500' }
  if (recipient.sentAt) return { label: 'Sent', color: 'bg-blue-500' }
  return { label: 'Pending', color: 'bg-gray-500' }
}

const CampaignDetailPage: React.FC = () => {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data, isLoading } = useCampaign(campaignId)
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign()
  const { mutateAsync: deleteCampaign } = useDeleteCampaign()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const [pagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [selectedRecipient, setSelectedRecipient] = useState<CampaignTargetsNodeNonNull | null>(null)

  const { CampaignTargetsNodes: recipients, isLoading: recipientsLoading } = useCampaignTargetsWithFilter({
    where: { hasCampaignWith: [{ id: campaignId }] },
    pagination,
    enabled: !!campaignId,
  })

  const campaign = data?.campaign

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Campaign Management', href: '/automation/campaigns' },
      { label: campaign?.name ?? 'Campaign Details', href: `/automation/campaigns/${campaignId}` },
    ])
  }, [setCrumbs, campaign?.name, campaignId])

  const stats = useMemo(() => {
    const total = recipients.length
    const sent = recipients.filter((r) => r.sentAt).length
    const completed = recipients.filter((r) => r.completedAt).length
    const inProgress = recipients.filter((r) => r.sentAt && !r.completedAt).length
    const now = new Date()
    const dueDate = campaign?.dueDate ? new Date(campaign.dueDate as string) : null
    const overdue = dueDate && dueDate < now ? recipients.filter((r) => !r.completedAt).length : 0
    return { total, sent, completed, inProgress, overdue }
  }, [recipients, campaign?.dueDate])

  const progressPercent = useMemo(() => {
    if (stats.total === 0) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }, [stats])

  const handleStartCampaign = async () => {
    if (!campaignId) return
    try {
      await updateCampaign({
        updateCampaignId: campaignId,
        input: { status: CampaignCampaignStatus.ACTIVE },
      })
      successNotification({ title: 'Campaign started' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleCompleteCampaign = async () => {
    if (!campaignId) return
    try {
      await updateCampaign({
        updateCampaignId: campaignId,
        input: { status: CampaignCampaignStatus.COMPLETED },
      })
      successNotification({ title: 'Campaign completed' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDeleteCampaign = async () => {
    if (!campaignId) return
    try {
      await deleteCampaign({ deleteCampaignId: campaignId })
      successNotification({ title: 'Campaign deleted' })
      router.push('/automation/campaigns')
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  if (isLoading) return <Skeleton />

  if (!campaign) {
    return <div className="p-8 text-center text-muted-foreground">Campaign not found</div>
  }

  const menuComponent = (
    <div className="flex items-center gap-2 ml-auto">
      <Menu
        closeOnSelect
        content={(close) => (
          <Button variant="destructive" icon={<Trash2 size={14} />} iconPosition="left" className="w-full justify-start" onClick={() => { handleDeleteCampaign(); close() }}>
            Delete Campaign
          </Button>
        )}
      />
      {campaign.status !== CampaignCampaignStatus.COMPLETED && (
        campaign.status === CampaignCampaignStatus.ACTIVE ? (
          <Button variant="primary" icon={<CheckCircle size={14} />} iconPosition="left" onClick={handleCompleteCampaign} disabled={isUpdating} className="h-8">
            Complete Campaign
          </Button>
        ) : (
          <Button variant="primary" icon={<Play size={14} />} iconPosition="left" onClick={handleStartCampaign} disabled={isUpdating} className="h-8">
            Start Campaign
          </Button>
        )
      )}
    </div>
  )

  const sidebarContent = selectedRecipient ? (
    <RecipientDetailPanel recipient={selectedRecipient} onClose={() => setSelectedRecipient(null)} />
  ) : (
    <>
      {/* Properties */}
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Properties</h3>
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <p className="text-sm mt-1">
              <Badge variant="outline">{getEnumLabel(campaign.status)}</Badge>
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Type</span>
            <p className="text-sm mt-1">{getEnumLabel(campaign.campaignType) || '—'}</p>
          </div>
          {campaign.dueDate && (
            <div>
              <span className="text-xs text-muted-foreground">Due Date</span>
              <p className="text-sm mt-1">{formatDate(campaign.dueDate as string)}</p>
            </div>
          )}
          {campaign.tags && campaign.tags.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {campaign.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground">Created</span>
            <p className="text-sm mt-1">{campaign.createdAt ? formatDate(campaign.createdAt as string) : '—'}</p>
          </div>
          {campaign.completedAt && (
            <div>
              <span className="text-xs text-muted-foreground">Completed</span>
              <p className="text-sm mt-1">{formatDate(campaign.completedAt as string)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Questionnaires */}
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Questionnaires</h3>
        <p className="text-sm text-muted-foreground">No questionnaires linked to this campaign.</p>
      </div>
    </>
  )

  const mainContent = (
    <div className="pr-4">
      <h1 className="text-xl font-semibold mb-6">{campaign.name}</h1>

      {/* Campaign Progress */}
      <div className="rounded-md border border-border bg-card p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3">Campaign Progress</h3>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Stats Row 1 */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Total Targets</span>
            <p className="text-lg font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Completed</span>
            <p className="text-lg font-semibold">{stats.completed}</p>
          </div>
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">In Progress</span>
            <p className="text-lg font-semibold">{stats.inProgress}</p>
          </div>
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Overdue</span>
            <p className="text-lg font-semibold">{stats.overdue}</p>
          </div>
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Email Sent</span>
            <p className="text-lg font-semibold">{stats.sent}</p>
          </div>
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Email Delivered</span>
            <p className="text-lg font-semibold">{stats.sent}</p>
          </div>
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Email Bounced</span>
            <p className="text-lg font-semibold">0</p>
          </div>
          <div className="rounded-md bg-input p-3">
            <span className="text-xs text-muted-foreground">Email Opened</span>
            <p className="text-lg font-semibold">—</p>
          </div>
        </div>
      </div>

      {/* Campaign Runs */}
      <div className="rounded-md border border-border bg-card overflow-hidden mb-4">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Campaign Runs</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-3 font-medium">Run Date</th>
              <th className="text-left p-3 font-medium"># Targets</th>
              <th className="text-left p-3 font-medium"># Completed</th>
              <th className="text-left p-3 font-medium"># Paused</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {campaign.lastRunAt ? (
              <tr className="border-b border-border">
                <td className="p-3">{formatDate(campaign.lastRunAt as string)}</td>
                <td className="p-3">{stats.total}</td>
                <td className="p-3">{stats.completed}</td>
                <td className="p-3">{stats.inProgress}</td>
                <td className="p-3">{getEnumLabel(campaign.status)}</td>
                <td className="p-3">{campaign.dueDate ? formatDate(campaign.dueDate as string) : '—'}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No campaign runs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recipients Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Recipients</h3>
        </div>
        {recipientsLoading ? (
          <div className="p-4">
            <Skeleton />
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No recipients found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Sent At</th>
                <th className="text-left p-3 font-medium">Completed At</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedRecipient(recipient)}>
                  <td className="p-3">{recipient.fullName || '—'}</td>
                  <td className="p-3 text-muted-foreground">{recipient.email}</td>
                  <td className="p-3">
                    {(() => {
                      const s = getRecipientStatus(recipient)
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${s.color}`} />
                          {s.label}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="p-3 text-muted-foreground">{recipient.sentAt ? formatDate(recipient.sentAt as string) : '—'}</td>
                  <td className="p-3 text-muted-foreground">{recipient.completedAt ? formatDate(recipient.completedAt as string) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  return <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} minWidth={350}>{mainContent}</SlideBarLayout>
}

export default CampaignDetailPage
