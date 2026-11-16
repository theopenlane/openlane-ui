'use client'

import { createOrgPersistedStore, parseStringUnion, useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { useOrganization } from '@/hooks/useOrganization'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { isOneOf } from '@/utils/type-guards'

const DISPLAY_STATES = ['expanded', 'collapsed'] as const

type TVendorScoringDisplay = (typeof DISPLAY_STATES)[number]

const isDisplayState = isOneOf(DISPLAY_STATES)

const vendorScoringDisplayStore = createOrgPersistedStore<TVendorScoringDisplay>(
  'vendor-scoring-summary',
  (raw) => parseStringUnion(raw, isDisplayState),
  () => 'expanded',
)

const VENDOR_SCORING_PARAM = 'scoring'

export const useVendorScoringDisplay = () => {
  const { currentOrgId } = useOrganization()
  const { value, isHydrated, setValue } = useOrgPersistedState(vendorScoringDisplayStore, currentOrgId)
  const searchParams = useSearchParams()
  const { replace } = useSmartRouter()

  const collapse = useCallback(() => setValue('collapsed'), [setValue])
  const expand = useCallback(() => setValue('expanded'), [setValue])
  const openConfiguration = useCallback(() => replace({ [VENDOR_SCORING_PARAM]: 'configure' }), [replace])
  const closeConfiguration = useCallback(() => replace({ [VENDOR_SCORING_PARAM]: null }), [replace])

  return {
    isExpanded: isHydrated && value === 'expanded',
    isCollapsed: isHydrated && value === 'collapsed',
    collapse,
    expand,
    isConfigurationOpen: searchParams.get(VENDOR_SCORING_PARAM) === 'configure',
    openConfiguration,
    closeConfiguration,
  }
}
