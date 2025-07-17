import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Grid } from '@repo/ui/grid'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { CheckIcon, ChevronsUpDownIcon, InfoIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { useRiskSelect } from '@/lib/graphql-hooks/risks'
import { usePolicySelect } from '@/lib/graphql-hooks/policy'
import { useProcedureSelect } from '@/lib/graphql-hooks/procedures'

export const programObjectAssociationSchema = z.object({
  risks: z.array(z.string()).optional(),
  policies: z.array(z.string()).optional(),
  procedures: z.array(z.string()).optional(),
  useTemplate: z.boolean().optional().default(false),
})

type ProgramObjectAssociationValues = zInfer<typeof programObjectAssociationSchema>

export const ProgramObjectAssociationComponent = () => {
  return (
    <Panel className="border-none p-2">
      <PanelHeader heading="Associate Existing Objects" subheading="Pull in existing objects to associate with the program or use the provided templates" noBorder />
      <div className="max-h-100 overflow-y-auto">
        <ObjectAssociationComponent />
      </div>
    </Panel>
  )
}

// ObjectAssociationComponent contains the object association form
export const ObjectAssociationComponent = () => {
  // const { register, control } = useFormContext<ProgramObjectAssociationValues>()
  const { riskOptions } = useRiskSelect()
  const { policyOptions } = usePolicySelect()
  const { procedureOptions } = useProcedureSelect()

  return (
    <>
      <Card className="px-5 pb-6 bg-background-secondary">
        <Grid className="gap-0 mb-8">
          <AddObjectDropdown options={riskOptions} fieldName="risks" formLabel="Associate Existing Risks" />
          <AddObjectDropdown options={policyOptions} fieldName="policies" formLabel="Associate Existing Policies" />
          <AddObjectDropdown options={procedureOptions} fieldName="procedures" formLabel="Associate Existing Procedures" />
        </Grid>
        {/* <FormItem>
            <Controller
              control={control}
              name={register('useTemplate').name}
              render={({ field }) => (
                <div>
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (checked) {
                        setValue('useTemplate', true)
                      }
                    }}
                  />
                  <FormLabel htmlFor="useTemplate" className="ml-2 cursor-pointer">
                    Use provided templates
                  </FormLabel>
                </div>
              )}
            />
          </FormItem> */}
      </Card>
    </>
  )
}

type Option = { label: string; value: string }

const AddObjectDropdown = ({ options, fieldName, formLabel }: { options: Option[]; fieldName: keyof Omit<ProgramObjectAssociationValues, 'useTemplate'>; formLabel: string }) => {
  const { register, control, watch } = useFormContext<ProgramObjectAssociationValues>()
  const useTemplate = watch('useTemplate')

  return (
    <FormField
      control={control}
      name={register(fieldName).name}
      render={({ field }) => (
        <FormItem>
          {!useTemplate && (
            <div className="my-3">
              <FormLabel htmlFor={field.name} className="flex pb-2">
                {formLabel}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon size={14} className="mx-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-background">
                      <p>Associate existing {fieldName} with the program</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outlineInput" role="combobox" className={cn('w-[300px] justify-between flex', !field.value?.length && 'text-muted-foreground')}>
                      <span className="flex">
                        <ChevronsUpDownIcon className="opacity-50 h-8 w-8 mr-2 mt-1" />
                        {Array.isArray(field.value) && field.value.length > 0 ? `${field.value.length} ${fieldName}(s) selected` : `Select ${fieldName}(s)`}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-background w-[300px]">
                    <Command>
                      <CommandInput placeholder={`Search ${fieldName}(s)...`} />
                      <CommandList>
                        <CommandEmpty>No {fieldName} found.</CommandEmpty>
                        <CommandGroup>
                          {options.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                const newValue = field.value?.includes(option.value) ? field.value.filter((id) => id !== option.value) : [...(field.value || []), option.value]
                                field.onChange(newValue)
                              }}
                            >
                              {option.label}
                              <CheckIcon className={cn('ml-auto', field.value?.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
            </div>
          )}
        </FormItem>
      )}
    />
  )
}
