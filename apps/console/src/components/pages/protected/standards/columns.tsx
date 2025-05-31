// components/StandardDetailsAccordion/columns.tsx
'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'

type GetColumnsProps = {
  selectedControls: { id: string; refCode: string }[]
  toggleSelection: (control: { id: string; refCode: string }) => void
  setSelectedControls: (controls: { id: string; refCode: string }[]) => void
  controls: ControlListFieldsFragment[]
}

export const getColumns = ({ selectedControls, toggleSelection, setSelectedControls, controls }: GetColumnsProps) => {
  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={selectedControls.length === controls.length}
          onCheckedChange={(checked: boolean) => setSelectedControls(checked ? controls.map((c) => ({ id: c.id, refCode: c.refCode })) : [])}
        />
      ),
      cell: ({ row }: any) => {
        const { id, refCode } = row.original
        const isChecked = selectedControls.some((c) => c.id === id)
        return <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, refCode })} />
      },
      size: 50,
    },
    {
      accessorKey: 'refCode',
      header: 'Ref Code',
      cell: (info: any) => <span className="text-blue-400 whitespace-nowrap">{info.getValue()}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: (info: any) => (
        <>
          {(info.getValue() as string)?.split('\n').map((line: string, idx: number) => (
            <React.Fragment key={idx}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </>
      ),
    },
    {
      accessorKey: 'subcategory',
      header: 'Subdomain',
    },
    {
      accessorKey: 'mappedCategories',
      header: 'Mapped Categories',
      cell: (info: any) => (info.getValue() as string[])?.join(', '),
    },
    {
      accessorKey: 'subcontrols.totalCount',
      header: '# of Sub controls',
      cell: (info: any) => info.row.original.subcontrols.totalCount,
    },
  ]
}
