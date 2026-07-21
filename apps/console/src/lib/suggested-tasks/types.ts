import { type TaskTaskStatus } from '@repo/codegen/src/schema'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum'

// `source` values the dashboard groups suggestions on: generic ones everyone should do
// (openlane_onboarding) vs. personalized ones based on what the org told us during onboarding
// (openlane_recommendations)
export const SuggestedTaskSource = {
  ONBOARDING: 'openlane_onboarding',
  RECOMMENDATIONS: 'openlane_recommendations',
} as const

// A real task only carries `taskKindName` (a string), and the UI looks up its color from the
// org's custom-type-enum options at render time. A suggestion has no backing custom-type-enum
// record to look up, so it carries its own { name, color } pair directly instead.
export interface SuggestedTaskKind {
  name: string
  color: string
}

// `link`, if set, is where clicking the suggestion sends the user instead of opening the
// suggested-task view. `docsLink`, if set, shows up as a "view documentation" action inside
// that view.
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
  isSuggested: true
  priority: number
  availableAt?: string
  source: string
  metadata: SuggestedTaskMetadata
  requiredModule?: PlanEnum
  fallbackDescription?: string
}
