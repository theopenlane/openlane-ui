'use client'

import React from 'react'
import { format } from 'date-fns'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import EvidenceCreateFormDialog from '@/components/pages/protected/evidence/evidence-create-form-dialog'

const ControlEvidenceTable: React.FC = () => {
  const evidenceList = [
    {
      id: 'E123',
      name: 'Café seasonal cinnamon flavour mocha',
      createdAt: '2025-01-16',
    },
    {
      id: 'E123',
      name: 'Café seasonal cinnamon flavour mocha',
      createdAt: '2025-01-16',
    },
    {
      id: 'E123',
      name: 'Café seasonal cinnamon flavour mocha',
      createdAt: '2025-01-16',
    },
  ]

  const handleUploadClick = () => {
    console.log('Upload Evidence clicked')
    // You could trigger a modal here
  }

  return (
    <div className="mt-8 space-y-4 ">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Control Evidence</h2>
        {/* <Button onClick={handleUploadClick}>Upload Evidence</Button> */}
        <EvidenceCreateFormDialog />
      </div>

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">ID</TableHead>
              <TableHead className="px-4 py-2">Name</TableHead>
              <TableHead className="px-4 py-2">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidenceList.map((evidence, i) => (
              <TableRow key={i}>
                <TableCell className="px-4 py-2 text-primary">
                  <p className="text-blue-500 ">{evidence.id}</p>
                </TableCell>
                <TableCell className="px-4 py-2">{evidence.name}</TableCell>
                <TableCell className="px-4 py-2">{format(new Date(evidence.createdAt), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ControlEvidenceTable
