'use client'

import React from 'react'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { resolveAuthor } from '@/lib/authors'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { type TRemediation } from './remediation-context'
import RemediationStatusField, { type TRemediationStatusFieldProps } from './remediation-status-field'

type TRemediationMetaProps = { remediation: TRemediation } & Pick<TRemediationStatusFieldProps, 'onStatusChange'>

const RemediationMeta: React.FC<TRemediationMetaProps> = ({ remediation, onStatusChange }) => {
  const { authorMaps } = useAuthorMaps([remediation.createdBy])
  const author = remediation.createdBy ? resolveAuthor(remediation.createdBy, authorMaps) : undefined

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <RemediationStatusField status={remediation.status} onStatusChange={onStatusChange} />
      {author && author.kind !== 'unknown' ? <span>Created by {author.displayName}</span> : null}
      {remediation.createdAt ? (
        <span className="flex items-center gap-1">
          on <DateCell value={remediation.createdAt} />
        </span>
      ) : null}
    </div>
  )
}

export default RemediationMeta
