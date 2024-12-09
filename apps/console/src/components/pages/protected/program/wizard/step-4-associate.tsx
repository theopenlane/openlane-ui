
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Card } from '@repo/ui/cardpanel';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Input } from '@repo/ui/input';

export const programObjectAssociationSchema = z.object({
    links: z.string().optional(),
})

type ProgramObjectAssociationValues = z.infer<typeof programObjectAssociationSchema>;

export function ProgramObjectAssociationComponent() {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Associate Existing Objects"
                subheading="Pull in existing objects to associate with the program"
                noBorder
            />
            <div className='max-h-80 overflow-y-auto'>
                <Grid>
                    <GridRow columns={1}>
                        <GridCell >
                            <ObjectAssociationComponent />
                        </GridCell>
                    </GridRow>
                </Grid>
            </div>
        </Panel >
    );
}

// InviteComponent contains the team invite form
export const ObjectAssociationComponent = () => {
    const {
    } = wizardStyles()

    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProgramObjectAssociationValues>();


    return (
        <>
            <Card className='px-5 py-5'>
                <FormField
                    control={control}
                    name={register('links').name}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel htmlFor={field.name}>Links
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <InfoIcon size={14} className='mx-1' />
                                        </TooltipTrigger>
                                        <TooltipContent side='right' className='bg-white dark:bg-glaucous-900'>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider></FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                        </FormItem>
                    )
                    }
                />
            </Card >
        </>
    )
}