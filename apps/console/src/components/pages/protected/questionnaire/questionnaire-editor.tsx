'use client'

import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import { ITheme, slk } from 'survey-core'
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
import { Badge } from '@repo/ui/badge'
import { CalendarPopover } from '@repo/ui/calendar-popover'

const enLocale = editorLocalization.getLocale('en')

const DURATION_OPTIONS = [
  { value: 604800, label: '7 days' },
  { value: 1209600, label: '14 days' },
  { value: 2592000, label: '30 days' },
  { value: 5184000, label: '60 days' },
  { value: 7776000, label: '90 days' },
  { value: -1, label: 'Custom' },
]

const PRESET_VALUES = new Set([604800, 1209600, 2592000, 5184000, 7776000])

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
  | { type: 'set-response-due-duration'; value: number }
  | { type: 'set-is-custom-duration'; value: boolean }
  | { type: 'set-custom-due-date'; value: Date | null }
  | {
      type: 'hydrate-from-assessment'
      assessmentType?: AssessmentAssessmentType | null
      responseDueDuration?: number | null
    }

const initialQuestionnaireEditorState: TQuestionnaireEditorState = {
  assessmentType: AssessmentAssessmentType.EXTERNAL,
  responseDueDuration: 604800,
  isCustomDuration: false,
  customDueDate: null,
}

function questionnaireEditorReducer(state: TQuestionnaireEditorState, action: TQuestionnaireEditorAction): TQuestionnaireEditorState {
  switch (action.type) {
    case 'set-assessment-type':
      return { ...state, assessmentType: action.value }
    case 'set-response-due-duration':
      return { ...state, responseDueDuration: action.value }
    case 'set-is-custom-duration':
      return { ...state, isCustomDuration: action.value }
    case 'set-custom-due-date':
      return { ...state, customDueDate: action.value }
    case 'hydrate-from-assessment': {
      const nextAssessmentType = action.assessmentType ?? state.assessmentType
      const nextDuration = action.responseDueDuration ?? state.responseDueDuration
      const nextIsCustomDuration = !PRESET_VALUES.has(nextDuration)

      return {
        assessmentType: nextAssessmentType,
        responseDueDuration: nextDuration,
        isCustomDuration: nextIsCustomDuration,
        customDueDate: nextIsCustomDuration ? new Date(Date.now() + nextDuration * 1000) : null,
      }
    }
    default:
      return state
  }
}

slk(surveyLicenseKey as string)

export default function CreateQuestionnaire(input: { templateId: string; existingId: string }) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [questionnaireEditorState, dispatchQuestionnaireEditorState] = useReducer(questionnaireEditorReducer, initialQuestionnaireEditorState)
  const { assessmentType, responseDueDuration, isCustomDuration, customDueDate } = questionnaireEditorState
  const [creator] = useState(() => createSurveyCreator())
  const creatorRef = useRef<SurveyCreator | null>(null)

  useEffect(() => {
    creatorRef.current = creator
  }, [creator])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
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
              responseDueDuration,
            },
          })

          successNotification({
            title: 'Assessment updated successfully',
          })

          router.push(`/questionnaires`)
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

        router.push(`/questionnaires`)
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

  const isEditing = !!input.existingId

  return (
    <Panel className="flex flex-col h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <div className="flex items-center gap-6 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="assessment-type">Type</Label>
          {isEditing ? (
            <Badge variant="outline">{assessmentType === AssessmentAssessmentType.INTERNAL ? 'Internal' : 'External'}</Badge>
          ) : (
            <Select
              value={assessmentType}
              onValueChange={(value) =>
                dispatchQuestionnaireEditorState({
                  type: 'set-assessment-type',
                  value: value as AssessmentAssessmentType,
                })
              }
            >
              <SelectTrigger id="assessment-type" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AssessmentAssessmentType.EXTERNAL}>External</SelectItem>
                <SelectItem value={AssessmentAssessmentType.INTERNAL}>Internal</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="response-due">Response Due</Label>
          <Select
            value={isCustomDuration ? '-1' : String(responseDueDuration)}
            onValueChange={(value) => {
              const num = Number(value)
              if (num === -1) {
                dispatchQuestionnaireEditorState({ type: 'set-is-custom-duration', value: true })
              } else {
                dispatchQuestionnaireEditorState({ type: 'set-is-custom-duration', value: false })
                dispatchQuestionnaireEditorState({ type: 'set-custom-due-date', value: null })
                dispatchQuestionnaireEditorState({ type: 'set-response-due-duration', value: num })
                creatorRef.current?.setModified({ type: 'PROPERTY_CHANGED' })
              }
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
              disabledFrom={new Date()}
              buttonClassName="w-[200px] flex justify-between items-center"
              onChange={(date) => {
                if (date) {
                  dispatchQuestionnaireEditorState({ type: 'set-custom-due-date', value: date })
                  const durationSeconds = Math.max(86400, Math.round((date.getTime() - Date.now()) / 1000))
                  dispatchQuestionnaireEditorState({ type: 'set-response-due-duration', value: durationSeconds })
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
