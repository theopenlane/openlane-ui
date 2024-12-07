import Link from "next/link"
import React from "react"

import { Button } from "@repo/ui/button"
import { Card } from "@repo/ui/cardpanel";
import { Separator } from "@repo/ui/separator"
import { Accordion, AccordionItem } from "@radix-ui/react-accordion"

import { BookTextIcon, EyeIcon, LinkIcon, ShieldPlusIcon, SquarePlusIcon, UserRoundPlusIcon } from "lucide-react"

import { defineStepper, Step } from '@stepperize/react';

import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { FormProvider, useForm } from 'react-hook-form'

import { initProgramSchema, ProgramInitComponent } from "./wizard/step-1-init"
import { programDetailSchema, ProgramDetailsComponent } from "./wizard/step-2-details"
import { ProgramInviteComponent, programInviteSchema } from "./wizard/step-3-team"
import { ProgramObjectAssociationComponent, programObjectAssociationSchema } from "./wizard/step-4-associate"
import { ProgramReviewComponent, programReviewSchema } from "./wizard/step-5-review"


interface StepperProps extends Step {
    description?: string;
    details?: string;
    icon: React.ReactNode;
}

const stepDetails: StepperProps[] = [
    { id: 'init', description: "Get started by choosing one the the support audit frameworks or build your own custom program", icon: <SquarePlusIcon /> },
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
    { id: 'review', label: 'Review', schema: programReviewSchema }
)

const ProgramWizard = () => {
    const stepper = useStepper();

    const form = useForm({
        mode: "all",
        resolver: zodResolver(stepper.current.schema),
    });

    const {
        handleSubmit,
        reset,
        getValues,
        formState: { isValid, isDirty },
    } = form;

    const handleNext = () => {
        stepper.next();
    };

    const handleBack = () => {
        stepper.prev();
    };

    const onSubmit = () => {
        console.log(JSON.stringify(getValues()));
        alert(JSON.stringify(getValues()));
        handleNext();
    };

    console.log({ isValid, isDirty });

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
                                                onClick={() => stepper.goTo(step.id)}
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
                                    invite: () => <ProgramInviteComponent />,
                                    link: () => <ProgramObjectAssociationComponent />,
                                    review: () => <ProgramReviewComponent />,
                                })}
                            </div>
                            <div className="flex content-end justify-end gap-2 items-end">
                                <div className="flex justify-end gap-2 items-end">
                                    <Button
                                        onClick={handleBack}
                                        disabled={stepper.isFirst}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!isValid}
                                    >
                                        {stepper.isLast ? 'Complete' : 'Next'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Card>
                </FormProvider>
            </div >
        </>
    )
}

export { ProgramWizard }

