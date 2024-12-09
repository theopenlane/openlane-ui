import Link from "next/link"
import React from "react"

import { Button } from "@repo/ui/button"
import { Card } from "@repo/ui/cardpanel";
import { Separator } from "@repo/ui/separator"
import { Accordion, AccordionItem } from "@radix-ui/react-accordion"

import { BookTextIcon, EyeIcon, LinkIcon, ShieldPlusIcon, UserRoundPlusIcon } from "lucide-react"

import { defineStepper, Step } from '@stepperize/react';

import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'

import { initProgramSchema, ProgramInitComponent } from "./wizard/step-1-init"
import { programDetailSchema, ProgramDetailsComponent } from "./wizard/step-2-details"
import { ProgramInviteComponent, programInviteSchema } from "./wizard/step-3-team"
import { ProgramObjectAssociationComponent, programObjectAssociationSchema } from "./wizard/step-4-associate"
import { ProgramReviewComponent } from "./wizard/step-5-review"
import { useGetAllGroupsQuery, useGetAllInternalPoliciesQuery, useGetAllOrganizationMembersQuery, useGetAllProceduresQuery, useGetAllRisksQuery } from "@repo/codegen/src/schema";
import { useSession } from "next-auth/react";


interface StepperProps extends Step {
    description?: string;
    details?: string;
    icon: React.ReactNode;
}

const stepDetails: StepperProps[] = [
    { id: 'init', description: "Get started by choosing one the the support audit frameworks or build your own custom program", icon: <ShieldPlusIcon /> },
    { id: 'details', description: "Customize your program by configuring your audit period and partners", icon: <BookTextIcon /> },
    { id: 'invite', description: "Invite your team to the program with customizable roles", icon: <UserRoundPlusIcon /> },
    { id: 'link', description: "Associate existing objects with the program (e.g. policies, procedures, etc.)", icon: <LinkIcon /> },
    { id: 'review', description: "Review the final details before creation", icon: <EyeIcon /> }
];

const { useStepper, steps } = defineStepper(
    { id: 'init', label: 'New Program', schema: initProgramSchema },
    { id: 'details', label: 'Program Details', schema: programDetailSchema },
    { id: 'invite', label: 'Add Your Team', schema: programInviteSchema },
    { id: 'link', label: 'Associate Existing Objects', schema: programObjectAssociationSchema },
    { id: 'review', label: 'Review', schema: z.object({}) }
)

export interface Node {
    node: {
        id: string;
        name: string;
    };
}

