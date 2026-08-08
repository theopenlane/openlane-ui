'use client'

import React, { memo } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { Avatar } from '@/components/shared/avatar/avatar'
import { DocumentStatusBadge } from '@/components/shared/enum-mapper/policy-enum'
import { type GetInternalPolicyAssociationsByIdQuery, type Group } from '@repo/codegen/src/schema.ts'
import { AlignLeft, ChevronDown, Clock, User } from 'lucide-react'

type ProcedureEdges = NonNullable<NonNullable<GetInternalPolicyAssociationsByIdQuery['internalPolicy']>['procedures']>['edges']

type LinkedProceduresProps = {
  procedures: ProcedureEdges
}

type ProcedureNode = NonNullable<NonNullable<ProcedureEdges>[number]>['node']

const ProcedureItem = memo(
  ({ node, showName = true, showApprover = false, showDivider = true }: { node: NonNullable<ProcedureNode>; showName?: boolean; showApprover?: boolean; showDivider?: boolean }) => {
    const { convertToReadOnly } = usePlateEditor()
    const metadataLabelClassName = `flex items-center gap-2 text-muted-foreground${showApprover ? ' text-sm' : ''}`
    const metadataIconSize = showApprover ? 14 : 16
    const fieldSpacingClassName = showApprover ? 'space-y-1' : 'space-y-3'
    const contentSpacingClassName = 'space-y-3'

    return (
      <div className={contentSpacingClassName}>
        {showName && (
          <div className={fieldSpacingClassName}>
            <div className={metadataLabelClassName}>
              <User size={metadataIconSize} />
              <span>Name</span>
            </div>
            <p>{node.name}</p>
          </div>
        )}

        {showApprover && node.approver && (
          <div className={fieldSpacingClassName}>
            <div className={metadataLabelClassName}>
              <User size={metadataIconSize} />
              <span>Approver</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar entity={node.approver as Group} variant="small" className="h-4 w-4 text-xs" />
              <span>{node.approver.displayName}</span>
            </div>
          </div>
        )}

        <div className={fieldSpacingClassName}>
          <div className={metadataLabelClassName}>
            <Clock size={metadataIconSize} />
            <span>Type</span>
          </div>
          <p>{node.procedureKindName || 'Procedure'}</p>
        </div>

        <div className={fieldSpacingClassName}>
          <div className={metadataLabelClassName}>
            <AlignLeft size={metadataIconSize} />
            <span>Description</span>
          </div>
          <div className="min-h-5">{convertToReadOnly(node.detailsJSON ? node.detailsJSON : (node.details ?? ''))}</div>
        </div>

        {showDivider && <hr className="border-border mt-4" />}
      </div>
    )
  },
)

ProcedureItem.displayName = 'ProcedureItem'

const LinkedProcedures: React.FC<LinkedProceduresProps> = ({ procedures }) => {
  const nodes = procedures?.flatMap((edge) => (edge?.node ? [edge.node] : [])) ?? []

  if (nodes.length === 0) {
    return <p className="text-muted-foreground py-4">No procedures linked to this policy.</p>
  }

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-xl font-semibold">Linked Procedures</h2>
      {nodes.length === 1 ? (
        <ProcedureItem node={nodes[0]} />
      ) : (
        <Accordion type="multiple" className="w-full space-y-2">
          {nodes.map((node) => (
            <AccordionItem key={node.id} value={node.id} className="rounded-lg border border-border px-4">
              <AccordionTrigger asChild>
                <button className="group flex w-full items-center justify-between gap-4 py-3 text-left">
                  <div className="flex min-w-0 items-center gap-2">
                    <ChevronDown className="h-4 w-4 shrink-0 text-primary transition-transform group-data-[state=closed]:-rotate-90" />
                    <span className="truncate font-medium">{node.name}</span>
                  </div>
                  {node.status && <DocumentStatusBadge status={node.status} />}
                </button>
              </AccordionTrigger>
              <AccordionContent className="overflow-hidden pb-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <ProcedureItem node={node} showName={false} showApprover showDivider={false} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

export default memo(LinkedProcedures)
