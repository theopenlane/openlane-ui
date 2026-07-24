import { TaskTaskStatus } from '@repo/codegen/src/schema'

export const TASK_TERMINAL_STATUSES: TaskTaskStatus[] = [TaskTaskStatus.COMPLETED, TaskTaskStatus.WONT_DO]

export const isTerminalTaskStatus = (status: TaskTaskStatus): boolean => TASK_TERMINAL_STATUSES.includes(status)

export const SuggestedTaskSource = {
  ONBOARDING: 'openlane_onboarding',
  RECOMMENDATIONS: 'openlane_recommendations',
} as const

export type SuggestedTaskSourceValue = (typeof SuggestedTaskSource)[keyof typeof SuggestedTaskSource]

export interface SuggestedTaskKind {
  name: string
  color: string
}

export interface SuggestedTaskReference {
  name: string
  url: string
}

export interface SuggestedTaskMetadata {
  link?: string
  docsLink?: string
  references?: SuggestedTaskReference[]
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
