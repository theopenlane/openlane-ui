import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import React, { useState } from 'react'
import { CalendarIcon, InfoIcon } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import useFormSchema, { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Textarea } from '@repo/ui/textarea'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { addDays, format } from 'date-fns'
import { wizardStyles } from '@/components/pages/protected/program/wizard/wizard.styles'
import { Button } from '@repo/ui/button'
import { Calendar } from '@repo/ui/calendar'
import { CreateEvidenceInput, useCreateEvidenceMutation } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import EvidenceUploadForm from '@/components/pages/protected/evidence/upload/evidence-upload-form'
import EvidenceObjectAssociation from '@/components/pages/protected/evidence/object-association/evidence-object-association'
import { useToast } from '@repo/ui/use-toast'

const EvidenceCreateForm: React.FC = () => {
  const { form } = useFormSchema()
  const { toast } = useToast()
  const today = new Date()
  const oneYearFromToday = addDays(new Date(), 365)
  const [renewalDate, setRenewalDate] = useState<Date>(oneYearFromToday)
  const [creationDate, setCreationDate] = useState<Date>(today)
  const [isCreationDateCalendarOpen, setIsCreationDateCalendarOpen] = useState(false)
  const [isRenewalDateCalendarOpen, setIsRenewalDateCalendarOpen] = useState(false)
  const { calendarIcon, calendarInput, calendarPopover } = wizardStyles()
  const { data: sessionData } = useSession()
  const [result, createEvidence] = useCreateEvidenceMutation()
  const { fetching: isSubmitting } = result

  const onSubmitHandler = async (data: CreateEvidenceFormData) => {
    const controlObjectives = data?.controlObjectiveIDs?.reduce(
      (acc, item) => {
        acc[item.inputName] = item.objectIds
        return acc
      },
      {} as Record<string, string[]>,
    )

    const evidenceFiles = data.evidenceFiles?.filter((item) => item.type === 'file')
    const evidenceDirectLink = data.evidenceFiles?.filter((item) => item.type === 'link')[0]?.url

    const formData = {
      input: {
        name: data.name,
        description: data.description,
        tags: data.tags,
        creationDate: data.creationDate,
        renewalDate: data.renewalDate,
        ownerID: sessionData?.user.userId,
        ...(evidenceDirectLink ? { url: evidenceDirectLink } : {}),
        ...controlObjectives,
      } as CreateEvidenceInput,
      evidenceFiles: evidenceFiles?.map((item) => item.file) || [],
    }

    const response = await createEvidence(formData)

    if (response.error) {
      toast({
        title: 'Error',
        description: 'There was an error creating the evidence. Please try again.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    toast({
      title: 'Evidence Created',
      description: `Evidence has been successfully created`,
      variant: 'success',
      duration: 5000,
    })
    form.reset()
  }

  const handleEvidenceObjectIdsChange = (evidenceObjectIds: TEvidenceObjectIds[]) => {
    form.setValue('controlObjectiveIDs', evidenceObjectIds)
  }

  const handleUploadedFiles = (evidenceFiles: TUploadedFilesProps[]) => {
    form.setValue('evidenceFiles', evidenceFiles)
  }

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
                            <FormLabel>Evidence name</FormLabel>
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
                          {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
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
                          {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
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
                          {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
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
                                      form.setValue('creationDate', day)
                                      setCreationDate(day)
                                      setIsCreationDateCalendarOpen(false)
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          {form.formState.errors.creationDate && <p className="text-red-500 text-sm">{form.formState.errors.creationDate.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>

                  {/* Renewal Date */}
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
                                <Button className="w-full" variant="outlineInput" childFull onClick={() => setIsRenewalDateCalendarOpen(!isRenewalDateCalendarOpen)}>
                                  <div className={calendarInput()}>
                                    {renewalDate ? format(renewalDate, 'PPP') : <span>Select a date:</span>}
                                    <CalendarIcon className={calendarIcon()} />
                                  </div>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className={calendarPopover()} align="start">
                                <Calendar
                                  mode="single"
                                  selected={renewalDate}
                                  onSelect={(day) => {
                                    if (day) {
                                      form.setValue('renewalDate', day)
                                      setRenewalDate(day)
                                      setIsRenewalDateCalendarOpen(false)
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          {form.formState.errors.renewalDate && <p className="text-red-500 text-sm">{form.formState.errors.renewalDate.message}</p>}
                        </FormItem>
                      )}
                    />
                  </InputRow>
                  <p>Provide supporting files(s)</p>
                  <EvidenceUploadForm evidenceFiles={handleUploadedFiles} />
                </form>
              </Form>
            </div>

            {/* Right Column - Accordion (50% Width) */}
            <div className="col-span-1">
              <EvidenceObjectAssociation onEvidenceObjectIdsChange={handleEvidenceObjectIdsChange} />
            </div>
          </div>
        </GridCell>
      </GridRow>
      <GridRow columns={4}>
        <GridCell className="col-span-2">
          <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for review'}
          </Button>
        </GridCell>
      </GridRow>
    </Grid>
  )
}

export default EvidenceCreateForm
