'use client'

import React, { use, useEffect, useState } from 'react'
import { defineStepper, type Step } from '@stepperize/react'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'
import { StepHeader } from '@/components/shared/step-header/step-header'
import AdvancedSetupStep1 from './advanced-setup-steps/advanced-setup-step1'
import AdvancedSetupStep2 from './advanced-setup-steps/advanced-setup-step2'
import AdvancedSetupStep3 from './advanced-setup-steps/advanced-setup-step3'
import AdvancedSetupStep4 from './advanced-setup-steps/advanced-setup-step4'
import AdvancedSetupStep5 from './advanced-setup-steps/advanced-setup-step5'
import {
  categoriesStepSchema,
  fullSchema,
  suggestedControlsStepSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  validateFullAndNotify,
  validateStepAndNotify,
  type WizardValues,
} from './advanced-setup-wizard-config'
import { type CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/program'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'
import { AdvancedSetupFormSummary } from './advanced-setup-form-summary'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import SelectCategoryStep from '../shared/steps/select-category-step'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import SuggestedControlsStep from '../soc2/suggested-controls-step'
import { useCloneControls } from '@/lib/graphql-hooks/standard'

const today = new Date()
const oneYearFromToday = addYears(today, 1)

const SOC2_FRAMEWORK_NAME = 'SOC 2'

export default function AdvancedSetupWizard() {
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const { mutateAsync: cloneControls, isPending: isControlBeingCloned } = useCloneControls()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultFrameworks = searchParams.getAll('frameworks')
  const includeSuggestedControls = searchParams.get('suggestedControls') === 'true'
  const isOnboardingFlow = searchParams.get('onboarding') === 'true'
  const [summaryData, setSummaryData] = useState<WizardValues>({} as WizardValues)
  const { setCrumbs } = use(BreadcrumbContext)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)

  const { useStepper } = defineStepper(
    { id: '0', label: 'Select a Program Type', schema: step1Schema },
    { id: '1', label: 'General Information', schema: step2Schema },
    { id: '2', label: 'Select SOC 2 Categories', schema: categoriesStepSchema },
    ...(includeSuggestedControls ? [{ id: '2a', label: 'Import Controls', schema: suggestedControlsStepSchema }] : []),
    { id: '3', label: 'Auditors', schema: step3Schema },
    { id: '4', label: 'Add Team Members', schema: step4Schema },
    { id: '5', label: 'Associate Existing Objects', schema: step5Schema },
  )

  const stepper = useStepper()

  const form = useForm<WizardValues>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      startDate: today,
      endDate: oneYearFromToday,
      auditPartnerName: '',
      auditFirm: '',
      auditPartnerEmail: '',
      programAdmins: [],
      programMembers: [],
      editAccessGroups: [],
      readOnlyGroups: [],
      riskIDs: [],
      internalPolicyIDs: [],
      procedureIDs: [],
      categories: ['Security'],
      suggestedControlIDs: [],
      suggestedControlCategories: [],
      frameworks: [],
      ...(defaultFrameworks.length > 1 ? { programKindName: 'Framework' } : {}),
    },
  })

  const framework = useWatch({ control: form.control, name: 'framework' })
  const selectedFrameworks = useWatch({ control: form.control, name: 'frameworks' })

  const hasSoc2Framework = framework === SOC2_FRAMEWORK_NAME || selectedFrameworks?.some((selectedFramework) => selectedFramework.value === SOC2_FRAMEWORK_NAME)

  const disabledIDs = [...(hasSoc2Framework ? [] : ['2']), ...(isOnboardingFlow ? ['4'] : [])]

  const handleNext = async () => {
    if (!stepper.isLast) {
      const valid = await validateStepAndNotify(form, stepper.current.id, errorNotification)
      if (!valid) return

      let nextStepIndex = stepper.all.findIndex((s) => s.id === stepper.current.id) + 1
      while (disabledIDs.includes(stepper.all[nextStepIndex]?.id)) {
        nextStepIndex++
      }

      const nextStep = stepper.all[nextStepIndex]
      if (nextStep) {
        stepper.goTo(nextStep.id)
      }
    } else {
      const validAll = await validateFullAndNotify(form, errorNotification)
      if (!validAll) return
      await handleFormSubmit()
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      setShowExitConfirm(true)
    } else {
      stepper.prev()
    }

    let prevStepIndex = stepper.all.findIndex((s) => s.id === stepper.current.id) - 1
    while (disabledIDs.includes(stepper.all[prevStepIndex]?.id)) {
      prevStepIndex--
    }

    const prevStep = stepper.all[prevStepIndex]
    if (prevStep) {
      stepper.goTo(prevStep.id)
    }
  }

  const handleFormSubmit = async () => {
    const values = form.getValues()
    const parsed = fullSchema.safeParse(values)
    if (!parsed.success) {
      errorNotification({
        title: 'Form Invalid',
        description: 'Please review fields highlighted in previous steps.',
      })
      return
    }

    const data = parsed.data

    const programMembers =
      data.programMembers?.map((member) => ({
        userID: member.user.id,
        role: ProgramMembershipRole.MEMBER,
      })) ?? []

    const programAdmins =
      data.programAdmins?.map((admin) => ({
        userID: admin.user.id,
        role: ProgramMembershipRole.ADMIN,
      })) ?? []

    const startDate = data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate
    const endDate = data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate

    const input: CreateProgramWithMembersInput = {
      program: {
        name: data.name || '',
        description: data.description,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        programKindName: data.programKindName,
        auditor: data.auditPartnerName,
        auditorEmail: data.auditPartnerEmail || undefined,
        auditFirm: data.auditFirm,
        riskIDs: data.riskIDs?.map((r) => r.value) ?? [],
        internalPolicyIDs: data.internalPolicyIDs?.map((p) => p.value) ?? [],
        procedureIDs: data.procedureIDs?.map((pr) => pr.value) ?? [],
        frameworkName: data.framework,
        viewerIDs: data?.readOnlyGroups?.map((g) => g.id),
        editorIDs: data?.editAccessGroups?.map((g) => g.id),
      },
      categories: hasSoc2Framework ? data.categories : undefined,
      members: [...programMembers, ...programAdmins],
      standardID: data.standardID,
    }

    try {
      const resp = await createProgram({ input })
      const programID = resp.createProgramWithMembers.program.id

      if (includeSuggestedControls && data.suggestedControlIDs?.length) {
        await cloneControls({
          input: {
            programID,
            controlIDs: data.suggestedControlIDs,
          },
        })
      }

      successNotification({
        title: 'Program Created',
        description: `Your program, ${data.name}, has been successfully created`,
      })
      router.push(`/programs/${programID}`)
    } catch (e) {
      const errorMessage = parseErrorMessage(e)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const currentIndex = stepper.all.findIndex((item: Step) => item.id === stepper.current.id)

  useEffect(() => {
    setSummaryData(form.getValues() as WizardValues)
  }, [currentIndex, form])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'Advanced Setup', href: '/programs/create/advanced-setup' },
    ])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-2">
        {isOnboardingFlow && (
          <div className="mb-6 rounded-md border border-brand/30 bg-brand/5 p-4">
            <p className="text-sm font-semibold">Program creation</p>
            <p className="mt-1 text-sm text-muted-foreground">Your onboarding answers are saved. Now create your compliance program and choose the controls you want to start with.</p>
          </div>
        )}
        <StepHeader stepper={stepper} disabledIDs={disabledIDs} className="mb-6" />
        <Separator separatorClass="bg-card" />
        <FormProvider key={stepper.current.id} {...form}>
          <div className="py-6 flex gap-16">
            <div className="flex flex-col flex-1">
              {stepper.switch({
                0: () => <AdvancedSetupStep1 />,
                1: () => <AdvancedSetupStep2 defaultFrameworks={defaultFrameworks} />,
                2: () => <SelectCategoryStep />,
                '2a': () => <SuggestedControlsStep frameworkName={selectedFrameworks?.map((selectedFramework) => selectedFramework.value).join(', ') || framework} />,
                3: () => <AdvancedSetupStep3 />,
                4: () => <AdvancedSetupStep4 isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />,
                5: () => <AdvancedSetupStep5 />,
              })}

              <div className="flex justify-between mt-8">
                <Button variant="secondary" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button variant="primary" onClick={handleNext} disabled={isPending || isControlBeingCloned} loading={isPending || isControlBeingCloned}>
                  {stepper.isLast ? 'Create' : 'Continue'}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center">
              {stepper.current.id === '4' && (
                <div className="w-full flex justify-end">
                  <Button variant="secondary" type="button" onClick={() => setIsMemberSheetOpen(true)} iconPosition="left">
                    Invite member
                  </Button>
                </div>
              )}
              <AdvancedSetupFormSummary summaryData={summaryData} />
            </div>
          </div>
        </FormProvider>
      </div>

      <ConfirmationDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onConfirm={() => router.push('/programs/create')}
        title="Exit Program Creation"
        description="Are you sure you want to exit Program Creation? You can't undo this."
        confirmationText="Exit"
      />
    </>
  )
}
