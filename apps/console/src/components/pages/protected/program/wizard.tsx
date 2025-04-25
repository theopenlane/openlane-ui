import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'

import { defineStepper } from '@stepperize/react'

import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { FormProvider, useForm, useFormState } from 'react-hook-form'

import { initProgramSchema, ProgramInitComponent } from './wizard/step-1-init'
import { programDetailSchema, ProgramDetailsComponent } from './wizard/step-2-details'
import { ProgramInviteComponent, programInviteSchema } from './wizard/step-3-team'
import { ProgramObjectAssociationComponent, programObjectAssociationSchema } from './wizard/step-4-associate'
import { CreateProgramWithMembersInput, ProgramMembershipRole, ProgramProgramStatus, ProgramProgramType } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useRouter } from 'next/navigation'
import { dialogStyles } from './dialog.styles'
import { mapToNode } from './nodes'
import { Check } from 'lucide-react'
import { SummaryCard } from './summary-card'
import { useCreateProgramWithMembers, useGetProgramEdgesForWizard } from '@/lib/graphql-hooks/programs'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'

export type FormFields = z.infer<typeof initProgramSchema & typeof programDetailSchema & typeof programInviteSchema & typeof programObjectAssociationSchema>

const { useStepper, steps } = defineStepper(
  { id: 'init', label: 'Basic information', schema: initProgramSchema },
  { id: 'details', label: 'Auditors', schema: programDetailSchema },
  { id: 'invite', label: 'Add team members', schema: programInviteSchema },
  { id: 'link', label: 'Associate existing objects', schema: programObjectAssociationSchema },
)
const today = new Date()

interface ProgramWizardProps {
  onSuccess?: () => void
  requestClose?: () => void
  blockClose?: (trigger: () => void) => void
}

