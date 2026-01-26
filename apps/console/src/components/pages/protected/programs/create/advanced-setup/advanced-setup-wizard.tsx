'use client'

import React, { useContext, useEffect, useState } from 'react'
import { defineStepper, Step } from '@stepperize/react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  validateFullAndNotify,
  validateStepAndNotify,
  WizardValues,
} from './advanced-setup-wizard-config'
import { CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'
import { AdvancedSetupFormSummary } from './advanced-setup-form-summary'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import SelectCategoryStep from '../shared/steps/select-category-step'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

const today = new Date()
const oneYearFromToday = addYears(today, 1)

export default function AdvancedSetupWizard() {
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const router = useRouter()
  const [summaryData, setSummaryData] = useState<WizardValues>({} as WizardValues)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)

  const { useStepper } = defineStepper(
    { id: '0', label: 'Select a Program Type', schema: step1Schema },
    { id: '1', label: 'General Information', schema: step2Schema },
    { id: '2', label: 'Select SOC 2 Categories', schema: categoriesStepSchema },
    { id: '3', label: 'Auditors', schema: step3Schema },
    { id: '4', label: 'Add Team Members', schema: step4Schema },
    { id: '5', label: 'Associate Existing Objects', schema: step5Schema },
  )

  const stepper = useStepper()

  const form = useForm<WizardValues>({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
    defaultValues: {
      programKindName: undefined,
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
    },
  })

  const framework = form.watch('framework')

  const disabledIDs = framework === 'SOC 2' ? [] : ['2']

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
      categories: framework === 'SOC 2' ? data.categories : undefined,
      members: [...programMembers, ...programAdmins],
      standardID: data.standardID,
    }

    try {
      const resp = await createProgram({ input })
      successNotification({
        title: 'Program Created',
        description: `Your program, ${data.name}, has been successfully created`,
      })
      router.push(`/programs/${resp.createProgramWithMembers.program.id}`)
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
      { label: 'Compliance' },
      { label: 'Programs', href: '/programs' },
      { label: 'Create', href: '/programs/create' },
      { label: 'Advanced Setup', href: '/programs/create/advanced-setup' },
    ])
  }, [setCrumbs])

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-2">
        <StepHeader stepper={stepper} disabledIDs={disabledIDs} />
        <Separator separatorClass="bg-card" />
        <FormProvider {...form} key={stepper.current.id}>
          <div className="py-6 flex gap-16">
            <div className="flex flex-col flex-1">
              {stepper.switch({
                0: () => <AdvancedSetupStep1 />,
                1: () => <AdvancedSetupStep2 />,
                2: () => <SelectCategoryStep />,
                3: () => <AdvancedSetupStep3 />,
                4: () => <AdvancedSetupStep4 isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />,
                5: () => <AdvancedSetupStep5 />,
              })}

              <div className="flex justify-between mt-8">
                <Button variant="secondary" onClick={handleBack} iconPosition="left">
                  Back
                </Button>
                <Button variant="primary" onClick={handleNext} disabled={isPending} loading={isPending}>
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
