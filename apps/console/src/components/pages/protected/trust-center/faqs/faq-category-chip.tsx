'use client'

import { CustomTypeEnumOptionChip } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { objectToSnakeCase } from '@/utils/strings'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const FaqCategoryChip = ({ categoryName }: { categoryName?: string | null }) => {
  const { enumOptions } = useCreatableEnumOptions({
    objectType: objectToSnakeCase(ObjectTypes.TRUST_CENTER_FAQ),
    field: 'kind',
  })

  if (!categoryName) return null

  const option = enumOptions.find((enumOption) => enumOption.value === categoryName) ?? { value: categoryName, label: categoryName }

  return (
    <div className="mb-1 w-fit">
      <CustomTypeEnumOptionChip option={option} />
    </div>
  )
}
