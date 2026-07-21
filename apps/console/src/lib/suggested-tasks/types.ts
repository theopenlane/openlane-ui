import { type TaskTaskStatus } from '@repo/codegen/src/schema'

export const SuggestedTaskSource = {
  ONBOARDING: 'openlane_onboarding',
  RECOMMENDATIONS: 'openlane_recommendations',
} as const

export type SuggestedTaskSourceValue = (typeof SuggestedTaskSource)[keyof typeof SuggestedTaskSource]

export interface SuggestedTaskKind {
  name: string
  color: string
}

export interface SuggestedTaskMetadata {
  link?: string
  docsLink?: string
}

export interface SuggestedTask {
  id: string
  title: string
  details: string
  status: TaskTaskStatus
  taskKind: SuggestedTaskKind
  availableAt?: string
  source: SuggestedTaskSourceValue
  metadata: SuggestedTaskMetadata
}