const ProgramWizard = () => {
    const { data: sessionData, update: updateSession } = useSession()
    const stepper = useStepper();

    const form = useForm({
        mode: "onTouched",
        resolver: zodResolver(stepper.current.schema),
    });

    const {
        handleSubmit,
        getValues,
        setValue
    } = form;

    const [allGroups] = useGetAllGroupsQuery({ pause: !sessionData })
    const [allUsers] = useGetAllOrganizationMembersQuery({ pause: !sessionData })
    const [allPolicies] = useGetAllInternalPoliciesQuery({ pause: !sessionData })
    const [allProcedures] = useGetAllProceduresQuery({ pause: !sessionData })
    const [allRisks] = useGetAllRisksQuery({ pause: !sessionData })

    const groupRes = allGroups?.data?.groups.edges || []
    const userRes = allUsers?.data?.orgMemberships.edges || []
    const policyRes = allPolicies?.data?.internalPolicies.edges || []
    const procedureRes = allProcedures?.data?.procedures.edges || []
    const riskRes = allRisks?.data?.risks.edges || []

    const groups = groupRes
        .map((group) => {
            if (!group || !group.node) return null

            var res: Node = {
                node: {
                    id: group.node.id,
                    name: group.node.name
                }
            }

            return res
        })
        .filter((group): group is Node => group !== null)


    const users = userRes
        .map((user) => {
            if (!user || !user.node) return null

            var res: Node = {
                node: {
                    id: user.node.user.id,
                    name: user.node.user.firstName + ' ' + user.node.user.lastName
                }
            }

            return res
        })
        .filter((group): group is Node => group !== null)

    const policies = policyRes
        .map((policy) => {
            if (!policy || !policy.node) return null

            var res: Node = {
                node: {
                    id: policy.node.id,
                    name: policy.node.name
                }
            }

            return res
        }
        ).filter((policy): policy is Node => policy !== null)


    const procedures = procedureRes
        .map((procedure) => {
            if (!procedure || !procedure.node) return null

            var res: Node = {
                node: {
                    id: procedure.node.id,
                    name: procedure.node.name
                }
            }

            return res
        }
        ).filter((procedure): procedure is Node => procedure !== null)

    const risks = riskRes
        .map((risk) => {
            if (!risk || !risk.node) return null

            var res: Node = {
                node: {
                    id: risk.node.id,
                    name: risk.node.name
                }
            }

            return res
        }
        ).filter((risk): risk is Node => risk !== null)


    const onClick = (id: typeof steps[number]['id'], data: zInfer<typeof stepper.current.schema>) => {
        console.log("meow", id)
        console.log(getValues())
        Object.entries(data).forEach(([key, value]) => {
            setValue(`${key}`, value);
        });
        stepper.goTo(id);
    }

    const onSubmit = (data: zInfer<typeof stepper.current.schema>) => {
        if (stepper.isLast) {
            console.log('submitting')
            return;
        }

        Object.entries(data).forEach(([key, value]) => {
            setValue(`${key}`, value);
        });

        stepper.next();
    }


    const handleFormSubmit = () => {
        console.log(getValues());
        console.log('submitting')
    }

    return (
        <>
            <div className="flex flex-row">

                <FormProvider  {...form}>
                    <Card className="flex items-center mr-5 w-1/4 h-full">
                        <nav aria-label="Program Creation" className="group">
                            <Accordion type="multiple">
                                {stepper.all.map((step, index, array) => (
                                    <AccordionItem key={step.id} value={step.id} className={`${index - 1 < stepper.current.index ? 'rounded-md font-bold hover:bg-muted bg-java-400 h-1/3 text-oxford-blue-900' : 'bg-muted'}`}>
                                        <li key={step.id} className="flex items-center w-full mx-3 h-[144px]">
                                            <Link
                                                aria-current={
                                                    stepper.current.id === step.id ? 'step' : undefined
                                                }
                                                aria-posinset={index + 1}
                                                aria-setsize={steps.length}
                                                aria-selected={stepper.current.id === step.id}
                                                className="flex"
                                                href={`#${step.id}`}
                                                onClick={(data) => onClick(step.id, data)}
                                            >
                                                <span className="flex items-center" >
                                                    <span className="mx-2">
                                                        {stepDetails[index].icon}
                                                    </span>
                                                    <span className="mx-6">
                                                        <span>{step.label}</span>
                                                        <br />
                                                        <span className="text-xs">
                                                            {stepDetails[index].description}
                                                        </span>
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                        {
                                            index < array.length - 1 && (
                                                <Separator
                                                    className={`flex-1 ${index < stepper.current.index ? 'bg-primary' : 'bg-muted'
                                                        }`}
                                                />
                                            )
                                        }
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </nav>
                    </Card>
                    <Card className="flex items-start w-3/4 h-full">
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="p-6 rounded-lg items-start w-full h-[93%]"
                        >
                            <div className="h-full space-y-1">
                                {stepper.switch({
                                    init: () => <ProgramInitComponent />,
                                    details: () => <ProgramDetailsComponent />,
                                    invite: () => <ProgramInviteComponent users={users} groups={groups} />,
                                    link: () => <ProgramObjectAssociationComponent risks={risks} policies={policies} procedures={procedures} />,
                                    review: () => <ProgramReviewComponent users={users} groups={groups} risks={risks} policies={policies} procedures={procedures} />,
                                })}
                            </div>
                            <div className="flex content-end justify-end gap-2 items-end">
                                {!stepper.isLast ? (
                                    <div className="flex justify-end gap-2 items-end">

                                        <Button
                                            onClick={stepper.prev}
                                            disabled={stepper.isFirst}
                                        >
                                            Back
                                        </Button>
                                        <Button type="submit">
                                            Next
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={handleFormSubmit}>Complete</Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </FormProvider>
            </div >
        </>
    )
}

export { ProgramWizard }

