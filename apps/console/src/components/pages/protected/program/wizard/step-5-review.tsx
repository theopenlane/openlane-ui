
import { useFormContext } from 'react-hook-form'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { format } from 'date-fns'
import { DataTable } from '@repo/ui/data-table';

import { ColumnDef } from '@tanstack/react-table'
import { Node } from '../wizard';


type ReviewComponentProps = { users: Node[], groups: Node[], risks: Node[], policies: Node[], procedures: Node[] }

export const ProgramReviewComponent: React.FC<ReviewComponentProps> = ({ users, groups, risks, policies, procedures }) => {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Review Program"
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


const columnsInit: ColumnDef<any>[] = [
    {
        accessorKey: 'framework',
        header: 'Framework',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ cell }) => {
            const value = cell.getValue() as string | null
            return value ? value.replaceAll("_", " ").toLowerCase() : value
        },
    },
    {
        accessorKey: 'startDate',
        header: 'Start Date',
        cell: ({ cell }) => {
            const value = cell.getValue() as string | null
            return value ? format(new Date(value), 'd MMM yyyy') : 'Invalid'
        },
    },
    {
        accessorKey: 'endDate',
        header: 'End Date',
        cell: ({ cell }) => {
            const value = cell.getValue() as string | null
            return value ? format(new Date(value), 'd MMM yyyy') : 'Invalid'
        },
    },
]

const columnsAuditor: ColumnDef<any>[] = [
    {
        accessorKey: 'auditPartnerName',
        header: 'Audit Partner',
    },
    {
        accessorKey: 'auditPartnerEmail',
        header: 'Audit Partner Email',
    },
    {
        accessorKey: 'auditorReadComments',
        header: 'Auditor Read Comments',
    },
    {
        accessorKey: 'auditorWriteComments',
        header: 'Auditor Write Comments',
    },
    {
        accessorKey: 'auditorReady',
        header: 'Auditor Ready',
    }
]

function nodeMapper(value: string[], nodeInput: Node[]) {
    return value.map(val => {
        const node = nodeInput?.find(node => node.node.id === val)
        return node ? node.node.name : 'unknown'
    }).join(', ')
}


const columnsPermissions: (users: Node[], groups: Node[]) => ColumnDef<any>[] = (users, groups) => [
    {
        accessorKey: 'programAdmins',
        header: 'Users with Admin Access',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, users)
        },
    },
    {
        accessorKey: 'programMembers',
        header: 'Users with Read Access',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, users)
        },
    },
    {
        accessorKey: "groupEditors",
        header: "Groups With Edit Access",
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, groups)
        },
    },
    {
        accessorKey: "groupViewers",
        header: "Groups With Read Access",
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, groups)
        },
    },
]

const columnsObjects: (risks: Node[], policies: Node[], procedures: Node[]) => ColumnDef<any>[] = (risks, policies, procedures) => [
    {
        accessorKey: 'risks',
        header: 'Risks',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, risks)
        },
    },
    {
        accessorKey: 'policies',
        header: 'Policies',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, policies)
        },
    },
    {
        accessorKey: 'procedures',
        header: 'Procedures',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return nodeMapper(value, procedures)
        },
    }
]



// ReviewComponent contains the review form
export const ReviewComponent: React.FC<ReviewComponentProps> = ({ users, groups, risks, policies, procedures }) => {
    const {
    } = wizardStyles()


    const {
        getValues,
    } = useFormContext();


    return (
        <>
            <Panel className='gap-2 px-2 py-2'>
                <PanelHeader heading={getValues().name}
                    subheading={getValues().description}
                    noBorder />
                <DataTable
                    columns={columnsInit}
                    data={[getValues()]}
                />
                <DataTable
                    columns={columnsAuditor}
                    data={[getValues()]}
                />
                <DataTable
                    columns={columnsPermissions(users, groups)}
                    data={[getValues()]}
                />
                <DataTable
                    columns={columnsObjects(risks, policies, procedures)}
                    data={[getValues()]}
                />
            </Panel >
        </>
    )
}