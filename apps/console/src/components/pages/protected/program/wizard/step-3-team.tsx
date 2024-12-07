import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form';
import { Calendar } from '@repo/ui/calendar'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Button } from '@repo/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { format, addDays } from 'date-fns'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Switch } from '@repo/ui/switch'
import { Card } from '@repo/ui/cardpanel';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';

export const programInviteSchema = z.object({
    framework: z.string().min(1, { message: 'Framework is required' }),
})

type ProgramInviteValues = z.infer<typeof programInviteSchema>;

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

// InviteComponent contains the team invite form
export const InviteComponent = () => {
    const {
    } = wizardStyles()

    const {
        register,
        formState: { errors },
    } = useFormContext<ProgramInviteValues>();


    return (
        <>
        </>
    )
}
