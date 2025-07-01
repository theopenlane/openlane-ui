'use client'

import React, { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, List } from 'lucide-react'
import { ProcedureByIdFragment } from '@repo/codegen/src/schema'
import SetObjectAssociationDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canEdit } from '@/lib/authz/utils.ts'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import ObjectAssociationChip from '@/components/shared/objectAssociation/object-association-chip.tsx'

type AssociatedObjectsAccordionProps = {
  procedure: ProcedureByIdFragment
}

const AssociatedObjectsViewAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ procedure }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['internalPolicies'])
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.PROCEDURE, procedure.id)
  const editAllowed = canEdit(permission?.roles)

  const toggleAll = () => {
    const allSections = ['internalPolicies', 'controls', 'risks', 'tasks', 'programs']
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
        {!!procedure.internalPolicies.edges?.length && (
          <AccordionItem value="internalPolicies">
            <SectionTrigger label="Internal Policies" count={procedure.internalPolicies.totalCount} />
            <AccordionContent>{renderTable('policies', extractNodes(procedure.internalPolicies.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!procedure.controls.edges?.length && (
          <AccordionItem value="controls">
            <SectionTrigger label="Controls" count={procedure.controls.totalCount} />
            <AccordionContent>{renderTable('controls', extractNodes(procedure.controls.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!procedure.subcontrols.edges?.length && (
          <AccordionItem value="subcontrols">
            <SectionTrigger label="Subcontrols" count={procedure.subcontrols.totalCount} />
            <AccordionContent>{renderTable('subcontrols', extractNodes(procedure.subcontrols.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!procedure.risks.edges?.length && (
          <AccordionItem value="risks">
            <SectionTrigger label="Risks" count={procedure.risks.totalCount} />
            <AccordionContent>{renderTable('risks', extractNodes(procedure.risks.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!procedure.tasks.edges?.length && (
          <AccordionItem value="tasks">
            <SectionTrigger label="Tasks" count={procedure.tasks.totalCount} />
            <AccordionContent>{renderTable('tasks', extractNodes(procedure.tasks.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!procedure.programs.edges?.length && (
          <AccordionItem value="programs">
            <SectionTrigger label="Programs" count={procedure.programs.totalCount} />
            <AccordionContent>{renderTable('programs', extractNodes(procedure.programs.edges))}</AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <div className="mt-5">{editAllowed && <SetObjectAssociationDialog procedureId={procedure?.id} />}</div>
    </div>
  )
}

export default AssociatedObjectsViewAccordion
