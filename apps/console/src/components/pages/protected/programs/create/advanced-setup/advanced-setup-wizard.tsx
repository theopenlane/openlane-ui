'use client'

import React, { useEffect, useState } from 'react'
import { defineStepper } from '@stepperize/react'
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
import { fullSchema, step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, validateFullAndNotify, validateStepAndNotify, WizardValues } from './advanced-setup-wizard-config'
import { CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'
import { AdvancedSetupFormSummary } from './advanced-setup-form-summary'

const today = new Date()
const oneYearFromToday = addYears(new Date(), 1)

export default function AdvancedSetupWizard() {
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const router = useRouter()
  const [summaryData, setSummaryData] = useState<WizardValues>({} as WizardValues)

  const { useStepper } = defineStepper(
    { id: '0', label: 'Select a Program Type', schema: step1Schema },
    { id: '1', label: 'General Information', schema: step2Schema },
    { id: '2', label: 'Auditors', schema: step3Schema },
    { id: '3', label: 'Add Team Members', schema: step4Schema },
    { id: '4', label: 'Associate Existing Objects', schema: step5Schema },
  )

  const stepper = useStepper()

  const form = useForm<WizardValues>({
    resolver: zodResolver(stepper.current.schema),
    mode: 'onChange',
    defaultValues: {
      programType: undefined,
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
    },
  })

  const handleNext = async () => {
    if (!stepper.isLast) {
      const valid = await validateStepAndNotify(form, stepper.current.id, errorNotification)
      if (!valid) return
      stepper.next()
    } else {
      const validAll = await validateFullAndNotify(form, errorNotification)
      if (!validAll) return
      await handleFormSubmit()
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      return router.push('/programs/create')
    }
    stepper.prev()
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
        startDate,
        endDate,
        programType: data.programType,
        auditor: data.auditPartnerName,
        auditorEmail: data.auditPartnerEmail || undefined,
        auditFirm: data.auditFirm,
        riskIDs: data.riskIDs?.map((r) => r.value) ?? [],
        internalPolicyIDs: data.internalPolicyIDs?.map((p) => p.value) ?? [],
        procedureIDs: data.procedureIDs?.map((pr) => pr.value) ?? [],
        frameworkName: data.framework,
      },
      members: [...programMembers, ...programAdmins],
    }

    try {
      const resp = await createProgram({ input })
      successNotification({
        title: 'Program Created',
        description: `Your program, ${data.name}, has been successfully created`,
      })
      router.push(`/programs?id=${resp.createProgramWithMembers.program.id}`)
    } catch (e) {
      const errorMessage = parseErrorMessage(e)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const currentIndex = stepper.all.findIndex((item) => item.id === stepper.current.id)

  useEffect(() => {
    setSummaryData(form.getValues() as WizardValues)
  }, [currentIndex, form])

  return (
    <div className="max-w-6xl mx-auto px-6 py-2">
      <StepHeader stepper={stepper} currentIndex={currentIndex} />
      <Separator separatorClass="bg-card" />
      <FormProvider {...form} key={stepper.current.id}>
        <div className="py-6 flex gap-16">
          <div className="flex flex-col flex-1">
            {stepper.switch({
              0: () => <AdvancedSetupStep1 />,
              1: () => <AdvancedSetupStep2 />,
              2: () => <AdvancedSetupStep3 />,
              3: () => <AdvancedSetupStep4 />,
              4: () => <AdvancedSetupStep5 />,
            })}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handleBack} iconPosition="left">
                Back
              </Button>
              <Button onClick={handleNext} disabled={isPending} loading={isPending}>
                {stepper.isLast ? 'Create' : 'Continue'}
              </Button>
            </div>
          </div>
          <AdvancedSetupFormSummary summaryData={summaryData} />
        </div>
      </FormProvider>
    </div>
  )
}
