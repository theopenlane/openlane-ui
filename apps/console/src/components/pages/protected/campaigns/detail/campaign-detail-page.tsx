'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Calendar, CheckCircle, FileText, Play, Trash2 } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useCampaign, useUpdateCampaign } from '@/lib/graphql-hooks/campaign'
import { useCampaignTargetStats } from '@/lib/graphql-hooks/campaign-target'
import { type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignCampaignStatus, CampaignCampaignType, type UpdateCampaignInput } from '@repo/codegen/src/schema'
import { getEnumLabel, enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'
import Skeleton from '@/components/shared/skeleton/skeleton'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import Menu from '@/components/shared/menu/menu'
import { useDeleteCampaign } from '@/lib/graphql-hooks/campaign'
import { useRouter } from 'next/navigation'
import { RecipientDetailPanel } from './recipient-detail-panel'
import CampaignRunsTable from './campaign-runs-table'
import RecipientsTable from './recipients-table'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { DateField } from '@/components/shared/crud-base/form-fields/date-field'

type CampaignFormData = {
  name: string
  description: string
  campaignType: CampaignCampaignType | undefined
  status: CampaignCampaignStatus | undefined
  dueDate: string | undefined
}

const statusOptions = enumToOptions(CampaignCampaignStatus)
const typeOptions = enumToOptions(CampaignCampaignType)

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
  const [internalEditing, setInternalEditing] = useState<string | null>(null)

  const { nodes: recipients, totalCount } = useCampaignTargetStats({
    where: { hasCampaignWith: [{ id: campaignId }] },
    enabled: !!campaignId,
  })

  const campaign = data?.campaign

  const form = useForm<CampaignFormData>({
    defaultValues: {
      name: '',
      description: '',
      campaignType: undefined,
      status: undefined,
      dueDate: undefined,
    },
  })

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name ?? '',
        description: campaign.description ?? '',
        campaignType: campaign.campaignType ?? undefined,
        status: campaign.status ?? undefined,
        dueDate: campaign.dueDate ?? undefined,
      })
    }
  }, [campaign, form])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Campaign Management', href: '/automation/campaigns' },
      { label: campaign?.name ?? 'Campaign Details', href: `/automation/campaigns/${campaignId}` },
    ])
  }, [setCrumbs, campaign?.name, campaignId])

  const stats = useMemo(() => {
    const total = totalCount
    const sent = recipients.filter((r) => r.sentAt).length
    const completed = recipients.filter((r) => r.completedAt).length
    const inProgress = recipients.filter((r) => r.sentAt && !r.completedAt).length
    const now = new Date()
    const dueDate = campaign?.dueDate ? new Date(campaign.dueDate as string) : null
    const overdue = dueDate && dueDate < now ? recipients.filter((r) => !r.completedAt).length : 0
    return { total, sent, completed, inProgress, overdue }
  }, [recipients, totalCount, campaign?.dueDate])

  const progressPercent = useMemo(() => {
    if (stats.total === 0) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }, [stats])

  const handleUpdateField = async (input: UpdateCampaignInput) => {
    if (!campaignId) return
    try {
      await updateCampaign({ updateCampaignId: campaignId, input })
      successNotification({ title: 'Campaign updated' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

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

  const sharedFieldProps = {
    isEditing: false as const,
    isEditAllowed: true,
    isCreate: false as const,
    data: campaign,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground',
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
          <SelectField name="status" label="Status" options={statusOptions} {...sharedFieldProps} />
          <SelectField name="campaignType" label="Type" options={typeOptions} {...sharedFieldProps} />
          <DateField name="dueDate" label="Due Date" {...sharedFieldProps} />
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
          <div className="flex items-center justify-between gap-4">
            <span className="text-base text-muted-foreground">Created</span>
            <span className="text-sm py-2 px-1">{campaign.createdAt ? formatDate(campaign.createdAt as string) : '—'}</span>
          </div>
          {campaign.completedAt && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-base text-muted-foreground">Completed</span>
              <span className="text-sm py-2 px-1">{formatDate(campaign.completedAt as string)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Questionnaires */}
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Questionnaires</h3>
        {(() => {
          const tmpl = campaign.template
          if (!tmpl) return <p className="text-sm text-muted-foreground">No questionnaires linked to this campaign.</p>
          const questions = Array.isArray(tmpl.jsonconfig?.questions) ? tmpl.jsonconfig.questions : []
          return (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">{tmpl.name}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-sm bg-secondary">
                  <Calendar size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last updated</p>
                  <p className="text-sm">{tmpl.updatedAt ? formatDate(tmpl.updatedAt) : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-sm bg-secondary">
                  <FileText size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-sm">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </>
  )

  const mainContent = (
    <div className="pr-4">
      <div className="mb-6">
        <TextField name="name" label="" isEditing={false} isEditAllowed={true} isCreate={false} data={campaign} internalEditing={internalEditing} setInternalEditing={setInternalEditing} handleUpdate={handleUpdateField} layout="vertical" className="text-xl font-semibold" />
      </div>

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

  return (
    <FormProvider {...form}>
      <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} minWidth={350}>{mainContent}</SlideBarLayout>
    </FormProvider>
  )
}

export default CampaignDetailPage
