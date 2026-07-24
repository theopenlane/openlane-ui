'use client'

import { useMemo } from 'react'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { getEdgeNodes } from '@/components/shared/object-association/utils'

export const useControlReviewContext = (controlId: string, enabled: boolean) => {
  const { data } = useGetControlById(enabled ? controlId : null)

  const control = data?.control
  const evidenceItems = useMemo(() => getEdgeNodes(control?.evidence?.edges), [control])

  return { control, evidenceItems }
}