const ProgramWizard = ({ onSuccess, requestClose, blockClose }: ProgramWizardProps) => {
  const { successNotification, errorNotification } = useNotification()
  // styles
  const { linkItem, formInput, buttonRow } = dialogStyles()

  // router for navigation
  const router = useRouter()

  // form and stepper
  const stepper = useStepper()

  const { mutateAsync: createNewProgram, isError } = useCreateProgramWithMembers()
  const { data: edgeData } = useGetProgramEdgesForWizard()

  const form = useForm({
    mode: 'onTouched',
    resolver: zodResolver(stepper.current.schema),
  })

  const fullForm = useForm<FormFields>({
    mode: 'all',
    resolver: zodResolver(z.union([initProgramSchema, programDetailSchema, programInviteSchema, programObjectAssociationSchema])),
  })

  const { handleSubmit, getValues, setValue } = form

  const { isValid, isDirty } = useFormState({ control: form.control })
  const { isValid: isFullFormValid } = useFormState({ control: fullForm.control })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const groupRes = edgeData?.groups?.edges || []
  const userRes = edgeData?.orgMemberships.edges || []
  const policyRes = edgeData?.internalPolicies.edges || []
  const procedureRes = edgeData?.procedures.edges || []
  const riskRes = edgeData?.risks.edges || []

  // map to a common format
  const groups = mapToNode(groupRes)
  const users = mapToNode(userRes)
  const policies = mapToNode(policyRes)
  const procedures = mapToNode(procedureRes)
  const risks = mapToNode(riskRes)

  const currentIndex = stepper.all.findIndex((item) => item.id === stepper.current.id)

  const [showPrompt, setShowPrompt] = useState(false)

  const navGuard = useNavigationGuard({
    enabled: fullForm.formState.isDirty,
  })

  const handleChange = (data: zInfer<typeof stepper.current.schema>) => {
    Object.entries(data).forEach(([key, value]) => {
      setValue(`${key}`, value)
    })
  }

  const onSubmit = (data: zInfer<typeof stepper.current.schema>) => {
    if (stepper.isLast) {
      return
    }

    handleChange(data)
  }

  const createProgram = async (input: CreateProgramWithMembersInput) => {
    try {
      const resp = await createNewProgram({ input })

      successNotification({
        title: 'Program Created',
        description: `Your program, ${resp?.createProgramWithMembers?.program?.name}, has been successfully created`,
      })

      fullForm.reset(getValues())
      router.push(`/programs?id=${resp?.createProgramWithMembers.program.id}`)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the program. Please try again.',
      })
    }
  }

  const handleSkip = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    stepper.goTo(steps[steps.length - 1].id)
  }

  const isFormValid = () => {
    //need to doublecheck because of skipping
    const formData = getValues()

    if (!formData.programType || formData.programType.trim().length < 1) {
      return false
    }

    if (!formData.name || formData.name.trim().length < 1) {
      return false
    }

    if (formData.programType === 'framework' && (!formData.framework || formData.framework.trim() === '')) {
      return false
    }
    return true
  }

  const handleFormSubmit = () => {
    setIsSubmitting(true)

    if (!isFormValid()) {
      errorNotification({
        title: 'Form Invalid',
        description: 'Please fill out all required fields before submitting.',
      })

      setIsSubmitting(false)
      return
    }

    const values = getValues()

    const programMembers =
      values.programMembers?.map((userId: string) => ({
        userID: userId,
        role: ProgramMembershipRole.MEMBER,
      })) || []

    const programAdmins =
      values.programAdmins?.map((userId: string) => ({
        userID: userId,
        role: ProgramMembershipRole.ADMIN,
      })) || []

    const mapProgramType = (type: string): ProgramProgramType => {
      switch (type) {
        case 'framework':
          return ProgramProgramType.FRAMEWORK
        case 'gap_analysis':
          return ProgramProgramType.GAP_ANALYSIS
        case 'risk_assessment':
          return ProgramProgramType.RISK_ASSESSMENT
        case 'other':
          return ProgramProgramType.OTHER
        default:
          return ProgramProgramType.OTHER
      }
    }

    const input: CreateProgramWithMembersInput = {
      program: {
        name: values.name,
        description: values.description,
        status: values.status,
        startDate: values.startDate,
        endDate: values.endDate,
        internalPolicyIDs: values.policies,
        procedureIDs: values.procedures,
        riskIDs: values.risks,
        auditorReadComments: values.auditorReadComments,
        auditorWriteComments: values.auditorWriteComments,
        auditorReady: values.auditorReady,
        viewerIDs: values.viewers,
        editorIDs: values.editors,
        frameworkName: values.framework,
        programType: mapProgramType(values.programType),
      },
      members: [...programMembers, ...programAdmins],
    }

    createProgram(input)
  }

  const isSkipDisabled = () => {
    const form = getValues()
    if (form.programType === 'framework') {
      return !form.framework || !form.name
    }
    if (form.programType === 'other') {
      return !form.customProgram || !form.name
    }
    return !form.programType || !form.name
  }

  useEffect(() => {
    setValue('startDate', today)
    setValue('endDate', today)
  }, [setValue])

  useEffect(() => {
    if (blockClose) {
      blockClose(() => {
        if (isDirty) {
          setShowPrompt(true)
        } else {
          requestClose?.()
        }
      })
    }
  }, [blockClose, isDirty, requestClose])

  return (
    <div className="flex flex-col">
      <CancelDialog
        isOpen={showPrompt}
        onConfirm={() => {
          setShowPrompt(false)
          requestClose?.()
        }}
        onCancel={() => setShowPrompt(false)}
      />
      <FormProvider {...form}>
        <div className="flex border-b border-t items-center justify-between">
          <ul className="flex py-2.5">
            {stepper.all.map((step, index) => {
              const isCompleted = index < currentIndex
              const isActive = index === currentIndex
              return (
                <div className={`flex ${isActive ? 'opacity-100' : 'opacity-50'}`} key={step.id}>
                  <span className={`mr-2 w-8 h-8 flex justify-center items-center rounded-full text-base font-medium text-white ${isCompleted || isActive ? 'bg-primary' : 'bg-border'}`}>
                    {isCompleted ? <Check size={20} /> : index + 1}
                  </span>
                  <li className={linkItem()}>
                    <span className={`flex items-center font-medium ${isActive ? 'text-brand' : 'text-text-light'}`}>{step.label}</span>
                  </li>
                  {index < stepper.all.length - 1 && <Separator programStep className="mx-1" />}
                </div>
              )
            })}
          </ul>
          <div className={buttonRow()}>
            <Button onClick={stepper.prev} disabled={stepper.isFirst}>
              Back
            </Button>
            {!stepper.isLast ? (
              <Button
                onClick={() => {
                  handleSubmit(onSubmit)
                  stepper.next()
                }}
              >
                Next
              </Button>
            ) : (
              <Button disabled={isSubmitting} onClick={handleFormSubmit}>
                Create Program
              </Button>
            )}
          </div>
        </div>

        <form className={formInput()}>
          <div className="space-y-1 flex justify-between">
            <div>
              {stepper.switch({
                init: () => <ProgramInitComponent />,
                details: () => <ProgramDetailsComponent />,
                invite: () => <ProgramInviteComponent users={users} groups={groups} />,
                link: () => <ProgramObjectAssociationComponent risks={risks} policies={policies} procedures={procedures} />,
              })}
            </div>
            <SummaryCard formData={getValues()} stepper={stepper} />
          </div>
          {!stepper.isLast && (
            <div className="mt-4 flex gap-2 justify-center w-full items-center ">
              <span>In a hurry?</span>
              <Button variant="outline" onClick={handleSkip} disabled={isSkipDisabled()}>
                Skip to end
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
    </div>
  )
}

export { ProgramWizard }
