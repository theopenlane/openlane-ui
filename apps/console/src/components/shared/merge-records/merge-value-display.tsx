'use client'

import React from 'react'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeFieldConfig } from './types'
import { isEmptyValue } from './use-merge-resolution'

type Props<TRecord> = {
  field: MergeFieldConfig<TRecord>
  value: unknown
}

export const MergeValueDisplay = <TRecord,>({ field, value }: Props<TRecord>) => {
  if (field.render) return <>{field.render(value)}</>
  if (isEmptyValue(value)) return <span className="text-muted-foreground italic">Empty</span>

  switch (field.type) {
    case 'tags':
      return <TagsCell tags={Array.isArray(value) ? (value as string[]) : []} />
    case 'date':
      return <DateCell value={typeof value === 'string' ? value : null} />
    case 'boolean':
      return <BooleanCell value={typeof value === 'boolean' ? value : null} />
    case 'customEnum':
      return <CustomEnumChipCell value={String(value)} objectType={field.customEnum?.objectType} field={field.customEnum?.field ?? ''} />
    case 'enum': {
      const str = String(value)
      const matched = field.enumOptions?.find((o) => o.value === str)
      return <span>{matched?.label ?? getEnumLabel(str)}</span>
    }
    case 'map': {
      if (value && typeof value === 'object') {
        return <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded p-2 max-h-40 overflow-auto">{JSON.stringify(value, null, 2)}</pre>
      }
      return <>-</>
    }
    case 'number':
      return <span>{String(value)}</span>
    case 'longText':
      return <span className="whitespace-pre-wrap text-sm">{String(value)}</span>
    case 'text':
    default:
      return <span>{String(value)}</span>
  }
}
