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
import { CreateProgramWithMembersInput, ProgramMembershipRole, useCreateProgramWithMembersMutation, useGetProgramEdgesForWizardQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { toast } from '@repo/ui/use-toast'
import { useRouter } from 'next/navigation'
import { dialogStyles } from './dialog.styles'
import { mapToNode } from './nodes'
import { Check } from 'lucide-react'
import { SummaryCard } from './summary-card'

export type FormFields = z.infer<typeof initProgramSchema & typeof programDetailSchema & typeof programInviteSchema & typeof programObjectAssociationSchema>

const { useStepper, steps } = defineStepper(
  { id: 'init', label: 'Basic information', schema: initProgramSchema },
  { id: 'details', label: 'Auditors', schema: programDetailSchema },
  { id: 'invite', label: 'Add team members', schema: programInviteSchema },
  { id: 'link', label: 'Associate existing objects', schema: programObjectAssociationSchema },
)

const ProgramWizard = () => {
  // styles
  const { linkItem, formInput, buttonRow } = dialogStyles()

  // router for navigation
  const router = useRouter()

  // session data
  const { data: sessionData } = useSession()

  // form and stepper
  const stepper = useStepper()

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

  // grab all the data from the API to populate the dropdowns
  const [edgeData] = useGetProgramEdgesForWizardQuery({ pause: !sessionData })

  const groupRes = edgeData.data?.groups?.edges || []
  const userRes = edgeData.data?.orgMemberships.edges || []
  const policyRes = edgeData.data?.internalPolicies.edges || []
  const procedureRes = edgeData.data?.procedures.edges || []
  const riskRes = edgeData.data?.risks.edges || []

  // map to a common format
  const groups = mapToNode(groupRes)
  const users = mapToNode(userRes)
  const policies = mapToNode(policyRes)
  const procedures = mapToNode(procedureRes)
  const risks = mapToNode(riskRes)

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

    stepper.next()
  }

  // use the mutation to create a new program
  const createProgram = async (input: CreateProgramWithMembersInput) => {
    const resp = await createNewProgram({
      input: input,
    })
    if (resp.error) {
      toast({
        title: 'Error',
        description: 'There was an error creating the program. Please try again.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }
    toast({
      title: 'Program Created',
      description: `Your program, ${resp?.data?.createProgramWithMembers?.program?.name}, has been successfully created`,
      variant: 'success',
      duration: 5000,
    })
    router.push(`/programs?id=${resp?.data?.createProgramWithMembers.program.id}`)
  }

  // get the result and error from the mutation
  const [result, createNewProgram] = useCreateProgramWithMembersMutation()

  const handleSkip = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    stepper.goTo(steps[steps.length - 1].id)
  }

  // handle the final form submission
  const handleFormSubmit = () => {
    setIsSubmitting(true)

    if (!isFullFormValid) {
      toast({
        title: 'Form Invalid',
        description: 'Please fill out all required fields',
        variant: 'destructive',
        duration: 5000,
      })

      setIsSubmitting(false)

      return
    }

    let programMembers = []
    for (let i = 0; i < getValues().programMembers?.length; i++) {
      programMembers.push({
        userID: getValues().programMembers[i],
        role: ProgramMembershipRole.MEMBER,
      })
    }

    let programAdmins = []
    for (let i = 0; i < getValues().programAdmins?.length; i++) {
      programAdmins.push({
        userID: getValues().programAdmins[i],
        role: ProgramMembershipRole.ADMIN,
      })
    }

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
      return !form.programType || !form.name
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
            {stepper.all.map((step, index, array) => {
              const isCompleted = stepper.current.index > index
              const isActive = step.id === stepper.current.id
              return (
                <div className={`flex ${isActive ? 'opacity-100' : 'opacity-50'}`} key={index}>
                  <span className={`mr-2 w-8 h-8 flex justify-center items-center rounded-full text-base font-medium text-white ${isCompleted || isActive ? 'bg-primary' : 'bg-border'}`}>
                    {isCompleted ? <Check size={20} /> : index + 1}
                  </span>
                  <li key={step.id} className={linkItem()}>
                    <span className={`flex items-center font-medium ${isActive ? 'text-brand' : 'text-text-light'}`}>{step.label}</span>
                  </li>
                  {index < array.length - 1 && <Separator programStep className="mx-1" />}
                </div>
              )
            })}
          </ul>
          <div className={buttonRow()}>
            <Button onClick={stepper.prev} disabled={stepper.isFirst}>
              Back
            </Button>
            {!stepper.isLast ? (
              <Button onClick={handleSubmit(onSubmit)} disabled={!isValid}>
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
