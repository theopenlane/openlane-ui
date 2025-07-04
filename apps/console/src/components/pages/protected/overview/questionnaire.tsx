import React from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Cog, FileQuestion, SquareCheck, SquareX } from 'lucide-react'
import { ColumnDef } from '@tanstack/table-core'
import { ProgressCircle } from '@repo/ui/progress-circle'
import { Template } from '@repo/codegen/src/schema'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import Link from 'next/link'

const columns: ColumnDef<Template>[] = [
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
  const { data } = useTemplates({})
  const templates = (data?.templates?.edges?.map((edge) => edge?.node) as Template[]) || []
  const hasData = !!templates.length

  const questionnaireContent = (
    <CardContent>
      <div className="flex gap-6 items-center mb-6">
        <ProgressCircle radius={65} strokeWidth={20} value={templates.length} max={50} variant="success" />
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">24</div>
            <Badge className="bg-gray-500 text-white">Created</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">10</div>
            <Badge className="bg-yellow-500 text-white">Outstanding</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">14</div>
            <Badge className="bg-green-500 text-white">Completed</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">2</div>
            <Badge className="bg-green-600 text-white">Completed Pending Review</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">1</div>
            <Badge className="bg-green-600 text-white">Completed Accepted</Badge>
          </div>
        </div>
      </div>
      <DataTable columns={columns} data={templates} />
    </CardContent>
  )

  return (
    <Card className="shadow-md rounded-lg flex-1">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Questionnaire</CardTitle>
        <Button variant="outline" className="flex items-center gap-2 mr-7" icon={<Cog size={16} />} iconPosition="left">
          Edit
        </Button>
      </div>
      {hasData ? (
        questionnaireContent
      ) : (
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-16">
            <FileQuestion size={89} strokeWidth={1} className="text-border mb-4" />
            <h2 className="text-lg font-semibold">No questionnaires</h2>
            <Link href={'/questionnaires'}>
              <Button variant="outline" className="mt-4">
                Take me there
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default Questionnaire
