'use client'

import { useCreateProgramMutation } from "@repo/codegen/src/schema"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@repo/ui/alert-dialog"
import { Button } from "@repo/ui/button"
import { Panel, PanelHeader } from "@repo/ui/panel"
import { useToast } from "@repo/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { useForm, SubmitHandler, Control, FormProvider } from 'react-hook-form'
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
import { ProgramWizard } from "./wizard"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/dialog"


const ProgramCreate = () => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const formSchema = z.object({
        name: z.string().min(1, { message: 'Name is required' }),
        startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }),
        endDate: z.date().min(new Date(), { message: 'End date must be after start date' }),
        description: z.string().optional(),
        framework: z.string().optional(),
    })

    type FormData = zInfer<typeof formSchema>


    const { toast } = useToast()
    // const { push } = useRouter()

    const [{ fetching: isSubmitting }, createProgram] =
        useCreateProgramMutation()
    const { data: sessionData, update } = useSession()

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            startDate: new Date(),
            description: '',
            framework: '',
        },
    })

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = form


    const clickHandler = async () => {
        const response = await createProgram({
            input: {
                name: "New Program",
            },
        })

        toast({
            title: 'Program successfully created',
            variant: 'success',
        })
        // push('/programs/programs')
    }

    return (
        <>
            <Panel
                align="center"
                justify="center"
                textAlign="center"
                className="min-h-[400px]"
            >
                <PanelHeader heading="Create a new program" subheading="Start your compliance journey by creating a new program." />
                <Dialog>
                    <DialogTrigger>
                        <Button size="md"
                            iconAnimated
                            loading={isSubmitting}
                            icon={<ArrowUpRight />}>
                            Create Program
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Program</DialogTitle>
                            <DialogDescription>
                                Create a new program to manage your compliance activities.
                            </DialogDescription>
                        </DialogHeader>
                        <ProgramWizard />
                    </DialogContent>
                </Dialog>
            </Panel > {' '}
        </>
    )
}

export { ProgramCreate }
