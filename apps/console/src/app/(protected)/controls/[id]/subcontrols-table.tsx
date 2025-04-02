'use client'

import React from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'

type Props = {
  subcontrols: ({
    node?: {
      refCode: string
      description?: string | null
    } | null
  } | null)[]
  totalCount: number
}

const SubcontrolsTable: React.FC<Props> = ({ subcontrols, totalCount }) => {
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
            {subcontrols.filter((edge): edge is { node: { refCode: string; description?: string | null } } => !!edge?.node).length > 0 ? (
              subcontrols
                .filter((edge): edge is { node: { refCode: string; description?: string | null } } => !!edge?.node)
                .map(({ node }) => (
                  <TableRow key={node.refCode}>
                    <TableCell className="px-4 py-2 text-primary">
                      <p className="text-blue-500">{node.refCode}</p>
                    </TableCell>
                    <TableCell className="px-4 py-2 max-w-[700px] truncate text-ellipsis overflow-hidden">{node.description || '-'}</TableCell>
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
