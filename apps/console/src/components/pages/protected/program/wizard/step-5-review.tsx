
import { useFormContext } from 'react-hook-form'
import { Panel, PanelHeader } from '@repo/ui/panel';
import { wizardStyles } from './wizard.styles';
import { Grid, GridRow, GridCell } from '@repo/ui/grid';
import { format } from 'date-fns'
import { DataTable } from '@repo/ui/data-table';

import { ColumnDef } from '@tanstack/react-table'
import { Node } from '../wizard';


type ReviewComponentProps = { users: Node[], groups: Node[] }

export const ProgramReviewComponent: React.FC<ReviewComponentProps> = ({ users, groups }) => {
    return (
        <Panel className='border-none p-2'>
            <PanelHeader
                heading="Review Program"
                noBorder
            />
            <div className='max-h-100 overflow-y-auto'>
                <Grid>
                    <GridRow columns={1}>
                        <GridCell >
                            <ReviewComponent users={users} groups={groups} />
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

const columnsPermissions: (users: Node[], groups: Node[]) => ColumnDef<any>[] = (users, groups) => [
    {
        accessorKey: 'programAdmins',
        header: 'Users with Admin Access',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return value.map(val => {
                const user = users?.find(user => user.node.id === val)
                return user ? user.node.name : 'unknown'
            }).join(', ')
        },
    },
    {
        accessorKey: 'programMembers',
        header: 'Users with Read Access',
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return value.map(val => {
                const user = users?.find(user => user.node.id === val)
                return user ? user.node.name : 'unknown'
            }).join(', ')
        },
    },
    {
        accessorKey: "groupEditors",
        header: "Groups With Edit Access",
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return value.map(val => {
                const group = groups?.find(group => group.node.id === val)
                return group ? group.node.name : 'unknown'
            }).join(', ')
        },
    },
    {
        accessorKey: "groupViewers",
        header: "Groups With Read Access",
        cell: ({ cell }) => {
            const value = cell.getValue() as string[] || []
            return value.map(val => {
                const group = groups?.find(group => group.node.id === val)
                return group ? group.node.name : 'unknown'
            }).join(', ')
        },
    },
]



// ReviewComponent contains the review form
export const ReviewComponent: React.FC<ReviewComponentProps> = ({ users, groups }) => {
    const {
    } = wizardStyles()


    const {
        getValues,
    } = useFormContext();


    return (
        <>
            <Panel className='gap-2 px-6 py-6'>
                <PanelHeader heading={getValues().name}
                    subheading={getValues().description}
                    noBorder />

                Details:
                <DataTable
                    columns={columnsInit}
                    data={[getValues()]}
                />
                <br />
                <DataTable
                    columns={columnsAuditor}
                    data={[getValues()]}
                />
                <br />
                <DataTable
                    columns={columnsPermissions(users, groups)}
                    data={[getValues()]}
                />
            </Panel >
        </>
    )
}