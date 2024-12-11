import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Calendar } from '@repo/ui/calendar'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Button } from '@repo/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { format, addDays } from 'date-fns'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Switch } from '@repo/ui/switch'
import { Card } from '@repo/ui/cardpanel';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { Input } from '@repo/ui/input';

const today = new Date()
const oneYearFromToday = addDays(new Date(), 365)


export const programDetailSchema = z.object({
    startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }).default(today),
    endDate: z.date().min(new Date(), { message: 'End date must be after start date' }).default(oneYearFromToday),
    auditorReadComments: z.boolean().optional().default(false),
    auditorWriteComments: z.boolean().optional().default(false),
    auditorReady: z.boolean().optional().default(false),
    auditPartnerName: z.string().optional(),
    auditPartnerEmail: z.string().email({ message: 'Invalid email address' }).optional(),
})

type ProgramDetailValues = zInfer<typeof programDetailSchema>;

export function ProgramDetailsComponent() {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Program Details"
                subheading="Configure the details of the program"
                noBorder
            />
            <div className='overflow-y-auto'>
                <Grid>
                    <GridRow columns={2}>
                        <GridCell >
                            <PeriodComponent />
                        </GridCell>
                        <GridCell>
                            <AuditPartner />

                        </GridCell>
                        <GridCell>{null}</GridCell>
                        <GridCell>
                            <AuditorPermissionsComponent />
                        </GridCell>
                    </GridRow>
                </Grid>
            </div>
        </Panel >
    );
}

// AuditorPermissionsComponent contains the permissions for the auditor role
export const AuditorPermissionsComponent = () => {
    const {
        switchRow,
    } = wizardStyles()

    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProgramDetailValues>();


    return (
        <>
            <h2 className='text-lg mb-2'>
                Auditor Permissions
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <InfoIcon size={14} className='mx-1' />
                        </TooltipTrigger>
                        <TooltipContent side='right' className='bg-white dark:bg-glaucous-900'>
                            <p>Permissions for auditor roles, these can be changed at a later date</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </h2>
            <Card className='px-5 py-5'>

                <FormField
                    control={control}
                    name={register('auditorReadComments').name}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Grid className={switchRow()}>
                                    <GridRow columns={2}>
                                        <GridCell>
                                            Read Comments
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <InfoIcon size={14} className='mx-1' />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Gives users with the auditor role permissions to read comments in the program</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </GridCell>
                                        <GridCell>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </GridCell>
                                    </GridRow>
                                </Grid>
                            </FormControl>
                        </FormItem>
                    )
                    }
                />
                < FormField
                    control={control}
                    name={register('auditorWriteComments').name}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Grid className={switchRow()}>
                                    <GridRow columns={2}>
                                        <GridCell>
                                            Write Comments
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <InfoIcon size={14} className='mx-1' />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Gives users with the auditor role permissions to write comments in the program</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </GridCell>
                                        <GridCell>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </GridCell>
                                    </GridRow>
                                </Grid>
                            </FormControl>
                        </FormItem>
                    )}
                />
                < FormField
                    control={control}
                    name={register('auditorReady').name}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Grid className={switchRow()}>
                                    <GridRow columns={2}>
                                        <GridCell>
                                            Auditor Ready
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <InfoIcon size={14} className='mx-1' />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Notifies the auditor the program is ready, allows the auditor to view details</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </GridCell>
                                        <GridCell>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </GridCell>
                                    </GridRow>
                                </Grid>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </Card >
        </>
    )
}

