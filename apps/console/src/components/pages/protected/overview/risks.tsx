import React from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Cog, Pencil } from 'lucide-react'
import { ColumnDef } from '@tanstack/table-core'

const risksData = [
  {
    name: 'Percolator cappuccino percolator java as grinder and espresso...',
    for: 'CCI 1.2, CCI 2.2, System ABC, OKR 2025',
    assigner: 'Karen Henderson',
    score: 3,
  },
  {
    name: 'Wings cup in lait panna filter origin irish cortado.',
    for: 'CCI 1.2, CCI 2.2, System ABC, OKR 2025',
    assigner: 'Karen Henderson',
    score: 3,
  },
]

const columns: ColumnDef<any>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => (
      <a href="#" className="text-blue-600 hover:underline">
        {row.getValue('name')}
      </a>
    ),
  },
  {
    header: 'For',
    accessorKey: 'for',
  },
  {
    header: 'Assigner',
    accessorKey: 'assigner',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="w-6 h-6">
          <AvatarFallback className="bg-yellow-500 text-white text-xs">K</AvatarFallback>
        </Avatar>
        {row.getValue('assigner')}
      </div>
    ),
  },
  {
    header: 'Score',
    accessorKey: 'score',
  },
]

const Risks = () => {
  return (
    <Card className="shadow-md rounded-lg flex-1 ">
      <div className="flex justify-between items-center  ">
        <CardTitle className="text-lg font-semibold">Risks</CardTitle>
        <Button variant="outline" className="flex items-center gap-2 mr-7" icon={<Cog size={16} />} iconPosition="left">
          Edit
        </Button>
      </div>
      <CardContent>
        <DataTable columns={columns} data={risksData} />
      </CardContent>
    </Card>
  )
}

export default Risks
