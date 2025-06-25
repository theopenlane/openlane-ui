'use client'

import React from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

type Props = {
  subcontrols: ({
    node?: {
      refCode: string
      description?: string | null
      id: string
    } | null
  } | null)[]
  totalCount: number
}

const SubcontrolsTable: React.FC<Props> = ({ subcontrols, totalCount }) => {
  const { id } = useParams()
  const { convertToReadOnly } = usePlateEditor()

  return (
    <div className="mt-8 space-y-4">
      <div className="flex gap-2">
        <h2 className="text-lg font-semibold">Subcontrols</h2>
        <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{totalCount}</span>
      </div>

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">Ref Code</TableHead>
              <TableHead className="px-4 py-2">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subcontrols.filter(
              (edge): edge is { node: { id: string; refCode: string; description?: string | null } } => !!edge?.node && typeof edge.node.id === 'string' && typeof edge.node.refCode === 'string',
            ).length > 0 ? (
              subcontrols
                .filter(
                  (edge): edge is { node: { id: string; refCode: string; description?: string | null } } => !!edge?.node && typeof edge.node.id === 'string' && typeof edge.node.refCode === 'string',
                )
                .map(({ node }) => (
                  <TableRow key={node.id}>
                    <TableCell className="px-4 py-2 text-primary">
                      <Link href={`/controls/${id}/${node.id}`} className="text-blue-500 hover:underline">
                        {node.refCode}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-2 max-w-[700px] truncate text-ellipsis overflow-hidden">{node.description ? convertToReadOnly(node.description, 0) : '-'}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="px-4 py-2 text-muted-foreground">
                  No subcontrols found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SubcontrolsTable
