import { Panel, PanelHeader } from '@repo/ui/panel';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { wizardStyles } from './wizard.styles';

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


    return (
        <>
        </>
    )
}
