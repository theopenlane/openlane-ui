export type CustomEvidenceControl = { __typename?: string; id: string; referenceFramework?: string | null; refCode: string }
type CustomEvidenceGroupedItems = {
  refCode: string
  referenceFramework: string | null
}

export type RefFrameworkGroup = Record<string, CustomEvidenceGroupedItems[]>

export const groupItemsByReferenceFramework = (items: CustomEvidenceControl[] | null): RefFrameworkGroup => {
  if (!items) return {}

  return items.reduce<RefFrameworkGroup>((acc, item) => {
    const key = item.referenceFramework ?? 'CUSTOM'

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push({
      refCode: item.refCode,
      referenceFramework: item.referenceFramework ?? null,
    })

    return acc
  }, {} as RefFrameworkGroup)
}

export const buildOr = (groups: RefFrameworkGroup) => {
  return Object.entries(groups).map(([referenceFramework, items]) => {
    const refCodes = items.map((i) => i.refCode)
    if (referenceFramework === 'CUSTOM') {
      return { refCodeIn: refCodes, referenceFrameworkIsNil: true }
    }
    return { refCodeIn: refCodes, referenceFramework }
  })
}
