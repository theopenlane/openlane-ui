
import { useFormContext } from 'react-hook-form'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { format } from 'date-fns'

import { Node, nodeMapper } from '../nodes';
import { Card } from '@repo/ui/cardpanel';
import { CheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip';


type ReviewComponentProps = { users: Node[], groups: Node[], risks: Node[], policies: Node[], procedures: Node[] }

export const ProgramReviewComponent: React.FC<ReviewComponentProps> = ({ users, groups, risks, policies, procedures }) => {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Let's Review!"
                subheading="Confirm you've filled out all the necessary information"
                noBorder
            />
            <div className='max-h-dvh overflow-y-auto'>
                <Grid>
                    <GridRow columns={1}>
                        <GridCell >
                            <ReviewComponent users={users} groups={groups} risks={risks} policies={policies} procedures={procedures} />
                        </GridCell>
                    </GridRow>
                </Grid>
            </div>
        </Panel >
    );
}


// ReviewComponent contains the review form
export const ReviewComponent: React.FC<ReviewComponentProps> = ({ users, groups, risks, policies, procedures }) => {
    const {
    } = wizardStyles()


    const {
        getValues,
    } = useFormContext();


    return (
        <>
            <Panel className='gap-2 px-5 py-5'>
                <PanelHeader heading={getValues().name}
                    subheading={getValues().description}
                    noBorder />
                <Grid className='mt-2'>
                    <GridRow columns={2} className='mx-2'>
                        <GridCell>
                            <Card className='px-5 py-5'>
                                <div className='flex items-center content-center'>
                                    {getValues().framework
                                        ? <CheckIcon className='text-green-500 mr-5' size={20} />
                                        : <XIcon className='text-red-500 mr-5' size={20} />
                                    } Framework Chosen
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InfoIcon size={14} className='mx-1' />
                                            </TooltipTrigger>
                                            <TooltipContent side='right' className='bg-white dark:bg-glaucous-900 max-w-72'>
                                                A framework must be selected to create the program, choose from one of the provided options or choose `Custom` to make your own
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {getValues().framework
                                        ? <span className='text-gray-500 text-sm pl-4'>({getValues().framework})</span>
                                        : ''
                                    }
                                </div>
                            </Card>
                        </GridCell>
                        <GridCell>
                            <Card className='px-5 py-5'>
                                <div className='flex items-center content-center'>
                                    {getValues().name
                                        ? <CheckIcon className='text-green-500 mr-5' size={20} />
                                        : <XIcon className='text-red-500 mr-5' size={20} />
                                    } Name Chosen
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InfoIcon size={14} className='mx-1' />
                                            </TooltipTrigger>
                                            <TooltipContent side='right' className='bg-white dark:bg-glaucous-900 max-w-72'>
                                                A name must be chosen for the program, this name will be used to identify the program in the future
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {getValues().name
                                        ? <span className='text-gray-500 text-sm pl-4'>({getValues().name})</span>
                                        : ''
                                    }
                                </div>
                            </Card>
                        </GridCell>
                    </GridRow>
                    <GridRow columns={2} className='mx-2'>
                        <GridCell>
                            <Card className='px-5 py-5'>
                                <div className='flex items-center content-center'>
                                    {getValues().startDate && getValues().endDate
                                        ? <CheckIcon className='text-green-500 mr-5' size={20} />
                                        : <XIcon className='text-red-500 mr-5' size={20} />
                                    } Audit Period Set
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InfoIcon size={14} className='mx-1' />
                                            </TooltipTrigger>
                                            <TooltipContent side='right' className='bg-white dark:bg-glaucous-900 max-w-72'>
                                                An audit period must be set for the program, this period will be used to track the program's progress
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {getValues().startDate && getValues().endDate
                                        ? <span className='text-gray-500 text-sm pl-4'>({format(new Date(getValues().startDate), 'd MMM yyyy')} - {format(new Date(getValues().endDate), 'd MMM yyyy')})</span>
                                        : ''
                                    }
                                </div>
                            </Card>
                        </GridCell>
                        <GridCell>
                            <Card className='px-5 py-5'>
                                <div className='flex items-center content-center'>
                                    {getValues().auditPartnerName || getValues().auditPartnerEmail
                                        ? <CheckIcon className='text-green-500 mr-5' size={20} />
                                        : <TriangleAlertIcon className='text-saffron-500 mr-5' size={20} />
                                    } Audit Partner Provided
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InfoIcon size={14} className='mx-1' />
                                            </TooltipTrigger>
                                            <TooltipContent side='right' className='bg-white dark:bg-glaucous-900 max-w-72'>
                                                An audit partner is optional, this can be added at a later date
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {getValues().auditPartnerName
                                        ? <span className='text-gray-500 text-sm pl-4'>({getValues().auditPartnerName})</span>
                                        : ''
                                    }
                                </div>
                            </Card>
                        </GridCell>
                    </GridRow>
                    <GridRow columns={2} className='mx-2'>
                        <GridCell>
                            <Card className='px-5 py-5'>
                                <div className='flex items-center content-center'>
                                    {getValues().programAdmins || getValues().programMembers || getValues().groupEditors || getValues().groupViewers
                                        ? <CheckIcon className='text-green-500 mr-5' size={20} />
                                        : <TriangleAlertIcon className='text-saffron-500 mr-5' size={20} />
                                    } Team Members Invited
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InfoIcon size={14} className='mx-1' />
                                            </TooltipTrigger>
                                            <TooltipContent side='right' className='bg-white dark:bg-glaucous-900 max-w-72'>
                                                Team members can be added to the program to help manage the program, however this is optional at this stage
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div>
                                    {getValues().programAdmins?.length > 0
                                        ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Program Admins <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                        : ''
                                    }
                                </div>
                                <div>
                                    {getValues().programMembers?.length > 0
                                        ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Program Members <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                        : ''
                                    }
                                </div>
                                <div>
                                    {getValues().groupEditors?.length > 0
                                        ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Editor Groups  <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                        : ''
                                    }
                                </div>
                                <div>
                                    {getValues().groupViewers?.length > 0
                                        ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Viewer Groups <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                        : ''
                                    }
                                </div>
                            </Card>
                        </GridCell>
                        <GridCell>
                            <Card className='px-5 py-5'>
                                <div className='flex items-center content-center'>
                                    {getValues().risks || getValues().policies || getValues().procedures || getValues().useTemplate
                                        ? <CheckIcon className='text-green-500 mr-5' size={20} />
                                        : <TriangleAlertIcon className='text-saffron-500 mr-5' size={20} />
                                    } Objects Linked or Template Selected
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InfoIcon size={14} className='mx-1' />
                                            </TooltipTrigger>
                                            <TooltipContent side='right' className='bg-white dark:bg-glaucous-900 max-w-72'>
                                                Existing objects can be linked to the program or a template can be selected to use, this is optional at this stage
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                {getValues().useTemplate
                                    ? <div>
                                        <span className='text-gray-500 text-sm pl-10'>Use Provided Templates</span>
                                    </div>
                                    :
                                    <>
                                        <div>
                                            {getValues().risks?.length > 0
                                                ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Risks Included <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                                : ''
                                            }
                                        </div>
                                        <div>
                                            {getValues().policies?.length > 0
                                                ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Policies Included <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                                : ''
                                            }
                                        </div>
                                        <div>
                                            {getValues().procedures?.length > 0
                                                ? <span className='flex items-center content-center text-gray-500 text-sm pl-10 pt-2'>Procedures Included <CheckIcon className='text-green-500 ml-2' size={20} /></span>
                                                : ''
                                            }
                                        </div>
                                    </>
                                }
                            </Card>
                        </GridCell>
                    </GridRow>
                </Grid>
            </Panel >
        </>
    )
}