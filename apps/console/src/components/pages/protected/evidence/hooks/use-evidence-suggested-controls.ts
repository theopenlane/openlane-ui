import { useMemo, useState } from 'react'
import { useGetAllMappedControlsGrouped } from '@/lib/graphql-hooks/mapped-control'
import { useGetExistingOrgControls } from '@/lib/graphql-hooks/control'
import { useGetExistingOrgSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { buildWhere, type CustomEvidenceControl, flattenAndFilterControls } from '../evidence-sheet-config'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export type SuggestedControl = {
  id: string
  refCode: string
  referenceFramework: string | null
  source: string
  typeName: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
}

type UseEvidenceSuggestedControlsArgs = {
  evidenceControls: CustomEvidenceControl[] | null
  evidenceSubcontrols: CustomEvidenceControl[] | null
  enabled?: boolean
}

type SuggestionSeed = {
  controls: CustomEvidenceControl[] | null
  subcontrols: CustomEvidenceControl[] | null
  hadLinkedControls: boolean
}

export const useEvidenceSuggestedControls = ({ evidenceControls, evidenceSubcontrols, enabled = true }: UseEvidenceSuggestedControlsArgs) => {
  const hasLinkedControls = (evidenceControls?.length ?? 0) + (evidenceSubcontrols?.length ?? 0) > 0
  const [seed, setSeed] = useState<SuggestionSeed | null>(null)
  const shouldReseed = seed === null || seed.hadLinkedControls !== hasLinkedControls

  if (!enabled) {
    if (seed !== null) setSeed(null)
  } else if (shouldReseed) {
    setSeed({ controls: evidenceControls, subcontrols: evidenceSubcontrols, hadLinkedControls: hasLinkedControls })
  }

  const where = useMemo(() => (seed ? buildWhere(seed.controls, seed.subcontrols) : undefined), [seed])

  const { mappedControlEdges, isLoading: isMappedLoading } = useGetAllMappedControlsGrouped({
    where,
    enabled: enabled && !!where,
    pageSize: 100,
  })

  const suggestions = useMemo(() => {
    if (!seed) return []

    return flattenAndFilterControls(mappedControlEdges, seed.controls, seed.subcontrols).map((item) => ({
      id: item.id,
      refCode: item.refCode,
      referenceFramework: item.referenceFramework ?? null,
      source: item.source ?? '',
      typeName: item.type,
    }))
  }, [mappedControlEdges, seed])

  const controlRefCodes = useMemo(() => Array.from(new Set(suggestions.filter((s) => s.typeName === ObjectTypes.CONTROL).map((s) => s.refCode))), [suggestions])

  const subcontrolRefCodes = useMemo(() => Array.from(new Set(suggestions.filter((s) => s.typeName === ObjectTypes.SUBCONTROL).map((s) => s.refCode))), [suggestions])

  const { data: orgControls, isLoading: isOrgControlsLoading } = useGetExistingOrgControls({
    refCodeIn: controlRefCodes,
    enabled: enabled && controlRefCodes.length > 0,
  })

  const { data: orgSubcontrols, isLoading: isOrgSubcontrolsLoading } = useGetExistingOrgSubcontrols({
    refCodeIn: subcontrolRefCodes,
    enabled: enabled && subcontrolRefCodes.length > 0,
  })

  const orgControlSet = useMemo(() => {
    const set = new Set<string>()
    orgControls?.controls?.edges?.forEach((edge) => {
      const node = edge?.node
      if (node) set.add(`${node.refCode}::${node.referenceFramework ?? 'CUSTOM'}`)
    })
    return set
  }, [orgControls])

  const orgSubcontrolSet = useMemo(() => {
    const set = new Set<string>()
    orgSubcontrols?.subcontrols?.edges?.forEach((edge) => {
      const node = edge?.node
      if (node) set.add(`${node.refCode}::${node.referenceFramework ?? 'CUSTOM'}`)
    })
    return set
  }, [orgSubcontrols])

  const suggestedControlsMap = useMemo<SuggestedControl[]>(() => {
    if (!suggestions.length) return []

    const filtered = suggestions.filter((item) => {
      const key = `${item.refCode}::${item.referenceFramework ?? 'CUSTOM'}`
      if (item.typeName === ObjectTypes.CONTROL) return orgControlSet.has(key)
      if (item.typeName === ObjectTypes.SUBCONTROL) return orgSubcontrolSet.has(key)
      return false
    })

    return Array.from(new Map(filtered.map((item) => [item.id, item])).values())
  }, [suggestions, orgControlSet, orgSubcontrolSet])

  const isLoading = enabled && !!where && (isMappedLoading || (controlRefCodes.length > 0 && isOrgControlsLoading) || (subcontrolRefCodes.length > 0 && isOrgSubcontrolsLoading))

  return { suggestedControlsMap, isLoading }
}
