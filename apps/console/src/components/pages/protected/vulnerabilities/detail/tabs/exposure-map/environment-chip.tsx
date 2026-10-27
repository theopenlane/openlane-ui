'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumOptionChip } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

export const EnvironmentChip: React.FC<{ environment: string; suffix?: string }> = ({ environment, suffix }) => {
  const { enumOptions } = useCreatableEnumOptions({ field: 'environment' })
  const option = enumOptions.find((candidate) => candidate.value === environment)

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {option ? (
        <CustomTypeEnumOptionChip option={option} />
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          {environment}
        </Badge>
      )}
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </span>
  )
}
