import React, { Fragment, useState } from 'react'

import { Button } from '@repo/ui/button'
import { Separator } from '@repo/ui/separator'

import { defineStepper, Stepper } from '@stepperize/react'

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

  const fullForm = useForm({
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

  // handle the click event for the stepper
  const onClick = (id: (typeof steps)[number]['id'], data: zInfer<typeof stepper.current.schema>) => {
    // handleChange(data)

    stepper.goTo(id)
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
    createNewProgram({
      input: input,
    }).then((result) => {
      return result
    })
  }

  // get the result and error from the mutation
  const [result, createNewProgram] = useCreateProgramWithMembersMutation()
  const { data, error } = result

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

  if (data) {
    toast({
      title: 'Program Created',
      description: `Your program, ${data.createProgramWithMembers?.program?.name}, has been successfully created`,
      variant: 'success',
      duration: 5000,
    })
    router.push(`/programs?id=${data.createProgramWithMembers.program.id}`)
  }

  if (error) {
    toast({
      title: 'Error',
      description: 'There was an error creating the program. Please try again.',
      variant: 'destructive',
      duration: 5000,
    })
  }

  return (
    <div className="flex flex-col">
      <FormProvider {...form}>
        <div className="flex border-b border-t items-center justify-between">
          <ul className="flex py-2.5 ">
            {stepper.all.map((step, index, array) => (
              <Fragment key={index}>
                <span className={`mr-2 w-8 h-8 flex justify-center items-center rounded-full text-base font-medium text-white ${step.id === stepper.current.id ? 'bg-primary' : 'bg-border'}`}>
                  {index + 1}
                </span>
                <li key={step.id} className={linkItem()}>
                  <span className={`flex items-center font-medium ${step.id === stepper.current.id ? 'text-brand' : 'text-text-light'}`}>{step.label}</span>
                </li>
                {index < array.length - 1 && <Separator programStep className="mx-1" />}
              </Fragment>
            ))}
          </ul>
          <div className={buttonRow()}>
            <Button onClick={stepper.prev} disabled={stepper.isFirst}>
              Back
            </Button>
            {!stepper.isLast ? (
              <>
                <Button onClick={handleSubmit(onSubmit)} disabled={!isValid}>
                  Next
                </Button>
              </>
            ) : (
              <Button disabled={isSubmitting} onClick={handleFormSubmit}>
                Create Program
              </Button>
            )}
          </div>
        </div>

        <form className={formInput()}>
          <div className="h-full space-y-1">
            {stepper.switch({
              init: () => <ProgramInitComponent />,
              details: () => <ProgramDetailsComponent stepper={stepper} steps={steps} />,
              invite: () => <ProgramInviteComponent users={users} groups={groups} />,
              link: () => <ProgramObjectAssociationComponent risks={risks} policies={policies} procedures={procedures} />,
              // review: () => <ProgramReviewComponent users={users} groups={groups} risks={risks} policies={policies} procedures={procedures} />,
            })}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

export { ProgramWizard }
