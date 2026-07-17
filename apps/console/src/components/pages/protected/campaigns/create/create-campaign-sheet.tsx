'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Form } from '@repo/ui/form'
import { StepperSheet, type StepperStep } from '@/components/shared/stepper-sheet/stepper-sheet'
import { QuestionnaireStep } from './steps/questionnaire-step'
import { TargetsStep } from './steps/targets-step'
import { EmailTemplateStep } from './steps/email-template-step'
import { type CampaignTargetEntry, type TargetTab } from './steps/targets/target-entry'
import { useCreateCampaignWithTargets } from '@/lib/graphql-hooks/campaign'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isValidEmail } from '@/lib/validators'
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

  const { mutateAsync: createCampaignWithTargets, isPending: isCreating } = useCreateCampaignWithTargets()
  const { successNotification, errorNotification } = useNotification()

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
        const validTargets = targets.filter((target) => isValidEmail(target.email.trim()))

        await createCampaignWithTargets({
          input: {
            campaign: {
              name: data.name.trim(),
              description: data.description || undefined,
              campaignType: data.questionnaireTemplateID ? CampaignCampaignType.QUESTIONNAIRE : CampaignCampaignType.CUSTOM,
              status: CampaignCampaignStatus.DRAFT,
              templateID: data.questionnaireTemplateID || undefined,
              emailTemplateID: data.emailTemplateID || undefined,
            },
            targets: validTargets.map((target) => ({
              email: target.email.trim(),
              fullName: target.fullName.trim() || undefined,
              contactID: target.contactID || undefined,
            })),
          },
        })

        successNotification({ title: 'Campaign saved as draft' })
        handleCancel()
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [targets, createCampaignWithTargets, successNotification, errorNotification, handleCancel],
  )

  const submitDraft = useCallback(
    () =>
      form.handleSubmit(
        (data) => createDraft(data),
        () => setCurrentStep(QUESTIONNAIRE_STEP),
      )(),
    [form, createDraft],
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
        content: <EmailTemplateStep form={form} />,
      },
    ],
    [form, targets, uploadedFile, activeTargetTab],
  )

  return (
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
