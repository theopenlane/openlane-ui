
import { useCreateProgramMutation } from "@repo/codegen/src/schema"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@repo/ui/alert-dialog"
import { Button } from "@repo/ui/button"
import { Panel, PanelHeader } from "@repo/ui/panel"
import { useToast } from "@repo/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { useForm, SubmitHandler, Control, FormProvider, Form, useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form"
import { Input } from '@repo/ui/input'
import { ArrowUpRight } from "lucide-react"
import { CalendarIcon } from '@radix-ui/react-icons'
import { start } from "repl"
import { Popover } from "@repo/ui/popover"
import { useState } from "react"
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { format } from 'date-fns'
import { Calendar } from '@repo/ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/dropdown-menu"
import { defineStepper, Step } from '@stepperize/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/cardpanel";


import React from "react"
import { Separator } from "@repo/ui/separator"
import { initProgramSchema, ProgramInitComponent } from "./wizard/step-1"
import { SideNav } from "@/components/shared/sidebar/sidebar-nav/sidebar-nav"
import { Accordion, AccordionItem } from "@radix-ui/react-accordion"
import { programDetailSchema, ProgramDetailsComponent } from "./wizard/step-2"


interface StepperProps extends Step {
    description?: string;
    details?: string;
}

const stepDetails: StepperProps[] = [
    { id: 'init', label: 'Program Name', schema: initProgramSchema },
    { id: 'details', label: 'Program Details', schema: programDetailSchema },
    { id: "framework", label: "Select Framework", schema: z.object({}) },
    { id: 'invite', label: 'Add Your Team', schema: z.object({}) },
    { id: 'link', label: 'Associate Existing Objects', schema: z.object({}) },
    { id: 'complete', label: 'Complete', schema: z.object({}) }
];


const { useStepper, steps } = defineStepper(
    { id: 'init', label: 'Program Name', schema: initProgramSchema },
    { id: 'details', label: 'Program Details', schema: programDetailSchema },
    { id: "framework", label: "Select Framework", schema: z.object({}) },
    { id: 'invite', label: 'Add Your Team', schema: z.object({}) },
    { id: 'link', label: 'Associate Existing Objects', schema: z.object({}) },
    { id: 'complete', label: 'Complete', schema: z.object({}) }
)


const ProgramWizard = () => {
    const stepper = useStepper();

    const formSchema = z.object({
        name: z.string().min(1, { message: 'Name is required' }),
        startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }),
        endDate: z.date().min(new Date(), { message: 'End date must be after start date' }),
        description: z.string().optional(),
        framework: z.string().optional(),
    })

    type FormData = zInfer<typeof formSchema>

    const form = useForm({
        mode: 'onTouched',
        resolver: zodResolver(stepper.current.schema),
    });

    const onSubmit = (values: z.infer<typeof stepper.current.schema>) => {
        // biome-ignore lint/suspicious/noConsoleLog: <We want to log the form values>
        console.log(`Form values for step ${stepper.current.id}:`, values);
        if (stepper.isLast) {
            stepper.reset();
        } else {
            stepper.next();
        }
    };

    return (
        <>
            <div className="flex flex-row">
                <Card className="flex items-center mr-5 w-[30%]">
                    <nav aria-label="Program Creation" className="group my-4">
                        <Accordion type="multiple">
                            {stepper.all.map((step, index, array) => (
                                <AccordionItem value={step.id} className={`${index - 1 < stepper.current.index ? 'bg-firefly-400' : 'bg-muted'}`}>
                                    <li className="flex items-center w-full">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            role="tab"
                                            aria-current={
                                                stepper.current.id === step.id ? 'step' : undefined
                                            }
                                            aria-posinset={index + 1}
                                            aria-setsize={steps.length}
                                            aria-selected={stepper.current.id === step.id}
                                            className="flex size-10 items-center justify-center rounded-full"
                                            onClick={() => stepper.goTo(step.id)}
                                        >
                                            {index + 1}
                                        </Button>
                                        <span className="text-sm font-medium">{step.label}
                                            <br />
                                            <p className="text-xs text-gray-500">
                                                Description goes here
                                            </p>
                                        </span>
                                    </li>
                                    {index < array.length - 1 && (
                                        <Separator
                                            className={`flex-1 ${index < stepper.current.index ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        />
                                    )}
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </nav>
                </Card>
                <FormProvider {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 p-6 border rounded-lg w-full"
                    >

                        <div className="space-y-4">
                            {stepper.switch({
                                init: () => <ProgramInitComponent />,
                                details: () => <ProgramDetailsComponent />,
                                framework: () => <ProgramDetailsComponent />,
                                invite: () => <ProgramDetailsComponent />,
                                link: () => <ProgramDetailsComponent />,
                                // complete: () => <CompleteComponent />,
                            })}
                            {!stepper.isLast ? (
                                <div className="flex justify-end gap-4">
                                    <Button
                                        onClick={stepper.prev}
                                        disabled={stepper.isFirst}
                                    >
                                        Back
                                    </Button>
                                    <Button type="submit">
                                        {stepper.isLast ? 'Complete' : 'Next'}
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={stepper.reset}>Reset</Button>
                            )}
                        </div>
                    </form>
                </FormProvider>
            </div >
        </>
    )
}

export { ProgramWizard }


