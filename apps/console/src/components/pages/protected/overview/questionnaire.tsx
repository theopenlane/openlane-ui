import React from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Cog, Pencil, SquareCheck, SquareX } from 'lucide-react'
import { ColumnDef } from '@tanstack/table-core'
import { ProgressCircle } from '@repo/ui/progress-circle'

const questionnaireData = [
  {
    name: 'Vendor Security Questionnaire',
    created: 'Jan 1, 2025',
    pending: 3,
    completed: 3,
    pendingReview: 'Deny',
    accepted: 'Approve',
  },
  {
    name: 'Ut seasonal chicory at barista sugar ut lai...',
    created: 'Jan 1, 2025',
    pending: 3,
    completed: 3,
    pendingReview: 'Deny',
    accepted: 'Deny',
  },
]

const columns: ColumnDef<any>[] = [
  {
    header: 'Questionnaire',
    accessorKey: 'name',
    cell: ({ row }) => (
      <a href="#" className="text-blue-600 hover:underline">
        {row.getValue('name')}
      </a>
    ),
  },
  {
    header: 'Questionnaire Created',
    accessorKey: 'created',
  },
  {
    header: 'Pending Response',
    accessorKey: 'pending',
  },
  {
    header: 'Completed',
    accessorKey: 'completed',
  },
  {
    header: 'Completed Pending Review',
    accessorKey: 'pendingReview',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <SquareX size={16} /> <span>Deny</span>
      </div>
    ),
  },
  {
    header: 'Completed Accepted',
    accessorKey: 'accepted',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <SquareCheck size={16} /> <span>Approve</span>
      </div>
    ),
  },
]

const Questionnaire = () => {
  return (
    <Card className="shadow-md rounded-lg flex-1">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Questionnaire</CardTitle>
        <Button variant="outline" className="flex items-center gap-2 mr-7" icon={<Cog size={16} />} iconPosition="left">
          Edit
        </Button>
      </div>
      <CardContent>
        <div className="flex gap-6 items-center mb-6">
          <ProgressCircle radius={65} strokeWidth={20} value={24} max={50} variant="success"></ProgressCircle>
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-medium">24</div>
              <Badge className="bg-yellow-500">Created</Badge>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-medium">10</div>
              <Badge className="bg-yellow-500">Outstanding</Badge>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-medium">14</div>
              <Badge className="bg-green-500">Completed</Badge>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-medium">2</div>
              <Badge className="bg-green-500">Completed Pending Review</Badge>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-medium">1</div>
              <Badge className="bg-green-500">Completed Accepted</Badge>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={questionnaireData} />
      </CardContent>
    </Card>
  )
}

export default Questionnaire
