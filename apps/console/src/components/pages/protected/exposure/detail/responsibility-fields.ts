export type TExposureResponsibilityKey = 'internalOwner' | 'assignedTo' | 'reviewedBy'

export const EXPOSURE_RESPONSIBILITY_FIELDS: readonly { key: TExposureResponsibilityKey; label: string }[] = [
  { key: 'internalOwner', label: 'Owner' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'reviewedBy', label: 'Reviewed by' },
]
