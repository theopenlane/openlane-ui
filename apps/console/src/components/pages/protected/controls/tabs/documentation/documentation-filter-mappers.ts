import { type InternalPolicyWhereInput, type ProcedureWhereInput } from '@repo/codegen/src/schema'

export const DOCUMENTATION_POLICIES_IGNORED_FILTER_KEYS = ['hasControlsWith', 'hasSubcontrolsWith'] as const

export const mapDocumentationPoliciesFilterKey = (key: string, value: unknown): InternalPolicyWhereInput => {
  if (DOCUMENTATION_POLICIES_IGNORED_FILTER_KEYS.some((ignored) => ignored === key)) {
    return {}
  }

  return { [key]: value }
}

export const mapDocumentationProceduresFilterKey = (key: string, value: unknown): ProcedureWhereInput => {
  if (key === 'hasControlsWith') {
    return { hasControlsWith: [{ refCodeContainsFold: value as string }] }
  }

  if (key === 'hasSubcontrolsWith') {
    return { hasSubcontrolsWith: [{ refCodeContainsFold: value as string }] }
  }

  return { [key]: value }
}
