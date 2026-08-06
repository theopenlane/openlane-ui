import { type StandardWhereInput } from '@repo/codegen/src/schema'

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

export const OPENLANE_SYSTEM_FRAMEWORKS = [OPENLANE_BASELINE_STANDARD.framework, OPENLANE_TRUST_CENTER_STANDARD.framework]

export const EXCLUDE_SYSTEM_STANDARDS_WHERE: StandardWhereInput = {
  or: [{ frameworkIsNil: true }, { frameworkNotIn: OPENLANE_SYSTEM_FRAMEWORKS }],
}

export const isSystemStandardRecord = ({ systemOwned, framework }: { systemOwned?: boolean | null; framework?: string | null }): boolean =>
  Boolean(systemOwned && framework && OPENLANE_SYSTEM_FRAMEWORKS.some((systemFramework) => systemFramework === framework))
