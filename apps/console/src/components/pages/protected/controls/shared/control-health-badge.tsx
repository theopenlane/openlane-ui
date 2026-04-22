'use client'

import React from 'react'
import { Circle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ControlHealthControlCheckStatus, ControlHealthOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useControlHealthsWithFilter } from '@/lib/graphql-hooks/control-health'

type Props = {
  externalUUID?: string | null
}

const healthColorMap: Record<ControlHealthControlCheckStatus, string> = {
  [ControlHealthControlCheckStatus.COMPLIANT]: 'text-green-500',
  [ControlHealthControlCheckStatus.NOT_COMPLIANT]: 'text-red-500',
  [ControlHealthControlCheckStatus.UNKNOWN]: 'text-gray-400',
}

const ControlHealthBadge: React.FC<Props> = ({ externalUUID }) => {
  const { controlHealthsNodes } = useControlHealthsWithFilter({
    where: externalUUID ? { parentExternalID: externalUUID } : undefined,
    orderBy: [{ field: ControlHealthOrderField.observed_at, direction: OrderDirection.DESC }],
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
    enabled: !!externalUUID,
  })

  const latest = controlHealthsNodes[0]

  if (!latest || latest.checkStatus === ControlHealthControlCheckStatus.UNKNOWN) {
    return null
  }

  const colorClass = healthColorMap[latest.checkStatus] ?? 'text-gray-400'

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">Control Health</p>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Circle size={10} className={colorClass} fill="currentColor" />
          <span className="text-sm">{getEnumLabel(latest.checkStatus)}</span>
        </div>
        {latest.externalURI && (
          <Link href={latest.externalURI} className="size-fit pl-3 hover:underline flex items-center gap-1 text-sm text-primary" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
            Latest Result <ExternalLink size={12} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default ControlHealthBadge
