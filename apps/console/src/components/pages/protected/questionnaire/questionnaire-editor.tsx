'use client'

import { useCallback, use, useEffect, useReducer, useRef, useState } from 'react'
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import { type ITheme, slk } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { useTheme } from 'next-themes'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

import 'survey-core/survey-core.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

import { lightTheme } from './theme-light'
import { darkTheme } from './theme-dark'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@repo/ui/panel'
import { useRouter } from 'next/navigation'

import './custom.css'
import { surveyLicenseKey } from '@repo/dally/auth'
import { useCreateAssessment, useGetAssessment, useUpdateAssessment } from '@/lib/graphql-hooks/assessment'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { AssessmentAssessmentType } from '@repo/codegen/src/schema'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

const enLocale = editorLocalization.getLocale('en')

const NO_DUE_DATE_DURATION = 0
const CUSTOM_DUE_DATE_DURATION = -1
const DEFAULT_DUE_DURATION = 604800

const DURATION_OPTIONS = [
  { value: NO_DUE_DATE_DURATION, label: 'No due date' },
  { value: DEFAULT_DUE_DURATION, label: '7 days' },
  { value: 1209600, label: '14 days' },
  { value: 2592000, label: '30 days' },
  { value: 5184000, label: '60 days' },
  { value: 7776000, label: '90 days' },
  { value: CUSTOM_DUE_DATE_DURATION, label: 'Custom' },
]

const PRESET_VALUES = new Set(DURATION_OPTIONS.filter((option) => option.value > 0).map((option) => option.value))
const ASSESSMENT_TYPE_OPTIONS = enumToOptions(AssessmentAssessmentType)

const customThemeName = 'Openlane'

if (lightTheme.themeName) enLocale.theme.names[lightTheme.themeName] = customThemeName
if (darkTheme.themeName) enLocale.theme.names[darkTheme.themeName] = customThemeName

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
}

function createSurveyCreator() {
  const creator = new SurveyCreator(creatorOptions)
  creator.toolbox.forceCompact = false

  const themeTabPlugin = creator.themeEditor
  themeTabPlugin.addTheme(lightTheme, true)
  themeTabPlugin.addTheme(darkTheme as ITheme, true)

  return creator
}

type TQuestionnaireEditorState = {
  assessmentType: AssessmentAssessmentType
  responseDueDuration: number
  isCustomDuration: boolean
  customDueDate: Date | null
}

type TQuestionnaireEditorAction =
  | { type: 'set-assessment-type'; value: AssessmentAssessmentType }
  | { type: 'select-duration-preset'; value: number }
  | { type: 'enter-custom-duration' }
  | { type: 'set-custom-due-date'; value: Date }
  | {
      type: 'hydrate-from-assessment'
      assessmentType?: AssessmentAssessmentType | null
      responseDueDuration?: number | null
    }

const initialQuestionnaireEditorState: TQuestionnaireEditorState = {
  assessmentType: AssessmentAssessmentType.EXTERNAL,
  responseDueDuration: DEFAULT_DUE_DURATION,
  isCustomDuration: false,
  customDueDate: null,
}

const durationToDate = (durationSeconds: number): Date => new Date(Date.now() + durationSeconds * 1000)

