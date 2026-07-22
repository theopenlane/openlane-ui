export const PROGRAM_KIND = {
  FRAMEWORK: 'Framework',
  GAP_ANALYSIS: 'Gap Analysis',
} as const

export type ProgramKindName = (typeof PROGRAM_KIND)[keyof typeof PROGRAM_KIND]
