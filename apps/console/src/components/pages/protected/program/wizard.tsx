import Link from 'next/link'
import React, { useState } from 'react'

import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { Accordion, AccordionItem } from '@radix-ui/react-accordion'

import { BookTextIcon, EyeIcon, LinkIcon, ShieldPlusIcon, UserRoundPlusIcon } from 'lucide-react'

import { defineStepper, Step } from '@stepperize/react'

import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { FormProvider, useForm, useFormState } from 'react-hook-form'

import { initProgramSchema, ProgramInitComponent } from './wizard/step-1-init'
import { programDetailSchema, ProgramDetailsComponent } from './wizard/step-2-details'
import { ProgramInviteComponent, programInviteSchema } from './wizard/step-3-team'
import { ProgramObjectAssociationComponent, programObjectAssociationSchema } from './wizard/step-4-associate'
import { ProgramReviewComponent } from './wizard/step-5-review'
import {
  CreateProgramWithMembersInput,
  ProgramMembershipRole,
  useCreateProgramWithMembersMutation,
  useGetAllGroupsQuery,
  useGetAllInternalPoliciesQuery,
  useGetAllOrganizationMembersQuery,
  useGetAllProceduresQuery,
  useGetAllRisksQuery,
  useGetProgramEdgesForWizardQuery,
} from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { toast } from '@repo/ui/use-toast'
import { useRouter } from 'next/navigation'
import { dialogStyles } from './dialog.styles'
import { mapToNode } from './nodes'

interface StepperProps extends Step {
  description?: string
  details?: string
  icon: React.ReactNode
}

const stepDetails: StepperProps[] = [
  { id: 'init', description: 'Get started by choosing one of the supported audit frameworks or build your own custom program', icon: <ShieldPlusIcon size={20} /> },
  { id: 'details', description: 'Customize your program by configuring your audit period and partners', icon: <BookTextIcon size={20} /> },
  { id: 'invite', description: 'Invite your team to the program with customizable roles', icon: <UserRoundPlusIcon size={20} /> },
  { id: 'link', description: 'Associate existing objects with the program (e.g. policies, procedures, etc.)', icon: <LinkIcon size={20} /> },
  { id: 'review', description: 'Review the final details before creation', icon: <EyeIcon size={20} /> },
]

const { useStepper, steps } = defineStepper(
  { id: 'init', label: 'New Program', schema: initProgramSchema },
  { id: 'details', label: 'Program Details', schema: programDetailSchema },
  { id: 'invite', label: 'Add Your Team', schema: programInviteSchema },
  { id: 'link', label: 'Associate Existing Objects', schema: programObjectAssociationSchema },
  { id: 'review', label: 'Review', schema: z.object({}) },
)

const ProgramWizard = () => {
  // styles
  const { navCard, linkItem, formInput, formCard, buttonRow } = dialogStyles()

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
    handleChange(data)

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
    <div className="flex flex-row">
      <FormProvider {...form}>
        <Card className={navCard()}>
          <nav aria-label="Program Creation" className="group">
            <Accordion type="multiple">
              {stepper.all.map((step, index, array) => (
                <AccordionItem
                  key={step.id}
                  value={step.id}
                  className={`${index - 1 < stepper.current.index ? 'rounded-md font-bold hover:bg-teal-200 bg-button-muted h-1/3' : 'bg-background-secondary text-text'}`}
                >
                  <li key={step.id} className={linkItem()}>
                    <Link
                      aria-current={stepper.current.id === step.id ? 'step' : undefined}
                      aria-posinset={index + 1}
                      aria-setsize={steps.length}
                      aria-selected={stepper.current.id === step.id}
                      className="flex"
                      href={`#${step.id}`}
                      onClick={(data) => onClick(step.id, data)}
                    >
                      <span className="flex items-center">
                        <span className="mx-2 py-2">{stepDetails[index].icon}</span>
                        <span className="ml-2 mr-10">
                          <span>{step.label}</span>
                          <br />
                          <div className="">
                            <span className="text-xs">{stepDetails[index].description}</span>
                          </div>
                        </span>
                      </span>
                    </Link>
                  </li>
                  {index < array.length - 1 && <Separator full className={`flex-1 mx-0 ${index < stepper.current.index ? 'bg-primary' : 'bg-muted mx-0'}`} />}
                </AccordionItem>
              ))}
            </Accordion>
          </nav>
        </Card>
        <Card className={formCard()}>
          <form onSubmit={handleSubmit(onSubmit)} className={formInput()}>
            <div className="h-full space-y-1">
              {stepper.switch({
                init: () => <ProgramInitComponent />,
                details: () => <ProgramDetailsComponent />,
                invite: () => <ProgramInviteComponent users={users} groups={groups} />,
                link: () => <ProgramObjectAssociationComponent risks={risks} policies={policies} procedures={procedures} />,
                review: () => <ProgramReviewComponent users={users} groups={groups} risks={risks} policies={policies} procedures={procedures} />,
              })}
            </div>
            <div className={buttonRow()}>
              {!stepper.isLast ? (
                <>
                  <Button onClick={stepper.prev} disabled={stepper.isFirst}>
                    Back
                  </Button>
                  <Button type="submit" disabled={!isValid}>
                    Next
                  </Button>
                </>
              ) : (
                <Button disabled={isSubmitting} onClick={handleFormSubmit}>
                  Create Program
                </Button>
              )}
            </div>
          </form>
        </Card>
      </FormProvider>
    </div>
  )
}

export { ProgramWizard }
