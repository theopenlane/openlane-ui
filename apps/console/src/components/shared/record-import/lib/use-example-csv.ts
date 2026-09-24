'use client'

import { useQuery } from '@tanstack/react-query'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { fetchExampleCSV } from '@/lib/export'

export const useExampleCSV = (entityType: ObjectTypes) => {
  const filename = entityType.toLowerCase()

  const query = useQuery({
    queryKey: ['example-csv', filename],
    queryFn: () => fetchExampleCSV({ filename }),
    staleTime: 60 * 60 * 1000, // 1hr
  })

  return { ...query, filename, isLoadingExample: query.isPending || query.isPlaceholderData }
}
