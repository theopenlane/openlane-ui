import { ProgramProgramStatus } from '@repo/codegen/src/schema';
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Panel, PanelHeader } from '@repo/ui/panel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { InfoIcon } from 'lucide-react';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';

export const initProgramSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    description: z.string().optional(),
    framework: z.array(z.string()).min(1, { message: 'Framework is required' }),
    status: z
        .nativeEnum(ProgramProgramStatus, {
            errorMap: () => ({ message: 'Invalid status' }),
        })
        .default(ProgramProgramStatus.NOT_STARTED),
})

type InitProgramValues = z.infer<typeof initProgramSchema>;

export function ProgramInitComponent() {
    const {
        formRow,
    } = wizardStyles()

    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Basic Information"
                subheading="Enter the basic information about the program"
                noBorder
            />
            <Grid className='grow'>
                <GridRow columns={2}>
                    <GridCell className={formRow()}>
                        <NameField />
                    </GridCell>
                    <GridCell className={formRow()}>
                        <FrameworkSelect />
                    </GridCell>
                </GridRow>
                <GridRow columns={2}>
                    <GridCell className={formRow()}>
                        <DescriptionField />
                    </GridCell>
                    <GridCell className={formRow()}>
                        <StatusSelect />
                    </GridCell>
                </GridRow>
            </Grid>
        </Panel>
    );
}

const NameField = () => {
    const { register, control } = useFormContext<InitProgramValues>();

    const { inputRow } = wizardStyles();

    return (
        <FormField
            control={control}
            name={register('name').name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Name
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <InfoIcon size={14} className='mx-1' />
                                </TooltipTrigger>
                                <TooltipContent side='right'>
                                    <p>Provide a name to identify the program</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                        <Input className={inputRow()} variant="medium" type="string" {...field} required value={field.value || ''} />
                    </FormControl>
                </FormItem>
            )}
        />
    );
}

const FrameworkSelect = () => {
    const { register, control } = useFormContext<InitProgramValues>();
    const { inputRow } = wizardStyles();

    return (
        <FormField
            control={control}
            name={register('framework').name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Framework</FormLabel>
                    <FormControl>
                        <Select
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger className={inputRow()}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SOC2">SOC2</SelectItem>
                                <SelectItem value="IS027001">IS027001</SelectItem>
                                <SelectItem value="FedRAMP">FedRAMP</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormControl>
                </FormItem>
            )}
        />
    );
}

const DescriptionField = () => {
    const { register, control } = useFormContext<InitProgramValues>();
    const { longTextRow } = wizardStyles();

    return (
        <FormField
            control={control}
            name={register('description').name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Description
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <InfoIcon size={14} className='mx-1' />
                                </TooltipTrigger>
                                <TooltipContent side='right'>
                                    <p>Provide a name to identify the program</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                        <div className="grid w-full gap-2">
                            <Textarea className={longTextRow()} {...field} value={field.value || ''} />
                        </div>
                    </FormControl>
                </FormItem>
            )}
        />
    );
}

const StatusSelect = () => {
    const { register, control } = useFormContext<InitProgramValues>();
    const { inputRow } = wizardStyles();

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
                                    <InfoIcon size={14} className='mx-1' />
                                </TooltipTrigger>
                                <TooltipContent side='right'>
                                    <p>Status of the program, this should generally be left to `Not Started`</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={ProgramProgramStatus.NOT_STARTED}
                        >
                            <SelectTrigger className={inputRow()}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(ProgramProgramStatus)
                                    .map(([key, value], i) => (
                                        <SelectItem key={i} value={value}>
                                            {key[0].toUpperCase() +
                                                key.slice(1).replaceAll("_", " ").toLowerCase()}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                </FormItem>
            )}
        />
    )
}