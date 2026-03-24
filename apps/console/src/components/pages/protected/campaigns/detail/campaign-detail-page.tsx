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
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import Menu from '@/components/shared/menu/menu'
import { useDeleteCampaign } from '@/lib/graphql-hooks/campaign'
import { useRouter } from 'next/navigation'
import { RecipientDetailPanel } from './recipient-detail-panel'
import CampaignRunsTable from './campaign-runs-table'
import RecipientsTable from './recipients-table'

const CampaignDetailPage: React.FC = () => {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data, isLoading } = useCampaign(campaignId)
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign()
  const { mutateAsync: deleteCampaign } = useDeleteCampaign()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const [selectedRecipient, setSelectedRecipient] = useState<CampaignTargetsNodeNonNull | null>(null)

  const { CampaignTargetsNodes: recipients } = useCampaignTargetsWithFilter({
    where: { hasCampaignWith: [{ id: campaignId }] },
    pagination: DEFAULT_PAGINATION,
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
        input: { status: CampaignCampaignStatus.ACTIVE, launchedAt: new Date().toISOString() },
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
      <div className="rounded-md border border-border bg-card p-4 mb-4 w-full">
        <h3 className="text-sm font-semibold mb-3">Campaign Progress</h3>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Total Targets</span>
          <p className="text-lg font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Completed</span>
          <p className="text-lg font-semibold">{stats.completed}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">In Progress</span>
          <p className="text-lg font-semibold">{stats.inProgress}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Overdue</span>
          <p className="text-lg font-semibold">{stats.overdue}</p>
        </div>
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Email Sent</span>
          <p className="text-lg font-semibold">{stats.sent}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Email Delivered</span>
          <p className="text-lg font-semibold">{stats.sent}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Email Bounced</span>
          <p className="text-lg font-semibold">0</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">Email Opened</span>
          <p className="text-lg font-semibold">—</p>
        </div>
      </div>

      <div className="space-y-6">
        <CampaignRunsTable campaign={campaign} stats={stats} />
        <RecipientsTable campaignId={campaignId} onRecipientClick={setSelectedRecipient} />
      </div>
    </div>
  )

  return <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} minWidth={350}>{mainContent}</SlideBarLayout>
}

export default CampaignDetailPage
