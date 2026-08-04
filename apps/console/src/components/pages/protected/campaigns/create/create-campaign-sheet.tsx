'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form } from '@repo/ui/form'
import { StepperSheet, type StepperStep } from '@/components/shared/stepper-sheet/stepper-sheet'
import { QuestionnaireStep } from './steps/questionnaire-step'
import { TargetsStep } from './steps/targets-step'
import { EmailTemplateStep } from './steps/email-template-step'
import { toCampaignTargetInputs, type CampaignTargetEntry, type TargetTab } from './steps/targets/target-entry'
import { useCreateCampaignWithOptionalTargets } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CampaignCampaignStatus, CampaignCampaignType } from '@repo/codegen/src/schema'
import useCampaignFormSchema, { type CampaignFormData } from './hooks/use-campaign-form-schema'

interface CreateCampaignSheetProps {
  open: boolean
  onClose: () => void
}

const QUESTIONNAIRE_STEP = 0

export const CreateCampaignSheet: React.FC<CreateCampaignSheetProps> = ({ open, onClose }) => {
  const { form } = useCampaignFormSchema()
  const [currentStep, setCurrentStep] = useState(QUESTIONNAIRE_STEP)

  const [targets, setTargets] = useState<CampaignTargetEntry[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTargetTab, setActiveTargetTab] = useState<TargetTab>('personnel')

  const { mutateAsync: createCampaign, isPending: isCreating } = useCreateCampaignWithOptionalTargets()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const questionnaireTemplateID = form.watch('questionnaireTemplateID')
  const hasQuestionnaire = !!questionnaireTemplateID

  const resetAll = useCallback(() => {
    setCurrentStep(QUESTIONNAIRE_STEP)
    setTargets([])
    setUploadedFile(null)
    setActiveTargetTab('personnel')
    form.reset()
  }, [form])

  const handleCancel = useCallback(() => {
    resetAll()
    onClose()
  }, [resetAll, onClose])

  const createDraft = useCallback(
    async (data: CampaignFormData) => {
      try {
        const campaignId = await createCampaign({
          campaign: {
            name: data.name.trim(),
            description: data.description || undefined,
            campaignType: data.questionnaireTemplateID ? CampaignCampaignType.QUESTIONNAIRE : CampaignCampaignType.CUSTOM,
            status: CampaignCampaignStatus.DRAFT,
            templateID: data.questionnaireTemplateID || undefined,
            emailTemplateID: data.questionnaireTemplateID ? undefined : data.emailTemplateID || undefined,
          },
          targets: toCampaignTargetInputs(targets),
        })

        successNotification({ title: 'Campaign saved as draft' })
        handleCancel()
        router.push(`/automation/campaigns/${campaignId}`)
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [targets, createCampaign, successNotification, errorNotification, handleCancel, router],
  )

  const submitDraft = useCallback(
    () =>
      form.handleSubmit(
        (data) => createDraft(data),
        () => setCurrentStep(QUESTIONNAIRE_STEP),
      )(),
    [form, createDraft],
  )

  const steps: StepperStep[] = useMemo(() => {
    const baseSteps: StepperStep[] = [
      {
        title: 'Campaign Details',
        description: 'Name your campaign and optionally select a questionnaire template',
        content: <QuestionnaireStep form={form} />,
      },
      {
        title: 'Targets',
        description: 'Choose who will receive this campaign',
        content: (
          <TargetsStep targets={targets} onTargetsChange={setTargets} uploadedFile={uploadedFile} onFileUpload={setUploadedFile} activeTab={activeTargetTab} onActiveTabChange={setActiveTargetTab} />
        ),
      },
    ]

    if (hasQuestionnaire) return baseSteps

    return [
      ...baseSteps,
      {
        title: 'Email Template',
        description: 'Choose the email template used to contact recipients',
        content: <EmailTemplateStep form={form} />,
      },
    ]
  }, [form, targets, uploadedFile, activeTargetTab, hasQuestionnaire])

  const activeStep = Math.min(currentStep, steps.length - 1)

  return (
    <Form {...form}>
      <StepperSheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel()
        }}
        title="Create Campaign"
        steps={steps}
        currentStep={activeStep}
        onStepChange={setCurrentStep}
        onCancel={handleCancel}
        onSaveDraft={submitDraft}
        onComplete={submitDraft}
        completeLabel="Create Campaign"
        isSaving={isCreating}
        isCompleting={isCreating}
        isDirty={form.formState.isDirty || targets.length > 0 || uploadedFile !== null}
        canProceed
      />
    </Form>
  )
}
