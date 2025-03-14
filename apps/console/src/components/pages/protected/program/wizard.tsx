import React, { useMemo, useState } from 'react'

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
import { CreateProgramWithMembersInput, ProgramMembershipRole } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { useRouter } from 'next/navigation'
import { dialogStyles } from './dialog.styles'
import { mapToNode } from './nodes'
import { Check } from 'lucide-react'
import { SummaryCard } from './summary-card'
import { useCreateProgramWithMembers, useGetProgramEdgesForWizard } from '@/lib/graphql-hooks/programs'

export type FormFields = z.infer<typeof initProgramSchema & typeof programDetailSchema & typeof programInviteSchema & typeof programObjectAssociationSchema>

const { useStepper, steps } = defineStepper(
  { id: 'init', label: 'Basic information', schema: initProgramSchema },
  { id: 'details', label: 'Auditors', schema: programDetailSchema },
  { id: 'invite', label: 'Add team members', schema: programInviteSchema },
  { id: 'link', label: 'Associate existing objects', schema: programObjectAssociationSchema },
)

const ProgramWizard = () => {
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

  const { isValid } = useFormState({ control: form.control })
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

  // set values from the form when page in stepper is changed
  const handleChange = (data: zInfer<typeof stepper.current.schema>) => {
    Object.entries(data).forEach(([key, value]) => {
      setValue(`${key}`, value)
    })
  }

  // handle the form submission for each page in the stepper
  const onSubmit = (data: zInfer<typeof stepper.current.schema>) => {
    if (stepper.isLast) {
      return
    }

    handleChange(data)
  }

  // use the mutation to create a new program
  const createProgram = async (input: CreateProgramWithMembersInput) => {
    const resp = await createNewProgram({
      input: input,
    })
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the program. Please try again.',
      })
      return
    }
    successNotification({
      title: 'Program Created',
      description: `Your program, ${resp?.createProgramWithMembers?.program?.name}, has been successfully created`,
    })
    router.push(`/programs?id=${resp?.createProgramWithMembers.program.id}`)
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

    let programMembers =
      getValues().programMembers?.map((userId: string) => ({
        userID: userId,
        role: ProgramMembershipRole.MEMBER,
      })) || []

    let programAdmins =
      getValues().programAdmins?.map((userId: string) => ({
        userID: userId,
        role: ProgramMembershipRole.ADMIN,
      })) || []

    const input: CreateProgramWithMembersInput = {
      program: {
        name: getValues().name,
        description: getValues().description,
        status: getValues().status,
        startDate: getValues().startDate,
        endDate: getValues().endDate,
        internalPolicyIDs: getValues().policies,
        procedureIDs: getValues().procedures,
        riskIDs: getValues().risks,
        auditorReadComments: getValues().auditorReadComments,
        auditorWriteComments: getValues().auditorWriteComments,
        auditorReady: getValues().auditorReady,
        viewerIDs: getValues().viewers,
        editorIDs: getValues().editors,
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

  return (
    <div className="flex flex-col">
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
