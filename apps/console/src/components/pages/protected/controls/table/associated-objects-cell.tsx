import React from 'react'
import { Badge } from '@repo/ui/badge'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'

const ASSOCIATION_BADGES = [
  { key: 'procedures', label: 'Procedures', nameField: 'name' },
  { key: 'internalPolicies', label: 'Policies', nameField: 'name' },
  { key: 'programs', label: 'Programs', nameField: 'name' },
  { key: 'risks', label: 'Risks', nameField: 'name' },
  { key: 'tasks', label: 'Tasks', nameField: 'title' },
] as const

interface AssociatedObjectsCellProps {
  control: ControlListFieldsFragment
}

const AssociatedObjectsCell: React.FC<AssociatedObjectsCellProps> = ({ control }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {ASSOCIATION_BADGES.map(({ key, label, nameField }) => {
        const association = control[key]
        const count = association?.totalCount ?? 0

        if (count === 0) return null
        const names =
          association?.edges
            ?.map((edge) => {
              const node = edge?.node
              if (!node) return null
              return (node as Record<string, unknown>)[nameField] as string
            })
            .filter(Boolean) || []

        const tooltipContent = (
          <div className="flex flex-col gap-1">
            <p className="font-bold border-b pb-1 mb-1">{label}</p>
            {names.length > 0 ? (
              <ul className="list-disc pl-4">
                {names.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            ) : (
              <p>No details available</p>
            )}
            {count > names.length && <p className="text-xs italic mt-1 text-muted-foreground">+ {count - names.length} more...</p>}
          </div>
        )

        return (
          <SystemTooltip
            key={key}
            side="top"
            icon={
              <Badge className="cursor-help">
                {label}: {count}
              </Badge>
            }
            content={tooltipContent}
          />
        )
      })}
    </div>
  )
}

export default AssociatedObjectsCell
