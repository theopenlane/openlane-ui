'use client'

import React, { useState } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon, PencilIcon } from 'lucide-react'
import { ControlFieldsFragment, Organization, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { Tooltip } from '@nextui-org/react'
import { TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { Accordion } from '@radix-ui/react-accordion'
import AccordionSection from './accordion-selection'

const columns: ColumnDef<ControlFieldsFragment>[] = [
  {
    header: 'Name',
    accessorKey: 'refCode',
    cell: ({ row }) => <div>{row.getValue('refCode')}</div>,
  },
  {
    header: 'Description',
    accessorKey: 'description',
    cell: ({ row }) => {
      const tags = row.original.tags
      return (
        <div>
          <p>{row.getValue('description')}</p>
          <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
            {tags?.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <span className="flex items-center gap-2">{row.getValue('status')}</span>,
  },
  {
    header: 'Owners',
    accessorKey: 'owner',
    cell: ({ row }) => {
      const owner = row.getValue<ControlFieldsFragment['owner']>('owner')
      const users = owner?.users ?? []

      return (
        <div className="flex items-center gap-2">
          {users.map((user, index) => (
            <Avatar entity={user as Organization} variant="small" />
          ))}
        </div>
      )
    },
  },
]

const ControlsTable: React.FC = () => {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<ControlFieldsFragment | null>(null)

  const { data: controlsData, isLoading, isError } = useGetAllControls({})
  // const { data: controlsData, isLoading, isError } = useGetAllControls({ ownerIDNotNil: true }) this is the right query

  if (isLoading) return <div>Loading Controls...</div>
  if (isError) return <div>Failed to load Controls</div>

  const edges = controlsData?.controls?.edges || []
  const tableData = edges.map((edge) => edge?.node).filter((node): node is ControlFieldsFragment => node !== null && node !== undefined)
  const handleRowClick = (row: ControlFieldsFragment) => {
    setCurrentRow(row)
    setSheetOpen(true)
  }

  const exportToCSV = (data: ControlFieldsFragment[], fileName: string) => {
    const csvRows = []
    csvRows.push(['Name', 'Ref', 'Description', 'Tags', 'Status', 'Owners'].join(','))

    data.forEach((row) => {
      const owners = row.owner?.users?.map((o) => `${o?.firstName ?? ''} ${o?.lastName ?? ''}`.trim()).join(' | ') || ''
      csvRows.push([row.refCode, row.refCode, row.description || '', row.tags?.join('; ') || '', row.status || '', owners].join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Controls Table</h1>
        <Button onClick={() => exportToCSV(tableData, 'control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
      <DataTable columns={columns} data={tableData} onRowClick={handleRowClick} />
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetTitle></SheetTitle>
          <SheetDescription />
          {/* <SheetHeader>
          </SheetHeader> */}
          {currentRow && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-normal">{currentRow.refCode}</h1>
                  <Button icon={<PencilIcon />} iconPosition="left">
                    Edit
                  </Button>
                </div>
              </div>

              {currentRow.updatedBy && <UserDetails label="Updated" userId={currentRow.updatedBy} date={currentRow.updatedAt} />}
              {currentRow.createdBy && <UserDetails label="Created" userId={currentRow.createdBy} date={currentRow.createdAt} />}
            </div>
          )}

          <Accordion type="multiple" defaultValue={['description']} className="w-full space-y-2 mt-2">
            <AccordionSection label="Description" content={currentRow?.description} value="description" />

            <AccordionSection
              label="Implementation Guidance"
              value="implementationGuidance"
              content={currentRow?.implementationGuidance?.flatMap((item) => item.guidance.map((g: string) => `${item.referenceId}: ${g}`))}
            />

            <AccordionSection label="Example Evidence" value="exampleEvidence" content={currentRow?.exampleEvidence?.map((e) => `${e.documentationType}: ${e.description}`)} />

            <AccordionSection label="Control Questions" content={currentRow?.controlQuestions} value="controlQuestions" />
            <AccordionSection label="Assessment Methods" content={currentRow?.assessmentMethods} value="assessmentMethods" />
            <AccordionSection label="Assessment Objectives" content={currentRow?.assessmentObjectives} value="assessmentObjectives" />
          </Accordion>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ControlsTable

const UserDetails = ({ label, userId, date }: { label: string; userId: string; date: string }) => {
  const { data, isLoading } = useGetUsers({ id: userId })
  const user = data?.users.edges?.[0] as User

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center gap-2">
        <span className="font-normal">{label}:</span>
        <Tooltip>
          <TooltipTrigger>
            <span>{formatDistanceToNow(parseISO(date), { addSuffix: true })}</span>
          </TooltipTrigger>
          <TooltipContent>{format(parseISO(date), 'MMMM d, yyyy h:mm a')}</TooltipContent>
        </Tooltip>
        {isLoading ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : (
          user && (
            <span className="flex items-center gap-1">
              <Avatar variant="small" entity={user} />
            </span>
          )
        )}
      </div>
    </div>
  )
}
