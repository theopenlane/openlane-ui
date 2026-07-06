'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { type IntegrationOperationMetadata } from '@/lib/integrations/types'

const PERMISSIONS_PREVIEW_COUNT = 3

const PermissionsList = ({ permissions }: { permissions: string[] }) => {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? permissions : permissions.slice(0, PERMISSIONS_PREVIEW_COUNT)
  const hidden = permissions.length - PERMISSIONS_PREVIEW_COUNT

  return (
    <ul className="space-y-1">
      {visible.map((perm) => (
        <li key={perm}>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{perm}</code>
        </li>
      ))}
      {hidden > 0 && (
        <li>
          <button type="button" onClick={() => setExpanded((prev) => !prev)} className="text-xs hover:underline">
            {expanded ? 'see less' : `...${hidden} more`}
          </button>
        </li>
      )}
    </ul>
  )
}

type OperationsTableProps = {
  operations: IntegrationOperationMetadata[]
}

const OperationsTable = ({ operations }: OperationsTableProps) => {
  if (operations.length === 0) {
    return null
  }

  const hasPermissions = operations.some((op) => op.requiredPermissions && op.requiredPermissions.length > 0)

  return (
    <section className="mb-8">
      <h3 className="text-base uppercase tracking-widest">Supported Operations</h3>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">
        These are the things the integration is capable of performing - we will add to them over time! Something you think we&apos;re missing?{' '}
        <a href="https://github.com/orgs/theopenlane/discussions/new?category=ideas" target="_blank" rel="noopener noreferrer" className="text-info underline hover:opacity-80">
          Let us know
        </a>
      </p>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Operation</th>
              <th className="px-4 py-2 text-left font-medium">Description</th>
              {hasPermissions ? <th className="px-4 py-2 text-left font-medium">Required Permissions</th> : null}
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.name} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs align-top">{op.name}</td>
                <td className="px-4 py-2 text-muted-foreground align-top">
                  <div className="flex items-center gap-2">
                    <span>{op.description ?? ''}</span>
                    {op.disabledForAll ? (
                      <Badge variant="blue" className="text-[10px]">
                        Coming Soon
                      </Badge>
                    ) : null}
                  </div>
                </td>
                {hasPermissions ? (
                  <td className="px-4 py-2 align-top">
                    {op.requiredPermissions && op.requiredPermissions.length > 0 ? <PermissionsList permissions={op.requiredPermissions} /> : <span className="text-muted-foreground">—</span>}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default OperationsTable
