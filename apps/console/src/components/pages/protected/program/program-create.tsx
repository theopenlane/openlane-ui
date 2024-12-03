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
                <PanelHeader heading="Create a new program" noBorder />
                <p className="max-w-[340px]">
                    Start your compliance journey by creating a new program.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger>
                        <Button size="md"
                            iconAnimated
                            loading={isSubmitting}
                            icon={<ArrowUpRight />}>
                            Create Program
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create a New Program</AlertDialogTitle>
                            <AlertDialogDescription>
                                Create a new program to manage your compliance activities.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div>
                            <FormProvider {...form}>
                                <FormField
                                    control={control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input variant="medium" type="string" {...field} />
                                            </FormControl>
                                            {errors.name && (
                                                <FormMessage>{errors.name.message}</FormMessage>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input variant="medium" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Popover
                                                    open={isCalendarOpen}
                                                    onOpenChange={setIsCalendarOpen}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outlineInput"
                                                                childFull
                                                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                                            >
                                                                <div >
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Select a date:</span>
                                                                    )}
                                                                    <CalendarIcon />
                                                                </div>
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent

                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => {
                                                                field.onChange(date)
                                                                setIsCalendarOpen(false)
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                            {errors.startDate && (
                                                <FormMessage>{errors.startDate.message}</FormMessage>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Popover
                                                    open={isCalendarOpen}
                                                    onOpenChange={setIsCalendarOpen}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outlineInput"
                                                                childFull
                                                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                                            >
                                                                <div >
                                                                    {field.value ? (
                                                                        format(field.value, 'PPP')
                                                                    ) : (
                                                                        <span>Select a date:</span>
                                                                    )}
                                                                    <CalendarIcon />
                                                                </div>
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent

                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => {
                                                                field.onChange(date)
                                                                setIsCalendarOpen(false)
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                            {errors.startDate && (
                                                <FormMessage>{errors.startDate.message}</FormMessage>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </FormProvider>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="md">
                                        Framework
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-10">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            SOC2
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            IS0 27001
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                                <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Button variant="aquamarine" onClick={clickHandler}>
                                    Create program
                                </Button>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Panel > {' '}
        </>
    )
}

export { ProgramCreate }
