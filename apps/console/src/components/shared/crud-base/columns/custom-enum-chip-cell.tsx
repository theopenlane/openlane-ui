'use client'

import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

interface CustomEnumChipCellProps {
  value?: string | null
  objectType?: string
  field: string
}

export const CustomEnumChipCell = ({ value, objectType, field }: CustomEnumChipCellProps) => {
  const { enumOptions } = useCreatableEnumOptions({ objectType, field })
  return <CustomTypeEnumValue value={value ?? undefined} options={enumOptions} placeholder="-" />
}
