'use client'

import React, { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'

const dummyRows = [
  {
    id: 'R-CC2212',
    name: 'R123',
    description: 'Cappuccino blue cappuccino eu instant go chicory mocha.',
  },
  {
    id: 'R-123123',
    name: 'R321',
    description: 'Mountain steamed sugar aromatic saucer luwak froth sugar body foam.',
  },
]

const AssociatedObjectsAccordion: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['procedures', 'programs'])

  const toggleAll = (expand: boolean) => {
    setExpandedItems(expand ? ['policies', 'procedures', 'tasks', 'programs'] : [])
  }

  const renderTable = () => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">Display ID</TableHead>
            <TableHead className="px-4 py-2">Name</TableHead>
            <TableHead className="px-4 py-2">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dummyRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-4 py-2 text-primary">
                <Link href={`/objects/${row.id}`}>{row.id}</Link>
              </TableCell>
              <TableCell className="px-4 py-2">{row.name}</TableCell>
              <TableCell className="px-4 py-2">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const SectionTrigger = ({ label, count }: { label: string; count: number }) => (
    <AccordionTrigger asChild>
      <button className="group flex items-center py-2 text-left gap-3">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
          <span className="text-base font-medium">{label}</span>
        </div>
        <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{count}</span>
      </button>
    </AccordionTrigger>
  )

  return (
    <div className="mt-10 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Associated Objects</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toggleAll(false)} icon={<ChevronsDownUp />} iconPosition="left">
            Collapse all
          </Button>
          <Button variant="outline" onClick={() => toggleAll(true)} icon={<ChevronsUpDown />} iconPosition="left">
            Expand all
          </Button>
          <Button>Set Association</Button>
        </div>
      </div>

      <Accordion type="multiple" value={expandedItems} onValueChange={(values) => setExpandedItems(values)} className="w-full">
        <AccordionItem value="policies">
          <SectionTrigger label="Policies" count={178} />
          <AccordionContent>{renderTable()}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="procedures">
          <SectionTrigger label="Procedures" count={4} />
          <AccordionContent>{renderTable()}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="tasks">
          <SectionTrigger label="Tasks" count={88} />
          <AccordionContent>{renderTable()}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="programs">
          <SectionTrigger label="Programs" count={2} />
          <AccordionContent>{renderTable()}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsAccordion
