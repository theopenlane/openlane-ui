import { useMemo } from 'react'
import { useSlaDefinitionsWithFilter } from '@/lib/graphql-hooks/sla-definition'
import { buildSlaDaysByLevel, buildDueSoonCondition, buildPastDueCondition, type SlaDaysByLevel, type TSlaSourceDateField } from '@/lib/sla'
import { type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'

export const useSlaDaysByLevel = (): SlaDaysByLevel => {
  const { slaDefinitionsNodes } = useSlaDefinitionsWithFilter({})
  return useMemo(() => buildSlaDaysByLevel(slaDefinitionsNodes), [slaDefinitionsNodes])
}

export const useSlaQuickFilters = (sourceDateField?: TSlaSourceDateField): TQuickFilter[] => {
  const slaDaysByLevel = useSlaDaysByLevel()
  return useMemo(() => {
    if (Object.keys(slaDaysByLevel).length === 0) return []
    return [
      { label: 'Past Due', key: 'pastDue', type: 'custom', getCondition: () => buildPastDueCondition(slaDaysByLevel, sourceDateField), isActive: false },
      { label: 'Due Soon', key: 'dueSoon', type: 'custom', getCondition: () => buildDueSoonCondition(slaDaysByLevel, sourceDateField), isActive: false },
    ]
  }, [slaDaysByLevel, sourceDateField])
}
