'use client'

import { useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { fetchExampleCSV } from '@/lib/export'

export const exampleCsvFilename = (entityType: ObjectTypes): string => entityType.toLowerCase()

export const useExampleCSV = (entityType: ObjectTypes, enabled = true) => {
  const filename = exampleCsvFilename(entityType)

  const query = useQuery({
    queryKey: ['example-csv', filename],
    queryFn: () => fetchExampleCSV({ filename }),
    enabled,
    staleTime: 60 * 60 * 1000, // 1hr
  })

  return { ...query, filename, isLoadingExample: enabled && (query.isPending || query.isPlaceholderData) }
}
