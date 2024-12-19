
import { Controller, useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { Grid } from '@repo/ui/grid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { CheckIcon, ChevronsUpDownIcon, InfoIcon } from 'lucide-react';
import { Card } from '@repo/ui/cardpanel';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Button } from '@repo/ui/button';
import { cn } from '@repo/ui/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command';
import { Node } from '../nodes';
import { Checkbox } from '@repo/ui/checkbox';

type ObjectAssociationProps = { risks: Node[], policies: Node[], procedures: Node[] }

export const programObjectAssociationSchema = z.object({
    risks: z.array(z.string()).optional(),
    policies: z.array(z.string()).optional(),
    procedures: z.array(z.string()).optional(),
    useTemplate: z.boolean().optional().default(false)
})

type ProgramObjectAssociationValues = zInfer<typeof programObjectAssociationSchema>;

export const ProgramObjectAssociationComponent: React.FC<ObjectAssociationProps> = ({ risks, policies, procedures }) => {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Associate Existing Objects"
                subheading="Pull in existing objects to associate with the program or use the provided templates"
                noBorder
            />
            <div className='max-h-100 overflow-y-auto'>
                <ObjectAssociationComponent risks={risks} policies={policies} procedures={procedures} />
            </div>
        </Panel >
    );
}

// ObjectAssociationComponent contains the object association form
export const ObjectAssociationComponent: React.FC<ObjectAssociationProps> = ({ risks, policies, procedures }) => {
    const {
        register,
        control,
        setValue,
    } = useFormContext<ProgramObjectAssociationValues>();

    return (
        <>
            <Card className='px-5 pb-6 bg-background-secondary'>
                <Grid className='gap-0 mb-8'>
                    <AddObjectDropdown values={risks} fieldName='risks' formLabel='Associate Existing Risks' />
                    <AddObjectDropdown values={policies} fieldName='policies' formLabel='Associate Existing Policies' />
                    <AddObjectDropdown values={procedures} fieldName='procedures' formLabel='Associate Existing Procedures' />
                </Grid>
                <FormItem>
                    <Controller
                        control={control}
                        name={register('useTemplate').name}
                        render={({ field }) => (
                            <div >
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
                                <FormLabel
                                    htmlFor="useTemplate"
                                    className="ml-2 cursor-pointer"
                                >
                                    Use provided templates
                                </FormLabel>
                            </div>
                        )}
                    />
                </FormItem>
            </Card >
        </>
    )
}

const AddObjectDropdown: React.FC<{ values: Node[], fieldName: keyof Omit<ProgramObjectAssociationValues, 'useTemplate'>, formLabel: string }> = ({ values, fieldName, formLabel }) => {
    const {
        register,
        control,
        watch,
    } = useFormContext<ProgramObjectAssociationValues>();

    const placeholder = `Search ${fieldName}(s) ...`

    const useTemplate = watch('useTemplate')

    return (
        <FormField
            control={control}
            name={register(fieldName).name}
            render={({ field }) => (
                <FormItem>
                    {!useTemplate && (
                        <div className='my-3'>
                            <FormLabel htmlFor={field.name} className='flex pb-2'>
                                {formLabel}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <InfoIcon size={14} className='mx-1' />
                                        </TooltipTrigger>
                                        <TooltipContent side='right' className='bg-white dark:bg-glaucous-900'>
                                            <p>Associate existing {fieldName} with the program</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outlineInput"
                                                role="combobox"
                                                className={cn(
                                                    "w-[300px] justify-between flex",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className='flex'>
                                                    <ChevronsUpDownIcon className="opacity-50 h-8 w-8 mr-2 mt-1" />
                                                    {field.value && field.value.length > 0
                                                        ? `${field.value.length} ${fieldName}(s) selected`
                                                        : `Select ${fieldName}(s)`}
                                                </span>
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="bg-glaucous-950 w-[300px]">
                                        <Command>
                                            <CommandInput placeholder={placeholder} />
                                            <CommandList>
                                                <CommandEmpty>No {fieldName} found.</CommandEmpty>
                                                <CommandGroup>
                                                    {values?.map((value) => (
                                                        <CommandItem
                                                            className='flex items-center text-white'
                                                            value={value.node.name}
                                                            key={value.node.name}
                                                            onSelect={() => {
                                                                const newValue = field.value?.includes(value.node.id)
                                                                    ? field.value.filter((id) => id !== value.node.id)
                                                                    : [...(field.value || []), value.node.id]
                                                                field.onChange(newValue)
                                                            }}
                                                        >
                                                            {value.node.name}
                                                            <CheckIcon
                                                                className={cn(
                                                                    "ml-auto",
                                                                    field.value &&
                                                                        field.value.includes(value.node.id)
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
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
    );
}
