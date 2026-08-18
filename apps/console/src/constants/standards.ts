import { type ControlWhereInput, type StandardWhereInput } from '@repo/codegen/src/schema'

export type TSystemStandard = {
  shortName: string
  framework: string
  refCodePrefix?: string
}

export const OPENLANE_BASELINE_STANDARD = {
  shortName: 'OL Baseline',
  framework: 'openlane-standard',
  refCodePrefix: 'OL-',
} as const satisfies TSystemStandard

export const OPENLANE_TRUST_CENTER_STANDARD = {
  shortName: 'OTS',
  framework: 'openlane-trust-center',
} as const satisfies TSystemStandard

const OPENLANE_SYSTEM_STANDARDS = [OPENLANE_BASELINE_STANDARD, OPENLANE_TRUST_CENTER_STANDARD]

export const OPENLANE_SYSTEM_FRAMEWORKS = OPENLANE_SYSTEM_STANDARDS.map((systemStandard) => systemStandard.framework)

const OPENLANE_SYSTEM_STANDARD_SHORT_NAMES = OPENLANE_SYSTEM_STANDARDS.map((systemStandard) => systemStandard.shortName)

export const EXCLUDE_SYSTEM_STANDARDS_WHERE: StandardWhereInput = {
  or: [{ frameworkIsNil: true }, { frameworkNotIn: OPENLANE_SYSTEM_FRAMEWORKS }],
}

export const EXCLUDE_SYSTEM_FRAMEWORK_CONTROLS_WHERE: ControlWhereInput = {
  or: [{ referenceFrameworkIsNil: true }, { referenceFrameworkNotIn: OPENLANE_SYSTEM_STANDARD_SHORT_NAMES }],
}

export const ORG_MANAGED_CONTROLS_WHERE: ControlWhereInput = {
  and: [{ isTrustCenterControl: false }, { or: [{ systemOwned: false }, { systemOwnedIsNil: true }] }, EXCLUDE_SYSTEM_FRAMEWORK_CONTROLS_WHERE],
}

export const isSystemStandardRecord = ({ systemOwned, framework }: { systemOwned?: boolean | null; framework?: string | null }): boolean =>
  Boolean(systemOwned && framework && OPENLANE_SYSTEM_FRAMEWORKS.some((systemFramework) => systemFramework === framework))
