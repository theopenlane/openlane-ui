'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, List } from 'lucide-react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import SetObjectAssociationDialog from '@/components/pages/protected/policies/modal/set-object-association-modal.tsx'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/authz/utils.ts'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import ObjectAssociationChip from '@/components/shared/objectAssociation/object-association-chip.tsx'

type AssociatedObjectsAccordionProps = {
  policy: InternalPolicyByIdFragment
}

const AssociatedObjectsViewAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ policy }) => {
  console.log(policy)
  const plateEditorHelper = usePlateEditor()
  const [expandedItems, setExpandedItems] = useState<string[]>(['procedures'])
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.POLICY, policy.id)
  const editAllowed = canEdit(permission?.roles)

  const toggleAll = () => {
    const allSections = ['controls', 'procedures', 'tasks', 'controlObjectives', 'programs']
    const hasAllExpanded = allSections.every((section) => expandedItems.includes(section))
    setExpandedItems(hasAllExpanded ? [] : allSections)
  }

  const renderTable = (
    kind: string,
    rows: { id: string; displayID: string; refCode?: string | null; name?: string | null; title?: string | null; details?: string | null; description?: string | null; summary?: string | null }[],
  ) => (
    <div className="flex gap-2 flex-wrap">
      {rows.length > 0 ? (
        rows.map((row) => {
          const href = getHrefForObjectType(kind, row)
          const text = row.name || row.refCode || row.title || '-'
          return (
            <ObjectAssociationChip
              object={{
                id: row.id,
                refCode: row?.refCode,
                name: row?.name,
                title: row?.title,
                details: row?.details,
                description: row?.description,
                summary: row?.summary,
              }}
            ></ObjectAssociationChip>
          )
        })
      ) : (
        <div>No records found.</div>
      )}
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
      <Accordion type="multiple" value={expandedItems} onValueChange={(values) => setExpandedItems(values)} className="w-full">
        {!!policy.procedures.edges?.length && (
          <AccordionItem value="procedures">
            <SectionTrigger label="Procedures" count={policy.procedures.totalCount} />
            <AccordionContent>{renderTable('procedures', extractNodes(policy.procedures.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!policy.controls.edges?.length && (
          <AccordionItem value="controls">
            <SectionTrigger label="Controls" count={policy.controls.totalCount} />
            <AccordionContent>{renderTable('controls', extractNodes(policy.controls.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!policy.subcontrols.edges?.length && (
          <AccordionItem value="subcontrols">
            <SectionTrigger label="Subcontrols" count={policy.subcontrols.totalCount} />
            <AccordionContent>{renderTable('subcontrols', extractNodes(policy.subcontrols.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!policy.controlObjectives.edges?.length && (
          <AccordionItem value="controlObjectives">
            <SectionTrigger label="Control Objectives" count={policy.controlObjectives.totalCount} />
            <AccordionContent>{renderTable('control-objectives', extractNodes(policy.controlObjectives.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!policy.tasks.edges?.length && (
          <AccordionItem value="tasks">
            <SectionTrigger label="Tasks" count={policy.tasks.totalCount} />
            <AccordionContent>{renderTable('tasks', extractNodes(policy.tasks.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!policy.programs.edges?.length && (
          <AccordionItem value="programs">
            <SectionTrigger label="Programs" count={policy.programs.totalCount} />
            <AccordionContent>{renderTable('programs', extractNodes(policy.programs.edges))}</AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <div className="mt-5">{editAllowed && <SetObjectAssociationDialog policyId={policy?.id} />}</div>
    </div>
  )
}

export default AssociatedObjectsViewAccordion
