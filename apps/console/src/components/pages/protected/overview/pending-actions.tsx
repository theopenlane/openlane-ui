import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { CalendarDays, ChevronRight, Inbox } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'
import { TableKeyEnum } from '@repo/ui/table-key'

type PendingAction = {
  date: string
  type: string
  name: string
  submitter?: string
  approver?: string
}

const PendingActions = () => {
  const [tab, setTab] = useState('waiting-on-you')

  const searchParams = useSearchParams()
  const programId = searchParams.get('id')

  const filters = [
    {
      field: 'hasProgramsWith',
      value: programId,
      type: 'selectIs',
      operator: 'EQ',
    },
  ]

  const pendingActions: PendingAction[] = [
    // {
    //   date: 'Jan 11, 2025',
    //   type: 'Procedure',
    //   name: 'Steamed qui est strong shop crema fair cappuccino',
    //   submitter: 'Sally Shell',
    // },
  ]

  const approvalsWaitingFor: PendingAction[] = [
    // {
    //   date: 'Jan 11, 2025',
    //   type: 'Procedure',
    //   name: 'Environmental Compliance Procedure',
    //   approver: 'Karen Henderson',
    // },
  ]

  const columns: ColumnDef<PendingAction>[] = [
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
        <div className="flex flex-col">
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
      cell: ({ row }) => <div className="flex items-center gap-2">{row.getValue('submitter') || row.getValue('approver')}</div>,
    },
  ]

  const noData = pendingActions.length === 0 && approvalsWaitingFor.length === 0

  const encodedFilters = encodeURIComponent(JSON.stringify(filters))
  const policiesRedirectURL = programId ? `/policies?filters=${encodedFilters}` : '/policies'

  return (
    <TooltipProvider>
      <Card className=" rounded-lg border flex-1">
        <CardTitle className="text-lg font-semibold">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">Pending Actions</span>
            </TooltipTrigger>
            <TooltipContent>Items requiring your attention: policies and procedures awaiting approval, evidence due for renewal, and automated test failures needing review</TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardContent>
          {noData ? (
            <div className="flex flex-col items-center justify-center text-center">
              <Inbox width={45} height={45} strokeWidth={1} className="text-border" />
              <h3 className="mt-4 text-lg font-semibold">No pending actions</h3>
              <p className="text-sm text-muted-foreground mt-1">Maybe it&apos;s time to review some policies and procedures that haven&apos;t been updated in a while?</p>
              <Link href={policiesRedirectURL} className="mt-4">
                <Button variant="secondary" className="mt-4">
                  Take me there
                </Button>
              </Link>
            </div>
          ) : (
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
                <DataTable columns={columns} data={pendingActions} tableKey={TableKeyEnum.OVERVIEW_PENDING_ACTIONS} />
              </TabsContent>
              <TabsContent value="approvals-you-wait-for">
                <DataTable columns={columns} data={approvalsWaitingFor} tableKey={TableKeyEnum.OVERVIEW_WAITING_APPROVAL} />
              </TabsContent>
            </Tabs>
          )}
          {!noData && (
            <div className="mt-7 text-sm text-primary flex items-center cursor-pointer">
              Show more Pending Actions <ChevronRight size={16} className="ml-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default PendingActions
