'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Ban, Calendar, CheckCircle, ExternalLink, FileText, Lock, Mail, Rocket, SendHorizontal, Trash2 } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useCampaign, useUpdateCampaign, useResendCampaignIncompleteTargets } from '@/lib/graphql-hooks/campaign'
import { useCampaignEmailTemplateSelect } from '@/lib/graphql-hooks/email-template'
import { useCampaignTargetStats } from '@/lib/graphql-hooks/campaign-target'
import { type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignCampaignStatus, type UpdateCampaignInput } from '@repo/codegen/src/schema'
import { formatDate } from '@/utils/date'
import Skeleton from '@/components/shared/skeleton/skeleton'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import Menu from '@/components/shared/menu/menu'
import { useDeleteCampaign } from '@/lib/graphql-hooks/campaign'
import { useRouter } from 'next/navigation'
import { RecipientDetailPanel } from './recipient-detail-panel'
import { SendTestEmailDialog } from './send-test-email-dialog'
import { LaunchCampaignDialog } from './launch-campaign-dialog'
import { CampaignSetupView } from './campaign-setup-view'
import { EditDetailsDialog } from './edit-details-dialog'
import { ChangeTemplateDialog } from './change-template-dialog'
import { AddRecipientsDialog } from './add-recipients-dialog'
import { SelectQuestionnaireDialog } from '../create/steps/questionnaire/select-questionnaire-dialog'
import { getQuestionCount } from '../create/steps/questionnaire/questionnaire-metrics'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { TemplateTemplateKind } from '@repo/codegen/src/schema'
import { CampaignStatusIconMapper } from '@/components/shared/enum-mapper/campaign-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import CampaignRunsTable from './campaign-runs-table'
import RecipientsTable from './recipients-table'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { DateField } from '@/components/shared/crud-base/form-fields/date-field'

type CampaignFormData = {
  name: string
  description: string
  dueDate: string | undefined
  emailTemplateID: string | undefined
}

