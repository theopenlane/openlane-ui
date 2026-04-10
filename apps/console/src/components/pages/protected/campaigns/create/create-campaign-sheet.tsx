'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Form } from '@repo/ui/form'
import { StepperSheet, type StepperStep } from '@/components/shared/stepper-sheet/stepper-sheet'
import { QuestionnaireStep } from './steps/questionnaire-step'
import { TargetsStep, type CampaignTargetEntry, type TargetTab } from './steps/targets-step'
import { PreviewStep } from './steps/preview-step'
import { ScheduleStep } from './steps/schedule-step'
import { EmailBrandingPanel } from './email-branding-panel'
import { CreateTemplateSheet } from './create-template-sheet'
import { useCreateCampaign } from '@/lib/graphql-hooks/campaign'
import { useCreateBulkCampaignTarget } from '@/lib/graphql-hooks/campaign-target'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignCampaignStatus } from '@repo/codegen/src/schema'
import useCampaignFormSchema, { type CampaignFormData } from './hooks/use-campaign-form-schema'

interface CreateCampaignSheetProps {
  open: boolean
  onClose: () => void
}

export const CreateCampaignSheet: React.FC<CreateCampaignSheetProps> = ({ open, onClose }) => {
  const { form } = useCampaignFormSchema()
  const [currentStep, setCurrentStep] = useState(0)
  const [showEmailBranding, setShowEmailBranding] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)

  const [targets, setTargets] = useState<CampaignTargetEntry[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTargetTab, setActiveTargetTab] = useState<TargetTab>('csv')

  const { mutateAsync: createCampaign, isPending: isCreating } = useCreateCampaign()
  const { mutateAsync: createBulkTarget } = useCreateBulkCampaignTarget()
  const { successNotification, errorNotification } = useNotification()

  const resetAll = useCallback(() => {
    setCurrentStep(0)
    setTargets([])
    setUploadedFile(null)
    setActiveTargetTab('csv')
    setShowEmailBranding(false)
    setShowCreateTemplate(false)
    form.reset()
  }, [form])

  const handleCancel = useCallback(() => {
    resetAll()
    onClose()
  }, [resetAll, onClose])

  const createTargetsForCampaign = useCallback(
    async (campaignId: string) => {
      const validTargets = targets.filter((t) => t.email.trim())
      if (validTargets.length === 0) return

      await createBulkTarget({
        input: validTargets.map((target) => ({
          campaignID: campaignId,
          email: target.email.trim(),
          fullName: target.fullName.trim() || undefined,
          contactID: target.contactID || undefined,
          userID: target.userID || undefined,
        })),
      })
    },
    [targets, createBulkTarget],
  )

  const submitCampaign = useCallback(
    async (data: CampaignFormData, status: CampaignCampaignStatus) => {
      try {
        const isLaunching = status === CampaignCampaignStatus.ACTIVE
        const now = new Date().toISOString()

        const result = await createCampaign({
          input: {
            name: data.name,
            description: data.description || undefined,
            campaignType: data.campaignType || undefined,
            status,
            templateID: data.questionnaireTemplateID || undefined,
            emailTemplateID: data.templateID || undefined,
            emailBrandingID: data.emailBrandingID || undefined,
            dueDate: data.sendImmediately ? undefined : data.dueDate || undefined,
            scheduledAt: data.sendImmediately && isLaunching ? now : data.scheduledAt || undefined,
            launchedAt: data.sendImmediately && isLaunching ? now : undefined,
          },
        })

        const campaignId = result?.createCampaign?.campaign?.id
        if (campaignId) {
          await createTargetsForCampaign(campaignId)
          successNotification({
            title: status === CampaignCampaignStatus.DRAFT ? 'Campaign saved as draft' : 'Campaign launched successfully',
          })
          handleCancel()
        }
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [createCampaign, createTargetsForCampaign, successNotification, errorNotification, handleCancel],
  )

  const handleSaveDraft = useCallback(async () => {
    const isNameValid = await form.trigger('name')
    if (!isNameValid) {
      setCurrentStep(0)
      return
    }
    const data = form.getValues()
    await submitCampaign(data, CampaignCampaignStatus.DRAFT)
  }, [form, submitCampaign])

  const handleLaunch = useCallback(async () => {
    const data = form.getValues()

    await submitCampaign(data, CampaignCampaignStatus.ACTIVE)
  }, [form, submitCampaign, errorNotification])

  const handleCreateTemplate = useCallback(() => {
    setShowCreateTemplate(true)
  }, [])

  const handleTemplateSave = useCallback(
    (templateId: string, templateName: string) => {
      form.setValue('templateID', templateId, { shouldDirty: true, shouldValidate: true })
      if (!form.getValues('name')?.trim()) {
        form.setValue('name', templateName, { shouldDirty: true })
      }
      setShowCreateTemplate(false)
    },
    [form],
  )

  const handleEmailBrandingSave = useCallback(
    (brandingId: string) => {
      form.setValue('emailBrandingID', brandingId)
      setShowEmailBranding(false)
    },
    [form],
  )

  const steps: StepperStep[] = useMemo(
    () => [
      {
        title: 'Questionnaire',
        description: 'Choose a questionnaire to get started with your campaign',
        content: <QuestionnaireStep form={form} />,
      },
      {
        title: 'Targets',
        description: 'Choose who will receive this campaign',
        content: <TargetsStep targets={targets} onTargetsChange={setTargets} uploadedFile={uploadedFile} onFileUpload={setUploadedFile} activeTab={activeTargetTab} onActiveTabChange={setActiveTargetTab} />,
      },
      {
        title: 'Template',
        description: 'Choose a template to get started with your campaign',
        content: <PreviewStep form={form} onOpenEmailBranding={() => setShowEmailBranding(true)} onCreateTemplate={handleCreateTemplate} />,
      },
      {
        title: 'Schedule',
        description: 'Set when your campaign should start and configure reminders',
        content: <ScheduleStep form={form} />,
      },
    ],
    [form, targets, uploadedFile, handleCreateTemplate],
  )

  return (
    <>
      <Form {...form}>
        <StepperSheet
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCancel()
          }}
          title="Create Campaign"
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onCancel={handleCancel}
          onSaveDraft={handleSaveDraft}
          onComplete={handleLaunch}
          completeLabel="Launch Now"
          isSaving={isCreating}
          isCompleting={isCreating}
          isDirty={form.formState.isDirty || targets.length > 0 || uploadedFile !== null}
          canProceed
        />
      </Form>
      <EmailBrandingPanel open={showEmailBranding} onClose={() => setShowEmailBranding(false)} onSave={handleEmailBrandingSave} />
      <CreateTemplateSheet open={showCreateTemplate} onClose={() => setShowCreateTemplate(false)} onCreated={handleTemplateSave} />
    </>
  )
}
