import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Badge } from '@repo/ui/badge'

const PendingActions = () => {
  const [tab, setTab] = useState('waiting-on-you')

  const pendingActions = [
    {
      date: 'Jan 11, 2025',
      type: 'Procedure',
      name: 'Steamed qui est strong shop crema fair cappuccino',
      submitter: 'Sally Shell',
      submitterInitial: 'S',
      submitterColor: 'bg-purple-500',
    },
    {
      date: 'Jan 11, 2025',
      type: 'Policy',
      name: 'Macchiato caramelization grinder espresso turkish',
      submitter: 'Ann Smith',
      submitterInitial: 'A',
      submitterColor: 'bg-red-500',
    },
  ]

  const approvalsWaitingFor = [
    {
      date: 'Jan 11, 2025',
      type: 'Procedure',
      name: 'Environmental Compliance Procedure',
      approver: 'Karen Henderson',
    },
    {
      date: 'Jan 11, 2025',
      type: 'Policy',
      name: 'Crema mocha instant robusta turkish cappuccino...',
      approver: 'Karen Henderson',
    },
  ]

  const columns: ColumnDef<any>[] = [
    {
      header: 'Date Submitted',
      accessorKey: 'date',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CalendarDays size={16} />
          {row.getValue('date')}
        </div>
      ),
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex flex-col  ">
          <Badge variant="outline" className="size-fit">
            {row.original.type}
          </Badge>
          <a href="#" className="text-blue-600 hover:underline">
            {row.getValue('name')}
          </a>
        </div>
      ),
    },
    {
      header: 'Submitter/Approver',
      accessorKey: 'submitter',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback className={`${row.original.submitterColor} text-white text-xs`}>{row.original.submitterInitial || 'A'}</AvatarFallback>
          </Avatar>
          {row.getValue('submitter') || row.getValue('approver')}
        </div>
      ),
    },
  ]

  return (
    <Card className="shadow-md rounded-lg border flex-1">
      <CardTitle className="text-lg font-semibold">Pending Actions</CardTitle>
      <CardContent>
        <Tabs defaultValue={tab} onValueChange={setTab}>
          <TabsList className="flex w-full justify-between border-b">
            <TabsTrigger value="waiting-on-you" className="flex-1">
              Waiting on you ({pendingActions.length})
            </TabsTrigger>
            <TabsTrigger value="approvals-you-wait-for" className="flex-1">
              Approvals you are waiting for ({approvalsWaitingFor.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting-on-you">
            <DataTable columns={columns} data={pendingActions} />
          </TabsContent>
          <TabsContent value="approvals-you-wait-for">
            <DataTable columns={columns} data={approvalsWaitingFor} />
          </TabsContent>
        </Tabs>
        <div className="mt-7 text-sm text-primary flex items-center cursor-pointer">
          Show more Pending Actions <ChevronRight size={16} className="ml-1" />
        </div>
      </CardContent>
    </Card>
  )
}

export default PendingActions
