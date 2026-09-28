'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Callout } from '@/components/shared/callout/callout'
import { pluralizeWithCount } from '@/utils/strings'
import type { TImportIssue } from './lib/types'

type TImportIssuesCalloutProps = {
  issues: TImportIssue[]
  onFix?: (columnIndex: number) => void
}

export const ImportIssuesCallout: React.FC<TImportIssuesCalloutProps> = ({ issues, onFix }) => (
  <Callout variant="danger" title={`${pluralizeWithCount(issues.length, 'issue')} ${issues.length === 1 ? 'blocks' : 'block'} this import`}>
    <ul className="flex flex-col gap-1">
      {issues.map(({ id, message, columnIndex }) => (
        <li key={id} className="flex items-center gap-2">
          <span>• {message}</span>
          {onFix && columnIndex !== undefined && (
            <Button variant="link" className="text-blue-500" onClick={() => onFix(columnIndex)}>
              Fix
            </Button>
          )}
        </li>
      ))}
    </ul>
  </Callout>
)
