'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Form } from '@repo/ui/form'
import { StepperSheet, type StepperStep } from '@/components/shared/stepper-sheet/stepper-sheet'
import { QuestionnaireStep } from './steps/questionnaire-step'
import { TargetsStep } from './steps/targets-step'
import { EmailTemplateStep } from './steps/email-template-step'
import { ScheduleStep } from './steps/schedule-step'
import { CreateTemplateSheet } from './create-template-sheet'
import { type CampaignTargetEntry, type TargetTab } from './steps/targets/target-entry'
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

const QUESTIONNAIRE_STEP = 0

export const CreateCampaignSheet: React.FC<CreateCampaignSheetProps> = ({ open, onClose }) => {
  const { form } = useCampaignFormSchema()
  const [currentStep, setCurrentStep] = useState(QUESTIONNAIRE_STEP)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const createdCampaignIdRef = useRef<string | null>(null)

  const [targets, setTargets] = useState<CampaignTargetEntry[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTargetTab, setActiveTargetTab] = useState<TargetTab>('personnel')

  const { mutateAsync: createCampaign, isPending: isCreating } = useCreateCampaign()
  const { mutateAsync: createBulkTarget } = useCreateBulkCampaignTarget()
  const { successNotification, errorNotification } = useNotification()

  const resetAll = useCallback(() => {
    setCurrentStep(QUESTIONNAIRE_STEP)
    setTargets([])
    setUploadedFile(null)
    setActiveTargetTab('personnel')
    setShowCreateTemplate(false)
    createdCampaignIdRef.current = null
    form.reset()
  }, [form])

  const handleCancel = useCallback(() => {
    resetAll()
    onClose()
  }, [resetAll, onClose])

  const createTargetsForCampaign = useCallback(
    async (campaignId: string) => {
      const validTargets = targets.filter((target) => target.email.trim())
      if (validTargets.length === 0) return

      await createBulkTarget({
        input: validTargets.map((target) => ({
          campaignID: campaignId,
          email: target.email.trim(),
          fullName: target.fullName.trim() || undefined,
          contactID: target.contactID || undefined,
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

        if (!createdCampaignIdRef.current) {
          const result = await createCampaign({
            input: {
              name: data.name.trim(),
              description: data.description || undefined,
              campaignType: data.campaignType || undefined,
              status,
              templateID: data.questionnaireTemplateID || undefined,
              emailTemplateID: data.emailTemplateID || undefined,
              dueDate: data.sendImmediately ? undefined : data.dueDate || undefined,
              scheduledAt: data.sendImmediately && isLaunching ? now : data.scheduledAt || undefined,
              launchedAt: data.sendImmediately && isLaunching ? now : undefined,
            },
          })
          createdCampaignIdRef.current = result?.createCampaign?.campaign?.id ?? null
        }

        const campaignId = createdCampaignIdRef.current
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

  const submitWithStatus = useCallback(
    (status: CampaignCampaignStatus) =>
      form.handleSubmit(
        (data) => submitCampaign(data, status),
        () => setCurrentStep(QUESTIONNAIRE_STEP),
      )(),
    [form, submitCampaign],
  )

  const handleSaveDraft = useCallback(() => submitWithStatus(CampaignCampaignStatus.DRAFT), [submitWithStatus])

  const handleLaunch = useCallback(() => submitWithStatus(CampaignCampaignStatus.ACTIVE), [submitWithStatus])

  const handleTemplateSave = useCallback(
    (templateId: string) => {
      form.setValue('emailTemplateID', templateId, { shouldDirty: true, shouldValidate: true })
      setShowCreateTemplate(false)
    },
    [form],
  )

  const steps: StepperStep[] = useMemo(
    () => [
      {
        title: 'Questionnaire',
        description: 'Name your campaign and optionally attach a questionnaire',
        content: <QuestionnaireStep form={form} />,
      },
      {
        title: 'Targets',
        description: 'Choose who will receive this campaign',
        content: (
          <TargetsStep targets={targets} onTargetsChange={setTargets} uploadedFile={uploadedFile} onFileUpload={setUploadedFile} activeTab={activeTargetTab} onActiveTabChange={setActiveTargetTab} />
        ),
      },
      {
        title: 'Email Template',
        description: 'Choose the email template used to contact recipients',
        content: <EmailTemplateStep form={form} onCreateTemplate={() => setShowCreateTemplate(true)} />,
      },
      {
        title: 'Schedule',
        description: 'Set when your campaign should start and configure reminders',
        content: <ScheduleStep form={form} />,
      },
    ],
    [form, targets, uploadedFile, activeTargetTab],
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
      <CreateTemplateSheet open={showCreateTemplate} onClose={() => setShowCreateTemplate(false)} onCreated={handleTemplateSave} />
    </>
  )
}