const CampaignDetailPage: React.FC = () => {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data, isLoading } = useCampaign(campaignId)
  const { emailTemplateOptions, isLoading: emailTemplatesLoading } = useCampaignEmailTemplateSelect({ ensureId: data?.campaign?.emailTemplateID })
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign()
  const { mutateAsync: deleteCampaign } = useDeleteCampaign()
  const { mutateAsync: resendIncomplete, isPending: isResending } = useResendCampaignIncompleteTargets()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const [selectedRecipient, setSelectedRecipient] = useState<CampaignTargetsNodeNonNull | null>(null)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false)
  const [editDetailsOpen, setEditDetailsOpen] = useState(false)
  const [changeTemplateOpen, setChangeTemplateOpen] = useState(false)
  const [questionnaireDialogOpen, setQuestionnaireDialogOpen] = useState(false)
  const [addRecipientsOpen, setAddRecipientsOpen] = useState(false)

  const { templates: questionnaireTemplates, isLoading: questionnairesLoading } = useTemplateSelect({ where: { kind: TemplateTemplateKind.QUESTIONNAIRE } })

  const { nodes: recipients, totalCount } = useCampaignTargetStats({
    where: { hasCampaignWith: [{ id: campaignId }] },
    enabled: !!campaignId,
  })

  const campaign = data?.campaign

  const form = useForm<CampaignFormData>({
    defaultValues: {
      name: '',
      description: '',
      dueDate: undefined,
      emailTemplateID: undefined,
    },
  })

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name ?? '',
        description: campaign.description ?? '',
        dueDate: campaign.dueDate ?? undefined,
        emailTemplateID: campaign.emailTemplateID ?? undefined,
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
  }, [recipients, totalCount, campaign])

  const progressPercent = useMemo(() => {
    if (stats.total === 0) return 0
    return Math.round((stats.completed / stats.total) * 100)
  }, [stats])

  const handleUpdateField = async (input: UpdateCampaignInput): Promise<boolean> => {
    if (!campaignId) return false
    try {
      await updateCampaign({ updateCampaignId: campaignId, input })
      successNotification({ title: 'Campaign updated' })
      return true
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      return false
    }
  }

  const handleInlineFieldUpdate = async (input: UpdateCampaignInput): Promise<void> => {
    await handleUpdateField(input)
  }

  const handleLaunch = async (scheduledAt: string | null) => {
    if (!campaignId) return
    try {
      const input = scheduledAt ? { status: CampaignCampaignStatus.SCHEDULED, scheduledAt } : { status: CampaignCampaignStatus.ACTIVE, launchedAt: new Date().toISOString() }
      await updateCampaign({ updateCampaignId: campaignId, input })
      successNotification({ title: scheduledAt ? 'Campaign scheduled' : 'Campaign launched' })
      setLaunchDialogOpen(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleCancelCampaign = async () => {
    if (!campaignId) return
    try {
      await updateCampaign({ updateCampaignId: campaignId, input: { status: CampaignCampaignStatus.CANCELED } })
      successNotification({ title: 'Campaign canceled' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleSaveDetails = async (values: { name: string; description: string }) => {
    if (await handleUpdateField({ name: values.name, description: values.description })) setEditDetailsOpen(false)
  }

  const handleSaveTemplate = async (emailTemplateID: string) => {
    if (await handleUpdateField({ emailTemplateID })) setChangeTemplateOpen(false)
  }

  const handleSelectQuestionnaire = async (templateId: string) => {
    if (await handleUpdateField({ templateID: templateId })) setQuestionnaireDialogOpen(false)
  }

  const handleRemoveQuestionnaire = async () => {
    await handleUpdateField({ clearTemplate: true })
  }

  const handleSendReminder = async () => {
    if (!campaignId) return
    try {
      const result = await resendIncomplete({ input: { campaignID: campaignId } })
      const { queuedCount, skippedCount } = result.resendCampaignIncompleteTargets
      successNotification({ title: 'Reminder sent', description: `Queued ${queuedCount}${skippedCount ? `, skipped ${skippedCount}` : ''}.` })
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

  const status = campaign.status
  const launched = !!campaign.launchedAt
  const isDraft = status === CampaignCampaignStatus.DRAFT
  const isEditable = isDraft
  const hasQuestionnaire = !!campaign.templateID
  const campaignTypeLabel = hasQuestionnaire ? 'Questionnaire' : 'Custom'
  const canLaunch = isDraft
  const canCancel = status !== CampaignCampaignStatus.COMPLETED && status !== CampaignCampaignStatus.CANCELED
  const canSendReminder = status === CampaignCampaignStatus.ACTIVE
  const lockBanner =
    !isDraft &&
    {
      [CampaignCampaignStatus.SCHEDULED]: {
        title: 'This campaign is scheduled',
        description: `It will launch on ${campaign.scheduledAt ? formatDate(campaign.scheduledAt as string) : 'the scheduled date'}. Campaign content, settings, and recipients cannot be changed.`,
      },
      [CampaignCampaignStatus.ACTIVE]: {
        title: 'This campaign is active',
        description: 'Campaign content, settings, and recipients cannot be changed. You can monitor progress and send reminders to participants.',
      },
      [CampaignCampaignStatus.COMPLETED]: { title: 'This campaign is completed', description: 'Campaign content, settings, and recipients cannot be changed.' },
      [CampaignCampaignStatus.CANCELED]: { title: 'This campaign was canceled', description: 'Campaign content, settings, and recipients cannot be changed.' },
      [CampaignCampaignStatus.DRAFT]: null,
    }[status ?? CampaignCampaignStatus.ACTIVE]

  const emailTemplateName = emailTemplateOptions.find((option) => option.value === campaign.emailTemplateID)?.label
  const questionnaireName = campaign.template?.name ?? undefined
  const questionnaireQuestionCount = campaign.template ? getQuestionCount(campaign.template.jsonconfig) : 0
  const questionnaireLabel = questionnaireName ? `${questionnaireName} (${questionnaireQuestionCount} question${questionnaireQuestionCount === 1 ? '' : 's'})` : undefined

  const sharedFieldProps = {
    isEditing: false as const,
    isEditAllowed: isEditable,
    isCreate: false as const,
    data: campaign,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleInlineFieldUpdate,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground',
  }

  const menuComponent = (
    <div className="flex items-center gap-2 ml-auto">
      <Menu
        closeOnSelect
        content={(close) => (
          <Button
            variant="destructive"
            icon={<Trash2 size={14} />}
            iconPosition="left"
            className="w-full justify-start"
            onClick={() => {
              handleDeleteCampaign()
              close()
            }}
          >
            Delete Campaign
          </Button>
        )}
      />
      <Button variant="secondary" icon={<Mail size={14} />} iconPosition="left" onClick={() => setTestDialogOpen(true)} className="h-8">
        Send Test Email
      </Button>
      {canCancel && (
        <Button variant="secondary" icon={<Ban size={14} />} iconPosition="left" onClick={handleCancelCampaign} disabled={isUpdating} className="h-8">
          Cancel
        </Button>
      )}
      {canSendReminder && (
        <Button variant="secondary" icon={<SendHorizontal size={14} />} iconPosition="left" onClick={handleSendReminder} disabled={isResending} className="h-8">
          Send Reminder
        </Button>
      )}
      {status === CampaignCampaignStatus.ACTIVE && (
        <Button variant="primary" icon={<CheckCircle size={14} />} iconPosition="left" onClick={handleCompleteCampaign} disabled={isUpdating} className="h-8">
          Complete Campaign
        </Button>
      )}
      {canLaunch && (
        <Button variant="primary" icon={<Rocket size={14} />} iconPosition="left" onClick={() => setLaunchDialogOpen(true)} disabled={isUpdating} className="h-8">
          Launch
        </Button>
      )}
    </div>
  )

  const tmpl = campaign.template

  const sidebarContent = selectedRecipient ? (
    <RecipientDetailPanel recipient={selectedRecipient} onClose={() => setSelectedRecipient(null)} />
  ) : (
    <>
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Properties</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm">{campaignTypeLabel}</span>
          </div>
          <SelectField name="emailTemplateID" label="Email Template" options={emailTemplateOptions} useCustomDisplay={false} {...sharedFieldProps} />
          {hasQuestionnaire && <DateField name="dueDate" label="Due Date" {...sharedFieldProps} />}
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
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm py-2 px-1">{campaign.createdAt ? formatDate(campaign.createdAt as string) : '—'}</span>
          </div>
          {campaign.completedAt && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-sm py-2 px-1">{formatDate(campaign.completedAt as string)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Questionnaires</h3>
        {!tmpl ? (
          <p className="text-sm text-muted-foreground">No questionnaires linked to this campaign.</p>
        ) : (
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
                <p className="text-sm">
                  {questionnaireQuestionCount} question{questionnaireQuestionCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {campaign.assessmentID && (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="w-full justify-center"
                onClick={() => window.open(`/automation/questionnaires/${campaign.assessmentID}`, '_blank', 'noopener,noreferrer')}
              >
                View responses <ExternalLink size={14} className="ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )

  const mainContent = (
    <div className="pr-4">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <TextField
            name="name"
            label=""
            isEditing={false}
            isEditAllowed
            isCreate={false}
            data={campaign}
            internalEditing={internalEditing}
            setInternalEditing={setInternalEditing}
            handleUpdate={handleInlineFieldUpdate}
            layout="vertical"
            className="text-xl font-semibold"
          />
          {status && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              {CampaignStatusIconMapper[status]}
              {getEnumLabel(status)}
            </Badge>
          )}
          <Badge variant="outline" className="text-muted-foreground">
            {launched ? `Launched ${formatDate(campaign.launchedAt as string)}` : campaign.scheduledAt ? `Scheduled ${formatDate(campaign.scheduledAt as string)}` : 'Not launched'}
          </Badge>
        </div>
        <TextField
          name="description"
          label=""
          isEditing={false}
          isEditAllowed
          isCreate={false}
          data={campaign}
          internalEditing={internalEditing}
          setInternalEditing={setInternalEditing}
          handleUpdate={handleInlineFieldUpdate}
          layout="vertical"
          className="text-sm text-muted-foreground"
        />
      </div>

      {isDraft ? (
        <CampaignSetupView
          emailTemplateName={emailTemplateName}
          questionnaireName={questionnaireName}
          questionnaireQuestionCount={questionnaireQuestionCount}
          dueDate={campaign.dueDate as string | null | undefined}
          recipientCount={stats.total}
          onEditDetails={() => setEditDetailsOpen(true)}
          onChangeTemplate={() => setChangeTemplateOpen(true)}
          onConfigureQuestionnaire={() => setQuestionnaireDialogOpen(true)}
          onRemoveQuestionnaire={handleRemoveQuestionnaire}
          onAddRecipients={() => setAddRecipientsOpen(true)}
          onSendTest={() => setTestDialogOpen(true)}
          onLaunch={() => setLaunchDialogOpen(true)}
        />
      ) : (
        <>
          {lockBanner && (
            <div className="mb-4 flex gap-3 rounded-md border border-border bg-card p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                <Lock size={16} className="text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{lockBanner.title}</span>
                <span className="text-sm text-muted-foreground">{lockBanner.description}</span>
              </div>
            </div>
          )}
          <div className="rounded-md border border-border bg-card p-4 mb-4 w-full">
            <h3 className="text-sm font-semibold mb-3">Campaign Progress</h3>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

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
        </>
      )}
    </div>
  )

  return (
    <FormProvider {...form}>
      <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} minWidth={350}>
        {mainContent}
      </SlideBarLayout>
      <SendTestEmailDialog campaignId={campaignId} open={testDialogOpen} onOpenChange={setTestDialogOpen} />
      <LaunchCampaignDialog
        open={launchDialogOpen}
        onOpenChange={setLaunchDialogOpen}
        onLaunch={handleLaunch}
        isPending={isUpdating}
        summary={{ recipientCount: stats.total, emailTemplateName, questionnaireLabel }}
      />
      <EditDetailsDialog
        open={editDetailsOpen}
        onOpenChange={setEditDetailsOpen}
        initialName={campaign.name ?? ''}
        initialDescription={campaign.description ?? ''}
        onSave={handleSaveDetails}
        isPending={isUpdating}
      />
      <ChangeTemplateDialog
        open={changeTemplateOpen}
        onOpenChange={setChangeTemplateOpen}
        options={emailTemplateOptions}
        value={campaign.emailTemplateID ?? undefined}
        isLoading={emailTemplatesLoading}
        onSave={handleSaveTemplate}
        isPending={isUpdating}
      />
      <SelectQuestionnaireDialog
        open={questionnaireDialogOpen}
        onOpenChange={setQuestionnaireDialogOpen}
        templates={questionnaireTemplates ?? []}
        isLoading={questionnairesLoading}
        selectedId={campaign.templateID ?? undefined}
        onSelect={(template) => handleSelectQuestionnaire(template.id)}
      />
      <AddRecipientsDialog open={addRecipientsOpen} onOpenChange={setAddRecipientsOpen} campaignId={campaignId} />
    </FormProvider>
  )
}

export default CampaignDetailPage
