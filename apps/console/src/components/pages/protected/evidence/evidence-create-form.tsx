import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useState } from 'react'
import { CalendarIcon, InfoIcon } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Textarea } from '@repo/ui/textarea'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { addDays, format } from 'date-fns'
import { wizardStyles } from '@/components/pages/protected/program/wizard/wizard.styles'
import { Button } from '@repo/ui/button'
import { Calendar } from '@repo/ui/calendar'

const EvidenceCreateForm: React.FC = () => {
  const { form } = useFormSchema()
  const today = new Date()
  const oneYearFromToday = addDays(new Date(), 365)
  const [renewalDate, setRenewalDate] = useState<Date>(oneYearFromToday)
  const [creationDate, setCreationDate] = useState<Date>(today)
  const [isCreationDateCalendarOpen, setIsCreationDateCalendarOpen] = useState(false)
  const [isRenewalDateCalendarOpen, setIsRenewalDateCalendarOpen] = useState(false)

  const { calendarIcon, calendarInput, calendarPopover } = wizardStyles()

  const onSubmitHandler = () => {}

  return (
    <Grid rows={2}>
      <GridRow columns={4}>
        <GridCell className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Form (50% Width) */}
            <div className="col-span-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 gap-4">
                  {/* Name Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Name</FormLabel>
                            <TooltipProvider disableHoverableContent>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <InfoIcon size={14} className="mx-1 mt-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>Provide a name for the evidence, generally should include the related Control or Task.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Input variant="medium" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Description Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center">
                            <FormLabel>Description</FormLabel>
                            <TooltipProvider disableHoverableContent>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <InfoIcon size={14} className="mx-1 mt-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>Provide a short description of what is contained in the files or linked URLs.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormControl>
                            <Textarea id="description" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Tags Field */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <MultipleSelector
                              placeholder="Choose existing or add tag..."
                              creatable
                              onChange={(selectedOptions) => field.onChange(selectedOptions.map((option) => option.value))}
                              className="w-full"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Creation Date */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="creationDate"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="mb-2 flex items-center">
                            Creation Date
                            <TooltipProvider disableHoverableContent>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <InfoIcon size={14} className="mx-1 mt-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>The date the evidence was collected, generally the current date but can be adjusted.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Popover open={isCreationDateCalendarOpen} onOpenChange={setIsCreationDateCalendarOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button className="w-full" variant="outlineInput" childFull onClick={() => setIsCreationDateCalendarOpen(!isCreationDateCalendarOpen)}>
                                    <div className={calendarInput()}>
                                      {creationDate ? format(creationDate, 'PPP') : <span>Select a date:</span>}
                                      <CalendarIcon className={calendarIcon()} />
                                    </div>
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className={calendarPopover()} align="start">
                                <Calendar
                                  mode="single"
                                  selected={creationDate}
                                  onSelect={(day) => {
                                    if (day) {
                                      setCreationDate(day)
                                      setIsCreationDateCalendarOpen(false)
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
                  </InputRow>

                  {/* Creation Date */}
                  <InputRow className="w-full">
                    <FormField
                      control={form.control}
                      name="renewalDate"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="mb-2 flex items-center">
                            Renewal Date
                            <TooltipProvider disableHoverableContent>
                              <Tooltip>
                                <TooltipTrigger type="button">
                                  <InfoIcon size={14} className="mx-1 mt-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>The date the evidence should be renewed, this is generally the creation date plus one year.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Popover open={isRenewalDateCalendarOpen} onOpenChange={setIsRenewalDateCalendarOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button className="w-full" variant="outlineInput" childFull onClick={() => setIsRenewalDateCalendarOpen(!isRenewalDateCalendarOpen)}>
                                    <div className={calendarInput()}>
                                      {renewalDate ? format(renewalDate, 'PPP') : <span>Select a date:</span>}
                                      <CalendarIcon className={calendarIcon()} />
                                    </div>
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className={calendarPopover()} align="start">
                                <Calendar
                                  mode="single"
                                  selected={renewalDate}
                                  onSelect={(day) => {
                                    if (day) {
                                      setRenewalDate(day)
                                      setIsRenewalDateCalendarOpen(false)
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
                  </InputRow>
                </form>
              </Form>
            </div>

            {/* Right Column - Accordion (50% Width) */}
            <div className="col-span-1"></div>
          </div>
        </GridCell>
      </GridRow>
    </Grid>
  )
}

export default EvidenceCreateForm
