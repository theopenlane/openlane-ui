import { useMemo } from 'react'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { useGetExistingOrgControls } from '@/lib/graphql-hooks/control'
import { useGetExistingOrgSubcontrols } from '@/lib/graphql-hooks/subcontrol'
import { buildWhere, type CustomEvidenceControl, flattenAndFilterControls } from '../evidence-sheet-config'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type SuggestedControl = {
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

export const useEvidenceSuggestedControls = ({ evidenceControls, evidenceSubcontrols, enabled = true }: UseEvidenceSuggestedControlsArgs) => {
  const where = useMemo(() => buildWhere(evidenceControls, evidenceSubcontrols), [evidenceControls, evidenceSubcontrols])

  const { data: mappedControls, isLoading: isMappedLoading } = useGetMappedControls({
    where: where,
    enabled: enabled && !!where,
  })

  const suggestions = useMemo(() => {
    if (!mappedControls) return []
    return flattenAndFilterControls(mappedControls, evidenceControls, evidenceSubcontrols).map((item) => ({
      id: item.id,
      refCode: item.refCode,
      referenceFramework: item.referenceFramework ?? null,
      source: item.source ?? '',
      typeName: item.type,
    }))
  }, [mappedControls, evidenceControls, evidenceSubcontrols])

  const controlRefCodes = useMemo(() => Array.from(new Set(suggestions.filter((s) => s.typeName === ObjectTypes.CONTROL && s.referenceFramework).map((s) => s.refCode))), [suggestions])

  const subcontrolRefCodes = useMemo(() => Array.from(new Set(suggestions.filter((s) => s.typeName === ObjectTypes.SUBCONTROL && s.referenceFramework).map((s) => s.refCode))), [suggestions])

  const controlFrameworks = useMemo(
    () => Array.from(new Set(suggestions.filter((s) => s.typeName === ObjectTypes.CONTROL && s.referenceFramework).map((s) => s.referenceFramework as string))),
    [suggestions],
  )

  const subcontrolFrameworks = useMemo(
    () => Array.from(new Set(suggestions.filter((s) => s.typeName === ObjectTypes.SUBCONTROL && s.referenceFramework).map((s) => s.referenceFramework as string))),
    [suggestions],
  )

  const { data: orgControls, isLoading: isOrgControlsLoading } = useGetExistingOrgControls({
    refCodeIn: controlRefCodes,
    referenceFrameworkIn: controlFrameworks,
    enabled: enabled && controlRefCodes.length > 0,
  })

  const { data: orgSubcontrols, isLoading: isOrgSubcontrolsLoading } = useGetExistingOrgSubcontrols({
    refCodeIn: subcontrolRefCodes,
    referenceFrameworkIn: subcontrolFrameworks,
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
      if (!item.referenceFramework) return false

      const key = `${item.refCode}::${item.referenceFramework}`
      if (item.typeName === ObjectTypes.CONTROL) return orgControlSet.has(key)
      if (item.typeName === ObjectTypes.SUBCONTROL) return orgSubcontrolSet.has(key)
      return false
    })

    return Array.from(new Map(filtered.map((item) => [item.id, item])).values())
  }, [suggestions, orgControlSet, orgSubcontrolSet])

  const isLoading = enabled && !!where && (isMappedLoading || (controlRefCodes.length > 0 && isOrgControlsLoading) || (subcontrolRefCodes.length > 0 && isOrgSubcontrolsLoading))

  return { suggestedControlsMap, isLoading }
}
