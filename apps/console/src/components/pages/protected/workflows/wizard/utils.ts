import type { Target, WorkflowDocument, ApprovalTiming } from './types'

export const DEFAULT_VERSION = '1.0'
export const DEFAULT_APPROVAL_TIMING = 'PRE_COMMIT' as const
export const DEFAULT_APPROVAL_SUBMISSION_MODE = 'AUTO_SUBMIT' as const

export const parseDefinitionJSON = (value: unknown): WorkflowDocument => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as WorkflowDocument
    } catch {
      return {}
    }
  }
  return value as WorkflowDocument
}

export const normalizeApprovalTiming = (value?: unknown): ApprovalTiming => {
  if (value === null || value === undefined) return DEFAULT_APPROVAL_TIMING
  const normalized = String(value).toUpperCase()
  return normalized === 'POST_COMMIT' ? 'POST_COMMIT' : 'PRE_COMMIT'
}

export const isPlaceholderValue = (value?: string | null) => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized.includes('replace') || normalized.includes('<') || normalized.includes('>')
}

export const buildConditionExpression = ({
  enabled,
  useCel,
  field,
  operator,
  value,
  celExpression,
}: {
  enabled: boolean
  useCel: boolean
  field: string
  operator: 'eq' | 'neq'
  value: string
  celExpression: string
}) => {
  if (!enabled) return ''
  if (useCel) return celExpression.trim()
  if (!field || !value.trim()) return ''
  const normalizedValue = JSON.stringify(value.trim())
  if (operator === 'neq') return `object.${field} != ${normalizedValue}`
  return `object.${field} == ${normalizedValue}`
}

export const buildTargetKey = (target: Target) => `${target.type}:${target.id ?? target.resolver_key ?? ''}`

export const sanitizeTargets = (targets: Target[]): Target[] =>
  targets.filter((target) => {
    if (target.type === 'RESOLVER') return !isPlaceholderValue(target.resolver_key)
    return !isPlaceholderValue(target.id)
  })

export const formatResolverLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')

export const normalizeTargets = (params: Record<string, unknown> | null | undefined): Target[] => {
  if (!params) return []
  if (Array.isArray(params.targets)) return params.targets as Target[]

  const legacyAssignees = params.assignees as Record<string, unknown> | undefined
  if (!legacyAssignees) return []

  const users = Array.isArray(legacyAssignees.users) ? legacyAssignees.users : []
  const groups = Array.isArray(legacyAssignees.groups) ? legacyAssignees.groups : []

  return [...users.map((id: string) => ({ type: 'USER' as const, id })), ...groups.map((id: string) => ({ type: 'GROUP' as const, id }))]
}

export const getTargetLabel = (target: Target): string => {
  if (target.type === 'RESOLVER') return formatResolverLabel(target.resolver_key ?? '')
  return target.id ?? ''
}
