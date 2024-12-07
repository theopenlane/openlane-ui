import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { Check, CheckIcon, ChevronsUpDownIcon, InfoIcon } from 'lucide-react';
import { Card } from '@repo/ui/cardpanel';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Checkbox } from '@repo/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu';
import { Button } from '@repo/ui/button';
import { useGetAllGroupsQuery, useGetAllOrganizationMembersQuery, useGetOrganizationMembersQuery } from '@repo/codegen/src/schema';
import { useSession } from 'next-auth/react';
import { G } from '@react-pdf/renderer';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command';
import { cn } from '@repo/ui/lib/utils';

export const programInviteSchema = z.object({
    programAdmins: z.array(z.string()),
    programMembers: z.array(z.string()),
    programAuditors: z.array(z.string()),
    groupEditors: z.array(z.string()),
    groupViewers: z.array(z.string()),
})

type ProgramInviteValues = zInfer<typeof programInviteSchema>;

export function ProgramInviteComponent() {


    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Add Your Team"
                subheading="Gives read and write access to the program to your team members"
                noBorder
            />
            <div className='max-h-80 overflow-y-auto'>
                <Grid>
                    <GridRow columns={1}>
                        <GridCell >
                            <InviteComponent />
                        </GridCell>
                    </GridRow>
                </Grid>
            </div>
        </Panel >
    );
}

interface Node {
    node: {
        id: string;
        name: string;
    };
}


// InviteComponent contains the team invite form
export const InviteComponent = () => {
    const { data: sessionData, update: updateSession } = useSession()

    const [allGroups] = useGetAllGroupsQuery({ pause: !sessionData })
    const [allUsers] = useGetAllOrganizationMembersQuery({ pause: !sessionData })

    const groupRes = allGroups?.data?.groups.edges || []
    const userRes = allUsers?.data?.orgMemberships.edges || []


    const groups = groupRes
        .map((group) => {
            if (!group || !group.node) return null

            var res: Node = {
                node: {
                    id: group.node.id,
                    name: group.node.name
                }
            }

            return res
        })
        .filter((group): group is Node => group !== null)


    const users = userRes
        .map((user) => {
            if (!user || !user.node) return null

            var res: Node = {
                node: {
                    id: user.node.user.id,
                    name: user.node.user.firstName + ' ' + user.node.user.lastName
                }
            }

            return res
        })
        .filter((group): group is Node => group !== null)

    return (
        <>
            <Card className='px-5 py-5'>
                <Grid>
                    <GridRow columns={2}>
                        <GridCell>
                            <AddMemberDropdown2 values={groups} fieldName='groupEditors' fieldType='group' formLabel='Assign Groups with Edit Access' />
                        </GridCell>
                        <GridCell>
                            <AddMemberDropdown2 values={groups} fieldName='groupViewers' fieldType='group' formLabel='Assign Groups with Read Only Access' />
                        </GridCell>
                    </GridRow>
                    <GridRow columns={2}>
                        <GridCell>
                            <AddMemberDropdown2 values={users} fieldName='programAdmins' fieldType='user' formLabel='Assign Program Admins' />
                        </GridCell>
                        <GridCell>
                            <AddMemberDropdown2 values={users} fieldName='programMembers' fieldType='user' formLabel='Assign Program Members' />
                        </GridCell>
                    </GridRow>
                </Grid>
            </Card >
        </>
    )
}



const AddMemberDropdown: React.FC<{ values: Node[], fieldName: keyof ProgramInviteValues, fieldType: 'group' | 'user', formLabel: string }> = ({ values, fieldName, fieldType, formLabel }) => {
    const {
        inputRow
    } = wizardStyles()

    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProgramInviteValues>();


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
                            <DropdownMenu>
                                <DropdownMenuTrigger onSelect={(e) => {
                                    e.preventDefault()
                                }} asChild>
                                    <Button variant='outlineInput' full>
                                        {field.value && field.value.length > 0
                                            ? `${field.value.length} ${fieldType}(s) selected`
                                            : `Select ${fieldType}(s)`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {Object.entries(values)
                                        .reverse()
                                        .map(([key, value], i) => (
                                            <DropdownMenuCheckboxItem
                                                className={inputRow()}
                                                key={value?.node?.name}
                                                checked={value?.node?.id ? field.value?.includes(value.node.id) ?? false : false}
                                                onCheckedChange={(checked) => {
                                                    const newValue = checked
                                                        ? [...(field.value || []), value?.node?.id]
                                                        : (field.value || []).filter((id) => id !== value?.node?.id)
                                                    field.onChange(newValue)

                                                }}
                                                onSelect={(e) => {
                                                    e.preventDefault()
                                                }}
                                            >
                                                {value?.node?.name}
                                            </DropdownMenuCheckboxItem>
                                        ))
                                    }
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </FormItem>
                    </FormControl>
                </FormItem>
            )}
        />
    );
}


const AddMemberDropdown2: React.FC<{ values: Node[], fieldName: keyof ProgramInviteValues, fieldType: 'group' | 'user', formLabel: string }> = ({ values, fieldName, fieldType, formLabel }) => {
    const {
        inputRow
    } = wizardStyles()

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
                                            <CommandEmpty>No groups found.</CommandEmpty>
                                            <CommandGroup>
                                                {values.map((value) => (
                                                    <CommandItem
                                                        className='flex items-center text-white'
                                                        value={value.node.name}
                                                        key={value.node.name}
                                                        onSelect={(checked) => {
                                                            const newValue = checked
                                                                ? [...(field.value || []), value?.node?.id]
                                                                : (field.value || []).filter((id) => id !== value?.node?.id)
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
