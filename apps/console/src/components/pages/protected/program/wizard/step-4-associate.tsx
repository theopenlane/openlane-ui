
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';

export const programObjectAssociationSchema = z.object({
    framework: z.string().min(1, { message: 'Framework is required' }),
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
        formState: { errors },
    } = useFormContext<ProgramObjectAssociationValues>();


    return (
        <>
        </>
    )
}
