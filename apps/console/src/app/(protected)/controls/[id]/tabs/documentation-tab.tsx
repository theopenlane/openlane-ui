import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import ObjectAssociationChip from '@/components/shared/objectAssociation/object-association-chip.tsx'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import type { NormalizedObject } from '@/utils/getHrefForObjectType'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConnectionType = { edges?: ({ node?: Record<string, any> | null } | null)[] | null } | null

interface DocumentationTabProps {
  procedures?: ConnectionType
  internalPolicies?: ConnectionType
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeObjectNode = (node: Record<string, any> | null | undefined): NormalizedObject | null => {
  if (!node?.id) return null
  return {
    id: node.id,
    refCode: node.refCode ?? undefined,
    controlId: node.controlId ?? undefined,
    name: node.name ?? undefined,
    title: node.title ?? undefined,
    description: node.description ?? undefined,
    summary: node.summary ?? undefined,
    details: node.details ?? undefined,
    standardID: node.standardID ?? undefined,
    control: node.control ?? undefined,
  }
}

const renderAssociationSection = (title: string, kind: string, connection?: ConnectionType) => {
  const rows = (connection?.edges ?? []).map((edge) => normalizeObjectNode(edge?.node)).filter((node): node is NormalizedObject => !!node)
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      {rows.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {rows.map((row) => (
            <ObjectAssociationChip
              key={row.id}
              kind={kind}
              object={{
                id: row.id,
                refCode: row.refCode,
                name: row.name,
                title: row.title,
                description: row.description,
                summary: row.summary,
                details: row.details,
                link: getHrefForObjectType(kind, row),
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No {title.toLowerCase()} linked.</p>
      )}
    </Card>
  )
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ procedures, internalPolicies }) => {
  return (
    <div className="space-y-6">
      {renderAssociationSection('Procedures', 'procedures', procedures)}
      {renderAssociationSection('Internal Policies', 'policies', internalPolicies)}
    </div>
  )
}

export default DocumentationTab
