'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { getHrefForObjectType, NormalizedObject } from '@/utils/getHrefForObjectType'
import ObjectAssociationChip from '@/components/shared/object-association/object-association-chip.tsx'
import { Section } from '@/components/shared/object-association/types/object-association-types.ts'

type AssociatedObjectsAccordionProps = {
  sections: Section
  toggleAll: boolean
  removable?: boolean
  onRemove?: (objectId: string, kind: string) => void
}

const AssociatedObjectsAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ sections, toggleAll, removable, onRemove }) => {
  const sectionKeys = useMemo(() => Object.keys(sections), [sections])
  const sectionKeysRef = useRef(sectionKeys)
  sectionKeysRef.current = sectionKeys
  const [expandedItems, setExpandedItems] = useState<string[]>(sectionKeys[0] ? [sectionKeys[0]] : [])

  useEffect(() => {
    const allSections = sectionKeysRef.current
    setExpandedItems((prev) => {
      const hasAllExpanded = allSections.every((section) => prev.includes(section))
      return hasAllExpanded ? [] : allSections
    })
  }, [toggleAll])

  const extractNodes = <T extends { id: string }>(edges: Array<{ node?: T | null } | null> | null | undefined): T[] => {
    return (edges ?? []).map((edge) => edge?.node).filter((node): node is T => !!node)
  }

  const SectionTrigger = ({ label, count }: { label: string; count: number }) => (
    <AccordionTrigger asChild>
      <button className="group flex items-center py-2 text-left bg-transparent gap-3 w-full">
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
              kind={kind}
              key={row?.id}
              object={{
                id: row.id,
                refCode: row?.refCode,
                name: row?.name,
                title: row?.title,
                details: row?.details,
                description: row?.description,
                summary: row?.summary,
                link: getHrefForObjectType(kind, row as NormalizedObject),
              }}
              removable={removable}
              onRemove={onRemove ? () => onRemove(row.id, kind) : undefined}
            />
          )
        })
      ) : (
        <div>No records found.</div>
      )}
    </div>
  )

  return (
    <div>
      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
        {Object.entries(sections).map(([key, connection]) => {
          if (!connection?.edges?.length) {
            return null
          }

          return (
            <AccordionItem key={key} value={key}>
              <SectionTrigger label={key.charAt(0).toUpperCase() + key.slice(1)} count={connection.totalCount ?? 0} />
              <AccordionContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                {renderTable(key, extractNodes(connection.edges))}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsAccordion
