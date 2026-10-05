import { AssessmentAssessmentType } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { MS_PER_DAY } from '@/utils/date'

export const NO_DUE_DATE_DURATION = 0
export const CUSTOM_DUE_DATE_DURATION = -1
const ONE_DAY_SECONDS = MS_PER_DAY / 1000 // 1 day
const DEFAULT_DUE_DURATION = 7 * ONE_DAY_SECONDS // 7 days
const PRESET_DUE_DAYS = [7, 14, 30, 60, 90]

export const UNTITLED_QUESTIONNAIRE = 'Untitled Questionnaire'

export const DURATION_OPTIONS = [
  { value: NO_DUE_DATE_DURATION, label: 'No due date' },
  ...PRESET_DUE_DAYS.map((days) => ({ value: days * ONE_DAY_SECONDS, label: `${days} days` })),
  { value: CUSTOM_DUE_DATE_DURATION, label: 'Custom' },
]

const PRESET_VALUES = new Set(DURATION_OPTIONS.filter((option) => option.value > 0).map((option) => option.value))
export const ASSESSMENT_TYPE_OPTIONS = enumToOptions(AssessmentAssessmentType)

export type TQuestionnaireEditorState = {
  assessmentType: AssessmentAssessmentType
  responseDueDuration: number
  isCustomDuration: boolean
  customDueDate: Date | null
}

export type TQuestionnaireEditorAction =
  | { type: 'set-assessment-type'; value: AssessmentAssessmentType }
  | { type: 'select-duration-preset'; value: number }
  | { type: 'enter-custom-duration' }
  | { type: 'set-custom-due-date'; value: Date }
  | {
      type: 'hydrate-from-assessment'
      assessmentType?: AssessmentAssessmentType | null
      responseDueDuration?: number | null
    }

export const initialQuestionnaireEditorState: TQuestionnaireEditorState = {
  assessmentType: AssessmentAssessmentType.EXTERNAL,
  responseDueDuration: DEFAULT_DUE_DURATION,
  isCustomDuration: false,
  customDueDate: null,
}

const durationToDate = (durationSeconds: number): Date => new Date(Date.now() + durationSeconds * 1000)

export const questionnaireEditorReducer = (state: TQuestionnaireEditorState, action: TQuestionnaireEditorAction): TQuestionnaireEditorState => {
  switch (action.type) {
    case 'set-assessment-type':
      return { ...state, assessmentType: action.value }
    case 'select-duration-preset':
      return { ...state, responseDueDuration: action.value, isCustomDuration: false, customDueDate: null }
    case 'enter-custom-duration': {
      const seededDuration = state.responseDueDuration > 0 ? state.responseDueDuration : DEFAULT_DUE_DURATION
      return { ...state, isCustomDuration: true, responseDueDuration: seededDuration, customDueDate: durationToDate(seededDuration) }
    }
    case 'set-custom-due-date':
      return { ...state, customDueDate: action.value, responseDueDuration: Math.max(ONE_DAY_SECONDS, Math.round((action.value.getTime() - Date.now()) / 1000)) }
    case 'hydrate-from-assessment': {
      const nextAssessmentType = action.assessmentType ?? state.assessmentType
      const nextDuration = action.responseDueDuration ?? NO_DUE_DATE_DURATION
      const nextIsCustomDuration = nextDuration > 0 && !PRESET_VALUES.has(nextDuration)

      return {
        assessmentType: nextAssessmentType,
        responseDueDuration: nextDuration,
        isCustomDuration: nextIsCustomDuration,
        customDueDate: nextIsCustomDuration ? durationToDate(nextDuration) : null,
      }
    }
    default:
      return state
  }
}
