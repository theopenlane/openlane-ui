'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { ProcedureByIdFragment } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import SetObjectAssociationDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'

type AssociatedObjectsAccordionProps = {
  procedure: ProcedureByIdFragment
}

const AssociatedObjectsViewAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ procedure }) => {
  const plateEditorHelper = usePlateEditor()
  const [expandedItems, setExpandedItems] = useState<string[]>(['internalPolicies'])
  const toggleAll = (expand: boolean) => {
    setExpandedItems(expand ? ['internalPolicies', 'controls', 'risks', 'tasks', 'programs'] : [])
  }

  const renderTable = (
    kind: string,
    rows: { id: string; displayID: string; refCode?: string | null; name?: string | null; title?: string | null; details?: string | null; description?: string | null; summary?: string | null }[],
  ) => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">Name</TableHead>
            <TableHead className="px-4 py-2">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row?.refCode ?? row.displayID}>
                <TableCell className="px-4 py-2 text-primary font-bold">
                  <Link href={`/${kind}/${row?.id}`} className="text-blue-500 hover:underline">
                    {row.name || row.refCode || row.title || '-'}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-2 line-clamp-1 overflow-hidden">{row?.summary || row?.description || (row?.details && plateEditorHelper.convertToReadOnly(row.details, 0))}</TableCell>
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
        <div className="flex justify-between w-full items-center">
          <div className="flex gap-2.5 items-center">
            <Button className="h-8 !px-2" variant="outline" type="button" onClick={() => toggleAll(false)} icon={<ChevronsDownUp />} iconPosition="left">
              Collapse all
            </Button>
            <Button className="h-8 !px-2" variant="outline" type="button" onClick={() => toggleAll(true)} icon={<ChevronsUpDown />} iconPosition="left">
              Expand all
            </Button>
          </div>
          <div className="ml-auto">
            <SetObjectAssociationDialog procedureId={procedure?.id} />
          </div>
        </div>
      </div>
      <Accordion type="multiple" value={expandedItems} onValueChange={(values) => setExpandedItems(values)} className="w-full">
        <AccordionItem value="internalPolicies">
          <SectionTrigger label="Internal Policies" count={procedure.internalPolicies.totalCount} />
          {!!procedure.internalPolicies.edges?.length && <AccordionContent>{renderTable('policies', extractNodes(procedure.internalPolicies.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="controls">
          <SectionTrigger label="Controls" count={procedure.controls.totalCount} />
          {!!procedure.controls.edges?.length && <AccordionContent>{renderTable('controls', extractNodes(procedure.controls.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="risks">
          <SectionTrigger label="Risks" count={procedure.risks.totalCount} />
          {!!procedure.risks.edges?.length && <AccordionContent>{renderTable('risks', extractNodes(procedure.risks.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="tasks">
          <SectionTrigger label="Tasks" count={procedure.tasks.totalCount} />
          {!!procedure.tasks.edges?.length && <AccordionContent>{renderTable('tasks', extractNodes(procedure.tasks.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="programs">
          <SectionTrigger label="Programs" count={procedure.programs.totalCount} />
          {!!procedure.programs.edges?.length && <AccordionContent>{renderTable('programs', extractNodes(procedure.programs.edges))}</AccordionContent>}
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsViewAccordion
