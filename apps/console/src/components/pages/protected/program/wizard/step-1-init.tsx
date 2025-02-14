import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { CalendarIcon, InfoIcon } from 'lucide-react'
import { wizardStyles } from './wizard.styles'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { supportedFrameworks } from '../frameworks'
import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { Button } from '@repo/ui/button'
import { Calendar } from '@repo/ui/calendar'

const today = new Date()
const oneYearFromToday = addDays(new Date(), 365)

export const initProgramSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  framework: z.string(),
  status: z
    .nativeEnum(ProgramProgramStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(ProgramProgramStatus.NOT_STARTED),
  startDate: z.date().min(new Date(), { message: 'Start date must be in the future' }).default(today),
  endDate: z.date().min(new Date(), { message: 'End date must be after start date' }).default(oneYearFromToday),
})

type InitProgramValues = zInfer<typeof initProgramSchema>

export function ProgramInitComponent() {
  const { formRow } = wizardStyles()

  return (
    <Panel className="border-none p-2">
      <PanelHeader heading="" subheading="Enter the basic information about the program" noBorder />
      <Grid className="grow">
        <GridRow columns={4}>
          <GridCell className={formRow()}>
            <ProgramTypeSelect />
          </GridCell>
          <GridCell className={formRow()}>
            <FrameworkSelect />
          </GridCell>
          <GridCell className={formRow()}>
            <NameField />
          </GridCell>
        </GridRow>
        <GridRow columns={2}>
          <GridCell className={formRow()}>
            <DescriptionField />
          </GridCell>
          <GridCell className={formRow()}>
            <StatusSelect />
          </GridCell>
          <GridCell>
            <PeriodComponent />
          </GridCell>
        </GridRow>
      </Grid>
    </Panel>
  )
}

const ProgramTypeSelect = () => {
  const programTypes = [
    { value: 'framework', label: 'Framework' },
    { value: 'gap_analysis', label: 'Gap Analysis' },
    { value: 'risk_assessment', label: 'Risk Assessment' },
    { value: 'other', label: 'Other - Please Specify' },
  ]

  const [customProgram, setCustomProgram] = useState('')
  const {
    register,
    control,
    formState: { errors },
    setValue,
    trigger,
    watch,
  } = useFormContext()

  const selectedProgramType = watch('programType') || 'framework' // Default to 'Framework'
  const { inputRow } = wizardStyles()

  return (
    <FormField
      control={control}
      name="programType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Program Type<span className="text-red-500"> *</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon size={14} className="mx-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Select the type of program you want to create (required).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value)
                setValue('programType', value)
                trigger('programType')
              }}
              required
            >
              <SelectTrigger className={inputRow()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {programTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {errors.programType && <FormMessage>{errors?.programType?.message}</FormMessage>}

          {selectedProgramType === 'other' && (
            <div>
              <FormLabel className="block my-2">Specify Other Program Type</FormLabel>
              <Input
                {...register('customProgram')}
                value={customProgram}
                onChange={(e) => {
                  setCustomProgram(e.target.value)
                  setValue('customProgram', e.target.value)
                  trigger('customProgram')
                }}
                placeholder="Enter program type"
                className={inputRow()}
              />
              {errors.customProgram && <FormMessage>{errors.customProgram.message}</FormMessage>}
            </div>
          )}
        </FormItem>
      )}
    />
  )
}

export default ProgramTypeSelect

const NameField = () => {
  const {
    register,
    control,
    formState: { errors },
    getValues,
  } = useFormContext<InitProgramValues>()
  const { inputRow } = wizardStyles()

  return (
    <FormField
      control={control}
      name={register('name').name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Name<span className="text-red-500"> *</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon size={14} className="mx-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Provide a name to identify the program (required)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <Input className={inputRow()} variant="medium" type="string" {...field} required value={field.value || getValues().framework} />
          </FormControl>
          {errors.name && <FormMessage>{errors.name.message}</FormMessage>}
        </FormItem>
      )}
    />
  )
}

