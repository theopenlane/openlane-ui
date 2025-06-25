'use client'

import React, { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, List } from 'lucide-react'
import { RiskFieldsFragment } from '@repo/codegen/src/schema'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/authz/utils.ts'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import SetObjectAssociationDialog from '../modal/set-object-association-modal'
import ObjectAssociationChip from '@/components/shared/objectAssociation/object-association-chip.tsx'

type AssociatedObjectsAccordionProps = {
  risk: RiskFieldsFragment
}

const AssociatedObjectsViewAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ risk }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['controls'])
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.RISK, risk.id)
  const editAllowed = canEdit(permission?.roles)

  const toggleAll = () => {
    const allSections = ['controls', 'internalPolicies', 'procedures', 'programs', 'subcontrols', 'tasks']
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
        {!!risk.controls.edges?.length && (
          <AccordionItem value="controls">
            <SectionTrigger label="Controls" count={risk.controls.totalCount} />
            <AccordionContent>{renderTable('controls', extractNodes(risk.controls.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!risk.internalPolicies.edges?.length && (
          <AccordionItem value="internalPolicies">
            <SectionTrigger label="Internal Policies" count={risk.internalPolicies.totalCount} />
            <AccordionContent>{renderTable('internal-policies', extractNodes(risk.internalPolicies.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!risk.procedures.edges?.length && (
          <AccordionItem value="procedures">
            <SectionTrigger label="Procedures" count={risk.procedures.totalCount} />
            <AccordionContent>{renderTable('procedures', extractNodes(risk.procedures.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!risk.subcontrols.edges?.length && (
          <AccordionItem value="subcontrols">
            <SectionTrigger label="Subcontrols" count={risk.subcontrols.totalCount} />
            <AccordionContent>{renderTable('subcontrols', extractNodes(risk.subcontrols.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!risk.tasks.edges?.length && (
          <AccordionItem value="tasks">
            <SectionTrigger label="Tasks" count={risk.tasks.totalCount} />
            <AccordionContent>{renderTable('tasks', extractNodes(risk.tasks.edges))}</AccordionContent>
          </AccordionItem>
        )}

        {!!risk.programs.edges?.length && (
          <AccordionItem value="programs">
            <SectionTrigger label="Programs" count={risk.programs.totalCount} />
            <AccordionContent>{renderTable('programs', extractNodes(risk.programs.edges))}</AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <div className="mt-5">{editAllowed && <SetObjectAssociationDialog riskId={risk?.id} />}</div>
    </div>
  )
}

export default AssociatedObjectsViewAccordion
