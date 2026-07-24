type TSystemStandard = {
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
