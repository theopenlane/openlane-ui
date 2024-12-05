import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Calendar } from '@repo/ui/calendar'

import { useForm, SubmitHandler, Control, FormProvider, Form, useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Button } from '@repo/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { format } from 'date-fns'

export const programDetailSchema = z.object({
    startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }),
    endDate: z.date().min(new Date(), { message: 'End date must be after start date' }),
    description: z.string().optional(),
    framework: z.string().optional(),
})

type ProgramDetailValues = z.infer<typeof programDetailSchema>;

export function ProgramDetailsComponent() {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)


    const {
        register,
        formState: { errors },
    } = useFormContext<ProgramDetailValues>();

    return (
        <div>
            <FormField
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
        </div >
    );
}