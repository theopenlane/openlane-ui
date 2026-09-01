import { type AuditorDashboardRelatedControl } from '@/lib/graphql-hooks/control'

const CUSTOM_FRAMEWORK_LABEL = 'CUSTOM'

const isCustomControl = (related: AuditorDashboardRelatedControl): boolean => !related.referenceFramework || related.referenceFramework === CUSTOM_FRAMEWORK_LABEL

const isInProgramScope = (related: AuditorDashboardRelatedControl, programFrameworks: Set<string>): boolean => isCustomControl(related) || programFrameworks.has(related.referenceFramework ?? '')

const compareForDisplay = (a: AuditorDashboardRelatedControl, b: AuditorDashboardRelatedControl): number =>
  (a.referenceFramework ?? CUSTOM_FRAMEWORK_LABEL).localeCompare(b.referenceFramework ?? CUSTOM_FRAMEWORK_LABEL) || a.refCode.localeCompare(b.refCode) || a.id.localeCompare(b.id)

type GetProgramScopedMappedControlsArgs = {
  relatedControls?: AuditorDashboardRelatedControl[] | null
  controlId: string
  programFrameworks: Set<string>
}

export const getProgramScopedMappedControls = ({ relatedControls, controlId, programFrameworks }: GetProgramScopedMappedControlsArgs): AuditorDashboardRelatedControl[] => {
  const inScope = (relatedControls ?? []).filter((related) => related.id !== controlId && isInProgramScope(related, programFrameworks)).sort(compareForDisplay)

  const byKey = new Map<string, AuditorDashboardRelatedControl>()

  for (const related of inScope) {
    const key = `${related.isSubcontrol ? 'subcontrol' : 'control'}:${related.referenceFramework ?? CUSTOM_FRAMEWORK_LABEL}:${related.refCode}`
    if (!byKey.has(key)) {
      byKey.set(key, related)
    }
  }

  return Array.from(byKey.values())
}
