'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { SetObjectAssociationDialog } from './set-object-association-modal'
import { ControlFieldsFragment } from '@repo/codegen/src/schema'

type AssociatedObjectsAccordionProps = {
  policies: ControlFieldsFragment['internalPolicies']
  procedures: ControlFieldsFragment['procedures']
  tasks: ControlFieldsFragment['tasks']
  programs: ControlFieldsFragment['programs']
  risks: ControlFieldsFragment['risks']
}

const AssociatedObjectsAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ policies, procedures, tasks, programs, risks }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['policies'])

  const toggleAll = (expand: boolean) => {
    setExpandedItems(expand ? ['policies', 'procedures', 'tasks', 'programs', 'risks'] : [])
  }

  const renderTable = (rows: { id: string; name?: string; title?: string }[]) => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">ID</TableHead>
            <TableHead className="px-4 py-2">Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-2 text-primary">
                  <Link href={`/objects/${row.id}`}>{row.id}</Link>
                </TableCell>
                <TableCell className="px-4 py-2">{row.name || row.title || '-'}</TableCell>
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
            <Button className="h-8 !px-2" variant="outline" onClick={() => toggleAll(false)} icon={<ChevronsDownUp />} iconPosition="left">
              Collapse all
            </Button>
            <Button className="h-8 !px-2" variant="outline" onClick={() => toggleAll(true)} icon={<ChevronsUpDown />} iconPosition="left">
              Expand all
            </Button>
          </div>
          <SetObjectAssociationDialog />
        </div>
      </div>

      <Accordion type="multiple" value={expandedItems} onValueChange={(values) => setExpandedItems(values)} className="w-full">
        <AccordionItem value="policies">
          <SectionTrigger label="Policies" count={policies.totalCount} />
          {!!policies.edges?.length && <AccordionContent>{renderTable(extractNodes(policies.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="procedures">
          <SectionTrigger label="Procedures" count={procedures.totalCount} />
          {!!procedures.edges?.length && <AccordionContent>{renderTable(extractNodes(procedures.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="tasks">
          <SectionTrigger label="Tasks" count={tasks.totalCount} />
          {!!tasks.edges?.length && <AccordionContent>{renderTable(extractNodes(tasks.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="programs">
          <SectionTrigger label="Programs" count={programs.totalCount} />
          {!!programs.edges?.length && <AccordionContent>{renderTable(extractNodes(programs.edges))}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="risks">
          <SectionTrigger label="Risks" count={risks.totalCount} />
          {!!risks.edges?.length && <AccordionContent>{renderTable(extractNodes(risks.edges))}</AccordionContent>}
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsAccordion
