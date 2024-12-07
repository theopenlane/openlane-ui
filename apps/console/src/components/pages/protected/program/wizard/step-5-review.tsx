
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

export const programReviewSchema = z.object({
    links: z.string(),
})

type ProgramReviewValues = z.infer<typeof programReviewSchema>;

export function ProgramReviewComponent() {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Review Program"
                subheading="Review the final details of the program"
                noBorder
            />
            <div className='max-h-80 overflow-y-auto'>
                <Grid>
                    <GridRow columns={1}>
                        <GridCell >
                            <ReviewComponent />
                        </GridCell>
                    </GridRow>
                </Grid>
            </div>
        </Panel >
    );
}

// ReviewComponent contains the review form
export const ReviewComponent = () => {
    const {
    } = wizardStyles()

    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<ProgramReviewValues>();


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