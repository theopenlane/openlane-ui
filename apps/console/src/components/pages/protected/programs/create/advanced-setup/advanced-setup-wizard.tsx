'use client'

import React from 'react'
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
import { fullSchema, step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, WizardValues } from './advanced-setup-wizard-config'
import { CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProgramWithMembers } from '@/lib/graphql-hooks/programs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { addYears } from 'date-fns'

const today = new Date()
const oneYearFromToday = addYears(new Date(), 1)

export default function AdvancedSetupWizard() {
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: createProgram, isPending } = useCreateProgramWithMembers()
  const router = useRouter()

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
    const isValid = await form.trigger()
    console.log('form.getValues()', form.getValues())
    console.log('form.formState.errors', form.formState.errors)

    if (!isValid) return

    if (!stepper.isLast) {
      stepper.next()
    } else {
      handleFormSubmit()
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
      data.programMembers?.map((userId) => ({
        userID: userId,
        role: ProgramMembershipRole.MEMBER,
      })) ?? []

    const programAdmins =
      data.programAdmins?.map((userId) => ({
        userID: userId,
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
        riskIDs: data.riskIDs,
        internalPolicyIDs: data.internalPolicyIDs,
        procedureIDs: data.procedureIDs,
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-2">
      <StepHeader stepper={stepper} currentIndex={currentIndex} />
      <Separator separatorClass="bg-card" />

      {/* key remounts the form when step changes so the resolver updates */}
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
          {/* Right side — Your Program Summary */}
          <div className="space-y-3 w-[400px] shrink-0">
            <h3 className="text-base font-medium mb-6">Your Program</h3>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Basic Information</p>
              <div className="text-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Program Name</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">End Date</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Audit Information</p>
              <div className="text-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audit Partner</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audit Firm</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audit Partner Email</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Team</p>
              <p className="text-xs text-inverted-muted-foreground">Add team members to this program</p>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Associate Existing Objects</p>
              <div className="text-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Associate Existing Risks</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Associate Existing Policies</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Audit Partner Email</span>
                  <span className="text-sm text-inverted-muted-foreground">Empty</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
    </div>
  )
}
