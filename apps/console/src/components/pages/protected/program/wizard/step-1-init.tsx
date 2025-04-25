import { ProgramProgramStatus, ProgramProgramType, Standard } from '@repo/codegen/src/schema'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useFormContext, useWatch } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { InfoIcon } from 'lucide-react'
import { wizardStyles } from './wizard.styles'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import React, { useState } from 'react'
import { addDays, getYear } from 'date-fns'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useGetStandards } from '@/lib/graphql-hooks/standards'

const today = new Date()
const oneYearFromToday = addDays(new Date(), 365)

const currentYear = getYear(new Date())

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
  programType: z.string().min(1, { message: 'Program type is required' }),
})

type InitProgramValues = zInfer<typeof initProgramSchema>

export function ProgramInitComponent() {
  const { formRow } = wizardStyles()

  const { control, watch } = useFormContext()

  const programType = useWatch({ control, name: 'programType' })

  return (
    <Panel className="border-none p-2">
      <PanelHeader heading="" subheading="Enter the basic information about the program" noBorder />
      <Grid className="grow">
        <GridRow columns={4}>
          <GridCell className={formRow()}>
            <ProgramTypeSelect />
          </GridCell>
          {programType === 'framework' && (
            <GridCell className={formRow()}>
              <FrameworkSelect />
            </GridCell>
          )}
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
    { value: ProgramProgramType.FRAMEWORK, label: 'Framework' },
    { value: ProgramProgramType.GAP_ANALYSIS, label: 'Gap Analysis' },
    { value: ProgramProgramType.RISK_ASSESSMENT, label: 'Risk Assessment' },
    { value: ProgramProgramType.OTHER, label: 'Other - Please Specify' },
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

  const selectedProgramType = watch('programType') || ProgramProgramType.FRAMEWORK
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
                if (value === ProgramProgramType.RISK_ASSESSMENT || value === ProgramProgramType.GAP_ANALYSIS) {
                  const selectedLabel = programTypes.find((type) => type.value === value)?.label
                  setValue('name', `${selectedLabel} - ${currentYear}`)
                }
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
          {errors.programType && <FormMessage>{String(errors.programType.message)}</FormMessage>}

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
                  setValue('name', `${e.target.value} - ${currentYear}`)
                }}
                placeholder="Enter program type"
                className={inputRow()}
              />
              {errors.customProgram && <FormMessage>{String(errors.customProgram.message)}</FormMessage>}
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
    control,
    formState: { errors },
    trigger,
  } = useFormContext<InitProgramValues>()
  const { inputRow } = wizardStyles()

  return (
    <FormField
      control={control}
      name="name"
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
            <Input onInput={() => trigger('name')} className={inputRow()} variant="medium" type="text" {...field} />
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
  const { data, isLoading, isError } = useGetStandards({})
  const currentYear = new Date().getFullYear()

  const frameworks = data?.standards?.edges?.map((edge) => edge?.node as Standard) || []

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
                setValue('name', `${value} - ${currentYear}`)
                trigger('name')
              }}
              required
            >
              <SelectTrigger className={inputRow()}>
                <SelectValue placeholder="Select a framework" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((framework) => (
                  <SelectItem key={framework.id} value={framework?.shortName ?? ''}>
                    {framework.shortName} {framework.version ? `(${framework.version})` : ''}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon size={14} className="mx-1" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {framework.shortName} - {framework.description}
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
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<InitProgramValues>()

  const { formRow, dateInput } = wizardStyles()

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
                <CalendarPopover
                  field={field}
                  defaultToday
                  customSelect={[
                    { value: 0, label: 'Today' },
                    { value: 1, label: 'Tomorrow' },
                    { value: 7, label: 'In 1 week' },
                    { value: 30, label: 'In 1 month' },
                  ]}
                />
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
                <CalendarPopover
                  field={field}
                  defaultToday
                  customSelect={[
                    { value: 90, label: '90 days' },
                    { value: 180, label: '180 days' },
                    { value: 365, label: '1 year' },
                  ]}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
