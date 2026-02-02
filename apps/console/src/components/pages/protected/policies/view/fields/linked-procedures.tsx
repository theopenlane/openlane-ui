import React, { memo } from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { GetInternalPolicyAssociationsByIdQuery } from '@repo/codegen/src/schema.ts'
import { AlignLeft, Clock, User } from 'lucide-react'

type ProcedureEdges = NonNullable<NonNullable<GetInternalPolicyAssociationsByIdQuery['internalPolicy']>['procedures']>['edges']

type LinkedProceduresProps = {
  procedures: ProcedureEdges
}

type ProcedureNode = NonNullable<NonNullable<ProcedureEdges>[number]>['node']

const ProcedureItem = memo(({ node }: { node: NonNullable<ProcedureNode> }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      <User size={16} />
      <span>Name</span>
    </div>
    <p>{node.name}</p>

    <div className="flex items-center gap-2 text-muted-foreground">
      <Clock size={16} />
      <span>Type</span>
    </div>
    <p>{node.procedureKindName || 'Procedure'}</p>

    <div className="flex items-center gap-2 text-muted-foreground">
      <AlignLeft size={16} />
      <span>Description</span>
    </div>
    <div className="min-h-5">
      <PlateEditor initialValue={node.detailsJSON ? node.detailsJSON : node.details ?? undefined} readonly={true} variant="basic" />
    </div>

    <hr className="border-border mt-4" />
  </div>
))

ProcedureItem.displayName = 'ProcedureItem'

const LinkedProcedures: React.FC<LinkedProceduresProps> = ({ procedures }) => {
  if (!procedures || procedures.length === 0) {
    return <p className="text-muted-foreground py-4">No procedures linked to this policy.</p>
  }

  return (
    <div className="space-y-6 py-4">
      <h2 className="text-xl font-semibold">Linked Procedures</h2>
      {procedures.map((edge) => {
        const node = edge?.node
        if (!node) return null
        return <ProcedureItem key={node.id} node={node} />
      })}
    </div>
  )
}

export default memo(LinkedProcedures)