// PeriodComponent contains the start and end date of the program
const PeriodComponent = () => {
    const [startDate, setStartDate] = useState<Date>(today)
    const [endDate, setEndDate] = useState<Date>(oneYearFromToday)

    const [isStateDateCalendarOpen, setIsStartDateCalendarOpen] = useState(false)
    const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false)

    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProgramDetailValues>();

    const {
        formRow,
        inputRow,
        calendarIcon,
        calendarInput,
        calendarPopover,
        dateInput,
    } = wizardStyles()

    return (
        <>
            <div className={formRow()}>
                <FormField
                    control={control}
                    name={register('startDate').name}
                    render={({ field }) => (
                        <FormItem className={dateInput()}>
                            <FormLabel>
                                Start Date
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <InfoIcon size={14} className='mx-1' />
                                        </TooltipTrigger>
                                        <TooltipContent side='right'>
                                            <p>The start date of the period</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                                <Popover
                                    open={isStateDateCalendarOpen}
                                    onOpenChange={setIsStartDateCalendarOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                className={inputRow()}
                                                variant="outlineInput"
                                                childFull
                                                onClick={() => setIsStartDateCalendarOpen(!isStateDateCalendarOpen)}
                                            >
                                                <div className={calendarInput()}>
                                                    {startDate ? (
                                                        format(startDate, 'PPP')
                                                    ) : (
                                                        <span>Select a date:</span>
                                                    )}
                                                    <CalendarIcon className={calendarIcon()} />
                                                </div>
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className={calendarPopover()}
                                        align="start"
                                    > <Select
                                        onValueChange={(value) => {
                                            setStartDate(addDays(new Date(), parseInt(value)));
                                            setIsStartDateCalendarOpen(false);
                                        }}
                                    >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="0">Today</SelectItem>
                                                <SelectItem value="1">Tomorrow</SelectItem>
                                                <SelectItem value="7">In 1 week</SelectItem>
                                                <SelectItem value="30">In 1 month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={(day) => {
                                                if (day) {
                                                    setStartDate(day);
                                                    setIsStartDateCalendarOpen(false);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <div className={formRow()}>
                <FormField
                    control={control}
                    name={register('endDate').name}
                    render={({ field }) => (
                        <FormItem className={dateInput()}>
                            <FormLabel>
                                End Date
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <InfoIcon size={14} className='mx-1' />
                                        </TooltipTrigger>
                                        <TooltipContent side='right'>
                                            <p>The end date of the period</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                                <Popover
                                    open={isEndDateCalendarOpen}
                                    onOpenChange={setIsEndDateCalendarOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                className={inputRow()}
                                                variant="outlineInput"
                                                childFull
                                                onClick={() => setIsEndDateCalendarOpen(!isEndDateCalendarOpen)}
                                            >
                                                <div className={calendarInput()}>
                                                    {endDate ? (
                                                        format(endDate, 'PPP')
                                                    ) : (
                                                        <span>Select a date</span>
                                                    )}
                                                    <CalendarIcon className={calendarIcon()} />
                                                </div>
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className={calendarPopover()}
                                        align="start"
                                    >
                                        <Select
                                            onValueChange={(value) => {
                                                setEndDate(addDays(startDate, parseInt(value)));
                                                setIsEndDateCalendarOpen(false);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="90">90 days</SelectItem>
                                                <SelectItem value="180">180 days</SelectItem>
                                                <SelectItem value="365">1 year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={(day) => {
                                                if (day) {
                                                    setEndDate(day);
                                                    setIsEndDateCalendarOpen(false);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </>
    )
}

const AuditPartner = () => {
    const { register, control, formState: { errors }, } = useFormContext<ProgramDetailValues>();
    const { inputRow, formRow } = wizardStyles();

    return (
        <>
            <div className={formRow()}>
                <FormField
                    control={control}
                    name={register('auditPartnerName').name}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Audit Partner
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <InfoIcon size={14} className='mx-1' />
                                        </TooltipTrigger>
                                        <TooltipContent side='right'>
                                            <p>Auditor partner that is assigned to the program</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                                <Input className={inputRow()} variant="medium" type="string" {...field} value={field.value || ''} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <div className={formRow()}>
                <FormField
                    control={control}
                    name={register('auditPartnerEmail').name}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Audit Partner Contact Email
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <InfoIcon size={14} className='mx-1' />
                                        </TooltipTrigger>
                                        <TooltipContent side='right'>
                                            <p>Auditor partner that is assigned to the program</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                                <Input className={inputRow()} variant="medium" type="email" {...field} value={field.value || ''} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </>
    );
}