'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@repo/ui/button'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import { toValidHref } from '@/utils/normalizeUrl'
import { getExposureSourceRows, type TExposureSourceFields, type TSourceDetailRow, useExposureSource } from './use-exposure-source'

type TExposureSourceDetailsProps = {
  fields: TExposureSourceFields
  header?: React.ReactNode
  extraRows?: TSourceDetailRow[]
  footer?: React.ReactNode
}

const SourceDetailRow: React.FC<{ row: TSourceDetailRow }> = ({ row }) => {
  const value = row.value?.trim()
  if (!value) return null

  return (
    <div className="space-y-1 border-b py-2.5 last:border-b-0">
      <p className="text-xs text-muted-foreground">{row.label}</p>
      {row.copyable ? <CopyableText value={value} variant="inline" aria-label={`Copy ${row.label}`} className="font-mono text-sm" /> : <p className="font-mono text-sm break-all">{value}</p>}
    </div>
  )
}

export const ExposureSourceDetails: React.FC<TExposureSourceDetailsProps> = ({ fields, header, extraRows = [], footer }) => {
  const { label, openLabel } = useExposureSource(fields)
  const href = toValidHref(fields.externalURI?.trim() ?? '')

  const rows = getExposureSourceRows(fields, extraRows)

  return (
    <div className="space-y-3">
      {header ?? <p className="text-base font-semibold">{label ?? 'Source'}</p>}
      <div>
        {rows.map((row) => (
          <SourceDetailRow key={row.label} row={row} />
        ))}
      </div>
      {href && (
        <Button asChild variant="secondary" className="w-full gap-1.5">
          <a href={href} target="_blank" rel="noreferrer">
            {openLabel}
            <ExternalLink size={14} />
          </a>
        </Button>
      )}
      {footer}
    </div>
  )
}
