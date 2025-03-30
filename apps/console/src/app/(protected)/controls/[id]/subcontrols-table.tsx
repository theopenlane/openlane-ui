'use client'

import React from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'

const SubcontrolsTable: React.FC = () => {
  const subcontrols = [
    {
      id: 'R-CC2212',
      name: 'Mazagran in au seasonal foam turkish kopi iced body in so dark id. White grinder sugar aged kopi fair acerbic redeye variety strong pumpkin bar. Siphon con spice grounds blue mazagran...',
    },
    {
      id: 'C-123987',
      name: 'Mazagran in au seasonal foam turkish kopi iced body in so dark id. White grinder sugar aged kopi fair acerbic redeye variety strong pumpkin bar. Siphon con spice grounds blue mazagran...',
    },
    {
      id: 'D-129387',
      name: 'Mazagran in au seasonal foam turkish kopi iced body in so dark id. White grinder sugar aged kopi fair acerbic redeye variety strong pumpkin bar. Siphon con spice grounds blue mazagran...',
    },
  ]

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Subcontrol</h2>

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">Ref Code</TableHead>
              <TableHead className="px-4 py-2">Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subcontrols.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-4 py-2 text-primary">
                  <Link href={`/controls/${item.id}`}>{item.id}</Link>
                </TableCell>
                <TableCell className="px-4 py-2 max-w-[700px] truncate text-ellipsis overflow-hidden">{item.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SubcontrolsTable
