import type { ApprovalTiming, WorkflowDocument } from '@/types/workflow'

export const parseWorkflowDefinition = (value: unknown): WorkflowDocument => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as WorkflowDocument
    } catch {
      return {}
    }
  }
  if (typeof value === 'object') {
    return value as WorkflowDocument
  }
  return {}
}

export const normalizeApprovalTiming = (value?: unknown): ApprovalTiming => {
  if (value === null || value === undefined) return 'PRE_COMMIT'
  const normalized = String(value).toUpperCase()
  return normalized === 'POST_COMMIT' ? 'POST_COMMIT' : 'PRE_COMMIT'
}

export const definitionHasApprovalTiming = (definition: unknown) => {
  const doc = parseWorkflowDefinition(definition)
  return Object.prototype.hasOwnProperty.call(doc, 'approvalTiming')
}

export const resolveApprovalTiming = (definition: unknown): ApprovalTiming => {
  const doc = parseWorkflowDefinition(definition)
  return normalizeApprovalTiming(doc?.approvalTiming)
}

export const formatApprovalTimingLabel = (timing: ApprovalTiming) => (timing === 'POST_COMMIT' ? 'Post-commit' : 'Pre-commit')

export const definitionHasApprovalAction = (definition: unknown) => {
  const doc = parseWorkflowDefinition(definition)
  const actions = Array.isArray(doc?.actions) ? doc.actions : []
  return actions.some((action) => {
    const type = String(action?.type ?? '').toUpperCase()
    return type === 'REQUEST_APPROVAL' || type === 'APPROVAL'
  })
}

export const definitionHasReviewAction = (definition: unknown) => {
  const doc = parseWorkflowDefinition(definition)
  const actions = Array.isArray(doc?.actions) ? doc.actions : []
  return actions.some((action) => {
    const type = String(action?.type ?? '').toUpperCase()
    return type === 'REQUEST_REVIEW' || type === 'REVIEW'
  })
}