const FrameworkSelect = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext<InitProgramValues>()
  const { inputRow } = wizardStyles()

  return (
    <FormField
      control={control}
      name={register('framework').name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Framework<span className="text-red-500"> *</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon size={14} className="mx-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>The audit framework to use for the program (required)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value)
                setValue('name', value)
                trigger('name')
              }}
              required
            >
              <SelectTrigger className={inputRow()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedFrameworks.map((framework) => (
                  <SelectItem key={framework.shortname} value={framework.shortname}>
                    {framework.shortname} {framework.version ? `  (${framework.version})` : ''}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon size={14} className="mx-1" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {framework.name} - {framework.description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {errors.framework && <FormMessage>{errors.framework.message}</FormMessage>}
        </FormItem>
      )}
    />
  )
}

const DescriptionField = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InitProgramValues>()
  const { longTextRow } = wizardStyles()

  return (
    <FormField
      control={control}
      name={register('description').name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Description
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon size={14} className="mx-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Provide a description of the program</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <div className="grid w-full gap-2">
              <Textarea className={longTextRow()} {...field} value={field.value || ''} />
            </div>
          </FormControl>
          {errors.description && <FormMessage>{errors.description.message}</FormMessage>}
        </FormItem>
      )}
    />
  )
}

const StatusSelect = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InitProgramValues>()
  const { inputRow } = wizardStyles()

  return (
    <FormField
      control={control}
      name={register('status').name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Status
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon size={14} className="mx-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Status of the program, this should generally be left to `Not Started`</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={ProgramProgramStatus.NOT_STARTED}>
              <SelectTrigger className={inputRow()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ProgramProgramStatus).map(([key, value], i) => (
                  <SelectItem key={i} value={value}>
                    {key[0].toUpperCase() + key.slice(1).replaceAll('_', ' ').toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {errors.status && <FormMessage>{errors.status.message}</FormMessage>}
        </FormItem>
      )}
    />
  )
}

const PeriodComponent = () => {
  const [startDate, setStartDate] = useState<Date>(today)
  const [endDate, setEndDate] = useState<Date>(oneYearFromToday)

  const [isStateDateCalendarOpen, setIsStartDateCalendarOpen] = useState(false)
  const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false)

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InitProgramValues>()

  const { formRow, inputRow, calendarIcon, calendarInput, calendarPopover, dateInput } = wizardStyles()

  return (
    <>
      <div className={formRow()}>
        <FormField
          control={control}
          name={register('startDate').name}
          render={({ field }) => (
            <FormItem className={dateInput()}>
              <FormLabel className="mb-2">
                Start Date
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon size={14} className="mx-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>The start date of the period</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Popover open={isStateDateCalendarOpen} onOpenChange={setIsStartDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button className={inputRow()} variant="outlineInput" childFull onClick={() => setIsStartDateCalendarOpen(!isStateDateCalendarOpen)}>
                        <div className={calendarInput()}>
                          {startDate ? format(startDate, 'PPP') : <span>Select a date:</span>}
                          <CalendarIcon className={calendarIcon()} />
                        </div>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className={calendarPopover()} align="start">
                    {' '}
                    <Select
                      onValueChange={(value) => {
                        setStartDate(addDays(new Date(), parseInt(value)))
                        setIsStartDateCalendarOpen(false)
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
                          setStartDate(day)
                          setIsStartDateCalendarOpen(false)
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
              <FormLabel className="mb-2">
                End Date
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon size={14} className="mx-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>The end date of the period</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Popover open={isEndDateCalendarOpen} onOpenChange={setIsEndDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button className={inputRow()} variant="outlineInput" childFull onClick={() => setIsEndDateCalendarOpen(!isEndDateCalendarOpen)}>
                        <div className={calendarInput()}>
                          {endDate ? format(endDate, 'PPP') : <span>Select a date</span>}
                          <CalendarIcon className={calendarIcon()} />
                        </div>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className={calendarPopover()} align="start">
                    <Select
                      onValueChange={(value) => {
                        setEndDate(addDays(startDate, parseInt(value)))
                        setIsEndDateCalendarOpen(false)
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
                          setEndDate(day)
                          setIsEndDateCalendarOpen(false)
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
