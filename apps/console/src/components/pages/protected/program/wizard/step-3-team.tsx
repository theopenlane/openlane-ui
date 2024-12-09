import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { CheckIcon, ChevronsUpDownIcon, InfoIcon } from 'lucide-react';
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel';
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form';
import { Button } from '@repo/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command';
import { cn } from '@repo/ui/lib/utils';
import { Node } from '../wizard';

export const programInviteSchema = z.object({
    programAdmins: z.array(z.string()).optional(),
    programMembers: z.array(z.string()).optional(),
    groupEditors: z.array(z.string()).optional(),
    groupViewers: z.array(z.string()).optional(),
})

type ProgramInviteValues = zInfer<typeof programInviteSchema>;
type ProgramInviteProps = { users: Node[], groups: Node[] }

export const ProgramInviteComponent: React.FC<ProgramInviteProps> = ({ users, groups }) => {
    return (
        <Panel className='border-none p-2 h-[93%]'>
            <PanelHeader
                heading="Add Your Team"
                subheading="Gives read and write access to the program to your team members"
                noBorder
            />
            <div className='overflow-y-auto'>
                <Grid>
                    <GridRow columns={1}>
                        <GridCell >
                            <InviteComponent users={users} groups={groups} />
                        </GridCell>
                    </GridRow>
                </Grid>
            </div>
        </Panel >
    );
}


// InviteComponent contains the team invite form
export const InviteComponent: React.FC<ProgramInviteProps> = ({ users, groups }) => {
    return (
        <>
            <Card className='px-5 py-5'>
                <CardTitle className='pb-2'>Program Members</CardTitle>
                <CardDescription className='pb-6'>
                    Add users in your organization to the program directly. Admins will have read and write access, Members will only have read access
                </CardDescription>
                <Grid>
                    <GridRow columns={2}>
                        <GridCell>
                            <AddMemberDropdown values={users} fieldName='programAdmins' fieldType='user' formLabel='Assign Program Admins' />
                        </GridCell>
                        <GridCell>
                            <AddMemberDropdown values={users} fieldName='programMembers' fieldType='user' formLabel='Assign Program Members' />
                        </GridCell>
                    </GridRow>
                </Grid>
            </Card>
            <Card className='px-5 py-5 my-6'>
                <CardTitle className='pb-2'>Group Permissions</CardTitle>
                <CardDescription className='pb-6'>
                    Assign permissions to the program based on groups. Groups with editor access can read and write, groups with viewer access can only read objects in the program.
                </CardDescription>
                <Grid>
                    <GridRow columns={2}>
                        <GridCell>
                            <AddMemberDropdown values={groups} fieldName='groupEditors' fieldType='group' formLabel='Assign Groups with Edit Access' />
                        </GridCell>
                        <GridCell>
                            <AddMemberDropdown values={groups} fieldName='groupViewers' fieldType='group' formLabel='Assign Groups with Read Only Access' />
                        </GridCell>
                    </GridRow>
                </Grid >
            </Card >
        </>
    )
}


const AddMemberDropdown: React.FC<{ values: Node[], fieldName: keyof ProgramInviteValues, fieldType: 'group' | 'user', formLabel: string }> = ({ values, fieldName, fieldType, formLabel }) => {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProgramInviteValues>();

    const placeholder = `Search ${fieldType}(s) ...`

    return (
        <FormField
            control={control}
            name={register(fieldName).name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel htmlFor={field.name}>
                        {formLabel}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <InfoIcon size={14} className='mx-1' />
                                </TooltipTrigger>
                                <TooltipContent side='right' className='bg-white dark:bg-glaucous-900'>
                                    <p></p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider></FormLabel>
                    <FormControl>
                        <FormItem>
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
                                                    ? `${field.value.length} ${fieldType}(s) selected`
                                                    : `Select ${fieldType}(s)`}
                                            </span>
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="bg-glaucous-950 w-[300px]">
                                    <Command>
                                        <CommandInput placeholder={placeholder} />
                                        <CommandList>
                                            <CommandEmpty>No {fieldType} found.</CommandEmpty>
                                            <CommandGroup>
                                                {values.map((value) => (
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
                        </FormItem>
                    </FormControl>
                </FormItem>
            )}
        />
    );
}
