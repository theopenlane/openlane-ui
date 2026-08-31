export interface BuildControlEntityInputArgs {
  data: Record<string, unknown>
  associationKeys: Set<string>
  description?: string
  descriptionJSON?: unknown
}

export const stripAssociationKeys = (data: Record<string, unknown>, associationKeys: Set<string>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(data).filter(([key]) => !associationKeys.has(key)))

export const emptyToUndefined = (value: unknown): unknown => (value === '' || value === null ? undefined : value)

export const buildControlEntityInput = ({ data, associationKeys, description, descriptionJSON }: BuildControlEntityInputArgs): Record<string, unknown> => ({
  ...stripAssociationKeys(data, associationKeys),
  description,
  descriptionJSON,
  referenceID: emptyToUndefined(data.referenceID),
  auditorReferenceID: emptyToUndefined(data.auditorReferenceID),
})
