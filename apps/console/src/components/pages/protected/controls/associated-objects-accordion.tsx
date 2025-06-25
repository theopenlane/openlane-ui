'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, List } from 'lucide-react'
import { SetObjectAssociationDialog } from './set-object-association-modal'
import { ControlDetailsFieldsFragment, Group, Program, RiskEdge, RiskFieldsFragment, Task, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { PROGRAM_STATUS_LABELS } from '@/components/shared/icon-enum/program-enum'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import ObjectAssociationChip from '@/components/shared/objectAssociation/object-association-chip.tsx'

type AssociatedObjectsAccordionProps = {
  policies: ControlDetailsFieldsFragment['internalPolicies']
  procedures: ControlDetailsFieldsFragment['procedures']
  tasks: ControlDetailsFieldsFragment['tasks']
  programs?: ControlDetailsFieldsFragment['programs']
  risks: ControlDetailsFieldsFragment['risks']
  canEdit?: boolean
}

type PolicyOrProcedure = {
  id: string
  name: string
  approver?: {
    __typename?: 'Group'
    gravatarLogoURL?: string | null
    logoURL?: string | null
    displayName: string
  } | null
}

const AssociatedObjectsAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ policies, procedures, tasks, programs, risks, canEdit }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['policies'])

  const toggleAll = () => {
    const allSections = ['policies', 'procedures', 'tasks', 'programs', 'risks']
    const hasAllExpanded = allSections.every((section) => expandedItems.includes(section))
    setExpandedItems(hasAllExpanded ? [] : allSections)
  }

  const extractNodes = <T extends { id: string }>(edges: Array<{ node?: T | null } | null> | null | undefined): T[] => {
    return (edges ?? []).map((edge) => edge?.node).filter((node): node is T => !!node)
  }

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

  const renderTable = (
    kind: string,
    rows: { id: string; displayID: string; refCode?: string | null; name?: string | null; title?: string | null; details?: string | null; description?: string | null; summary?: string | null }[],
  ) => (
    <div className="flex gap-2 flex-wrap">
      {rows.length > 0 ? (
        rows.map((row) => {
          return (
            <ObjectAssociationChip
              key={row?.id}
              object={{
                id: row.id,
                refCode: row?.refCode,
                name: row?.name,
                title: row?.title,
                details: row?.details,
                description: row?.description,
                summary: row?.summary,
                link: getHrefForObjectType(kind, row),
              }}
            ></ObjectAssociationChip>
          )
        })
      ) : (
        <div>No records found.</div>
      )}
    </div>
  )

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-medium whitespace-nowrap">Associated Objects</h2>
        <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAll}>
          <div className="flex">
            <List size={16} />
            <ChevronsDownUp size={16} />
          </div>
        </Button>
      </div>

      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
        {!!policies.edges?.length && (
          <AccordionItem value="policies">
            <SectionTrigger label="Policies" count={policies.totalCount} />
            <AccordionContent>{renderTable('policies', extractNodes(policies.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!procedures.edges?.length && (
          <AccordionItem value="procedures">
            <SectionTrigger label="Procedures" count={procedures.totalCount} />
            <AccordionContent>{renderTable('procedures', extractNodes(procedures.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!tasks.edges?.length && (
          <AccordionItem value="tasks">
            <SectionTrigger label="Tasks" count={tasks.totalCount} />
            <AccordionContent>{renderTable('tasks', extractNodes(tasks.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!programs?.edges?.length && (
          <AccordionItem value="programs">
            <SectionTrigger label="Programs" count={programs.totalCount} />
            <AccordionContent>{renderTable('programs', extractNodes(programs.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!risks.edges?.length && (
          <AccordionItem value="risks">
            <SectionTrigger label="Risks" count={risks.totalCount} />
            <AccordionContent>{renderTable('risks', extractNodes(risks.edges))}</AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <div className="mt-5">{canEdit && <SetObjectAssociationDialog />}</div>
    </div>
  )
}

export default AssociatedObjectsAccordion
