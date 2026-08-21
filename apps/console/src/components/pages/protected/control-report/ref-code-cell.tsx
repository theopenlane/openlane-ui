'use client'

import React from 'react'
import Link from 'next/link'
import { TruncatedCell } from '@repo/ui/data-table'
import { cn } from '@repo/ui/lib/utils'
import { type ControlControlStatus } from '@repo/codegen/src/schema'
import { CONTROL_STATUS_STYLES } from '@/components/shared/enum-mapper/control-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type RefCodeCellProps = {
  href: string
  refCode: string
  status?: ControlControlStatus | null
  className?: string
}

const RefCodeCell: React.FC<RefCodeCellProps> = ({ href, refCode, status, className }) => {
  const statusStyle = status ? CONTROL_STATUS_STYLES[status] : null

  return (
    <div className={cn('min-w-0 text-sm font-medium', className)} onClick={(e) => e.stopPropagation()}>
      <TruncatedCell portal tooltipContent={refCode}>
        <Link href={href} className="text-brand hover:underline">
          {refCode}
        </Link>
      </TruncatedCell>
      {statusStyle && (
        <span className="mt-1 block w-fit max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
          {getEnumLabel(status ?? undefined)}
        </span>
      )}
    </div>
  )
}

export default React.memo(RefCodeCell)