const questionnaireEditorReducer = (state: TQuestionnaireEditorState, action: TQuestionnaireEditorAction): TQuestionnaireEditorState => {
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
      return { ...state, customDueDate: action.value, responseDueDuration: Math.max(86400, Math.round((action.value.getTime() - Date.now()) / 1000)) }
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

slk(surveyLicenseKey as string)

const QuestionnaireEditor = (input: { templateId: string; existingId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [questionnaireEditorState, dispatchQuestionnaireEditorState] = useReducer(questionnaireEditorReducer, initialQuestionnaireEditorState)
  const { assessmentType, responseDueDuration, isCustomDuration, customDueDate } = questionnaireEditorState
  const [creator] = useState(() => createSurveyCreator())
  const [calendarDisabledFrom] = useState(() => new Date())
  const creatorRef = useRef<SurveyCreator | null>(null)

  useEffect(() => {
    creatorRef.current = creator
  }, [creator])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/questionnaires' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Questionnaire Editor', href: '/questionnaire-editor' },
    ])
  }, [setCrumbs])

  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  useEffect(() => {
    const creatorInstance = creatorRef.current
    if (!creatorInstance) return

    creatorInstance.applyCreatorTheme(theme === 'dark' ? (darkTheme as ITheme) : lightTheme)
  }, [theme])

  const { data: assessmentResult } = useGetAssessment(input.existingId)

  useEffect(() => {
    if (!assessmentResult) {
      return
    }

    // system owned assessments cannot be edited so no need to allow the user
    // access to this screen
    if (assessmentResult.assessment.systemOwned) {
      router.push('/automation/questionnaires')
      return
    }
  }, [assessmentResult, router])

  useEffect(() => {
    const creatorInstance = creatorRef.current
    if (!creatorInstance || !assessmentResult?.assessment) return

    if (assessmentResult.assessment.jsonconfig) {
      creatorInstance.JSON = assessmentResult.assessment.jsonconfig
    }

    dispatchQuestionnaireEditorState({
      type: 'hydrate-from-assessment',
      assessmentType: assessmentResult.assessment.assessmentType,
      responseDueDuration: assessmentResult.assessment.responseDueDuration,
    })
  }, [assessmentResult])

  const { mutateAsync: createAssessmentData } = useCreateAssessment()
  const { mutateAsync: updateAssessmentData } = useUpdateAssessment()

  const saveAssessment = useCallback(
    async (data: { title?: string; description?: string }) => {
      if (input.existingId) {
        try {
          await updateAssessmentData({
            updateAssessmentId: input.existingId,
            input: {
              name: data.title || 'Untitled Questionnaire',
              jsonconfig: data,
              assessmentType,
              ...(responseDueDuration === NO_DUE_DATE_DURATION ? { clearResponseDueDuration: true } : { responseDueDuration }),
            },
          })

          successNotification({
            title: 'Assessment updated successfully',
          })

          router.push(`/automation/questionnaires/${input.existingId}`)
        } catch (error) {
          const errorMessage = parseErrorMessage(error)
          errorNotification({
            title: 'Error',
            description: errorMessage,
          })
        }
        return
      }

      try {
        await createAssessmentData({
          input: {
            name: data.title || 'Untitled Questionnaire',
            jsonconfig: data,
            assessmentType,
            responseDueDuration,
          },
        })

        successNotification({
          title: 'Assessment created successfully',
        })

        router.push(`/automation/questionnaires`)
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    },
    [assessmentType, createAssessmentData, errorNotification, input.existingId, responseDueDuration, router, successNotification, updateAssessmentData],
  )

  useEffect(() => {
    const creatorInstance = creatorRef.current
    if (!creatorInstance) return

    creatorInstance.saveSurveyFunc = () => {
      void saveAssessment(creatorInstance.JSON)
    }
  }, [saveAssessment])

  return (
    <Panel className="flex flex-col h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <div className="flex items-center gap-6 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="assessment-type">Type</Label>
          <Select
            value={assessmentType}
            onValueChange={(value) => {
              dispatchQuestionnaireEditorState({
                type: 'set-assessment-type',
                value: value as AssessmentAssessmentType,
              })
              creatorRef.current?.setModified({ type: 'PROPERTY_CHANGED' })
            }}
          >
            <SelectTrigger id="assessment-type" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSESSMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="response-due">Response Due</Label>
          <Select
            value={String(isCustomDuration ? CUSTOM_DUE_DATE_DURATION : responseDueDuration)}
            onValueChange={(value) => {
              const num = Number(value)

              if (num === CUSTOM_DUE_DATE_DURATION) {
                dispatchQuestionnaireEditorState({ type: 'enter-custom-duration' })
              } else {
                dispatchQuestionnaireEditorState({ type: 'select-duration-preset', value: num })
              }

              creatorRef.current?.setModified({ type: 'PROPERTY_CHANGED' })
            }}
          >
            <SelectTrigger id="response-due" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCustomDuration && (
            <CalendarPopover
              defaultValue={customDueDate}
              disabledFrom={calendarDisabledFrom}
              buttonClassName="w-[200px] flex justify-between items-center"
              onChange={(date) => {
                if (date) {
                  dispatchQuestionnaireEditorState({ type: 'set-custom-due-date', value: date })
                  creatorRef.current?.setModified({ type: 'PROPERTY_CHANGED' })
                }
              }}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Panel>
  )
}

export default QuestionnaireEditor
