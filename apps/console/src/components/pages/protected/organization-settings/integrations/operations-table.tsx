'use client'

import React from 'react'
import { type IntegrationOperationMetadata } from '@/lib/integrations/types'

type OperationsTableProps = {
  operations: IntegrationOperationMetadata[]
}

const OperationsTable = ({ operations }: OperationsTableProps) => {
  if (operations.length === 0) {
    return null
  }

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
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.name} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{op.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{op.description ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default OperationsTable
