'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'

type AssociatedObjectsAccordionProps = {
  policy: InternalPolicyByIdFragment
}

const AssociatedObjectsViewAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ policy }) => {
  const plateEditorHelper = usePlateEditor()
  const [expandedItems, setExpandedItems] = useState<string[]>(['procedures'])
  const toggleAll = (expand: boolean) => {
    setExpandedItems(expand ? ['procedures', 'controls', 'controlObjectives', 'tasks', 'programs'] : [])
  }

  const renderTable = (rows: { displayID: string; refCode?: string; name?: string; title?: string; details?: string }[]) => (
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
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row?.refCode ?? row.displayID}>
                <TableCell className="px-4 py-2 text-primary">
                  <Link href={`/objects/${row?.refCode ?? row.displayID}`}>{row?.refCode ?? row.displayID}</Link>
                </TableCell>
                <TableCell className="px-4 py-2">{row.name || row.title || '-'}</TableCell>
                <TableCell className="px-4 py-2">{row?.details && plateEditorHelper.convertToReadOnly(row.details)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="px-4 py-2 text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const SectionTrigger = ({ label, count }: { label: string; count: number }) => (
    <AccordionTrigger asChild>
      <button className="group flex items-center py-2 text-left gap-3 w-full">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
          <span className="text-base font-medium">{label}</span>
        </div>
        <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{count}</span>
      </button>
    </AccordionTrigger>
  )

  const extractNodes = <T extends { id: string }>(edges: Array<{ node?: T | null } | null> | null | undefined): T[] => {
    return (edges ?? []).map((edge) => edge?.node).filter((node): node is T => !!node)
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold whitespace-nowrap">Associated Objects</h2>
        <div className="flex justify-between w-full">
          <div className="flex gap-2.5 items-center">
            <Button className="h-8 !px-2" variant="outline" type="button" onClick={() => toggleAll(false)} icon={<ChevronsDownUp />} iconPosition="left">
              Collapse all
            </Button>
            <Button className="h-8 !px-2" variant="outline" type="button" onClick={() => toggleAll(true)} icon={<ChevronsUpDown />} iconPosition="left">
              Expand all
            </Button>
          </div>
        </div>
      </div>
      <Accordion type="multiple" value={expandedItems} onValueChange={(values) => setExpandedItems(values)} className="w-full">
        <AccordionItem value="procedures">
          <SectionTrigger label="Procedures" count={policy.procedures.totalCount} />
          {!!policy.procedures.edges?.length && <AccordionContent>{renderTable(extractNodes(policy.procedures.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="controls">
          <SectionTrigger label="Controls" count={policy.controls.totalCount} />
          {!!policy.controls.edges?.length && <AccordionContent>{renderTable(extractNodes(policy.controls.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="controlObjectives">
          <SectionTrigger label="Control Objectives" count={policy.controlObjectives.totalCount} />
          {!!policy.controlObjectives.edges?.length && <AccordionContent>{renderTable(extractNodes(policy.controlObjectives.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="tasks">
          <SectionTrigger label="Tasks" count={policy.tasks.totalCount} />
          {!!policy.tasks.edges?.length && <AccordionContent>{renderTable(extractNodes(policy.tasks.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="programs">
          <SectionTrigger label="Programs" count={policy.programs.totalCount} />
          {!!policy.programs.edges?.length && <AccordionContent>{renderTable(extractNodes(policy.programs.edges))}</AccordionContent>}
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsViewAccordion
