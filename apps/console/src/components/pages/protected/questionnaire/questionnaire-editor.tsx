'use client'

import { use, useEffect, useReducer, useRef, useState } from 'react'
import { SurveyCreatorComponent } from 'survey-creator-react'
import { type ICreatorOptions } from 'survey-creator-core'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { createSurveyCreator } from '@/components/shared/survey/survey-creator'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@theopenlane/ui/panel'
import { useRouter } from 'next/navigation'

import '@/styles/questionnaire/custom.css'
import { useCreateAssessmentWithPolicies, useGetAssessment, useUpdateAssessment } from '@/lib/graphql-hooks/assessment'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import {
  initialQuestionnaireEditorState,
  NO_DUE_DATE_DURATION,
  questionnaireEditorReducer,
  type TQuestionnaireEditorAction,
  type TQuestionnaireEditorState,
  UNTITLED_QUESTIONNAIRE,
} from './questionnaire-editor-state'
import { QuestionnaireSettingsFields } from './questionnaire-settings-fields'
import { SurveyEditorToolbar } from './survey-editor-toolbar'
import { surveyTitleOr } from './survey-title-field'
import { diffBuiltInput } from '@/utils/input-diff'
import { type UpdateAssessmentInput } from '@repo/codegen/src/schema'

const creatorOptions = {
  showLogicTab: true,
} satisfies ICreatorOptions

type TAssessmentUpdateValues = Pick<TQuestionnaireEditorState, 'assessmentType' | 'responseDueDuration'> & {
  name: string
  jsonconfig: UpdateAssessmentInput['jsonconfig']
}

const buildAssessmentUpdateInput = ({ name, jsonconfig, assessmentType, responseDueDuration }: TAssessmentUpdateValues): UpdateAssessmentInput => ({
  name,
  jsonconfig,
  assessmentType,
  ...(responseDueDuration === NO_DUE_DATE_DURATION ? { clearResponseDueDuration: true } : { responseDueDuration }),
})

const QuestionnaireEditor = (input: { templateId: string; existingId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [questionnaireEditorState, dispatchQuestionnaireEditorState] = useReducer(questionnaireEditorReducer, initialQuestionnaireEditorState)
  const { assessmentType, responseDueDuration } = questionnaireEditorState
  const [creator] = useState(() => createSurveyCreator(creatorOptions))
  const creatorRef = useRef(creator)
  const [hasSaved, setHasSaved] = useState(false)
  const baselineRef = useRef<TAssessmentUpdateValues | undefined>(undefined)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Questionnaire Editor', href: '/automation/questionnaires/questionnaire-editor' },
    ])
  }, [setCrumbs])

  const { data: assessmentResult } = useGetAssessment(input.existingId)

  useEffect(() => {
    if (assessmentResult?.assessment.systemOwned) {
      router.push('/automation/questionnaires')
    }
  }, [assessmentResult, router])

  useEffect(() => {
    if (!assessmentResult?.assessment) return

    if (assessmentResult.assessment.jsonconfig) {
      creatorRef.current.JSON = assessmentResult.assessment.jsonconfig
    }

    const hydrateAction: TQuestionnaireEditorAction = {
      type: 'hydrate-from-assessment',
      assessmentType: assessmentResult.assessment.assessmentType,
      responseDueDuration: assessmentResult.assessment.responseDueDuration,
    }
    const hydrated = questionnaireEditorReducer(initialQuestionnaireEditorState, hydrateAction)

    baselineRef.current = {
      name: surveyTitleOr(creatorRef.current, UNTITLED_QUESTIONNAIRE),
      jsonconfig: creatorRef.current.JSON,
      assessmentType: hydrated.assessmentType,
      responseDueDuration: hydrated.responseDueDuration,
    }
    dispatchQuestionnaireEditorState(hydrateAction)
  }, [assessmentResult])

  const { mutateAsync: createAssessmentData, isPending: isCreating } = useCreateAssessmentWithPolicies()
  const { mutateAsync: updateAssessmentData, isPending: isUpdating } = useUpdateAssessment()

  const handleSettingChange = (action: TQuestionnaireEditorAction) => {
    dispatchQuestionnaireEditorState(action)
    creator.setModified({ type: 'PROPERTY_CHANGED' })
  }

  const saveAssessment = async () => {
    const jsonconfig = creator.JSON
    const name = surveyTitleOr(creator, UNTITLED_QUESTIONNAIRE)

    try {
      if (input.existingId) {
        const values: TAssessmentUpdateValues = { name, jsonconfig, assessmentType, responseDueDuration }
        const baseline = baselineRef.current
        const updateInput = diffBuiltInput(buildAssessmentUpdateInput(values), baseline && buildAssessmentUpdateInput(baseline))

        if (Object.keys(updateInput).length > 0) {
          await updateAssessmentData({ updateAssessmentId: input.existingId, input: updateInput })
          baselineRef.current = values
          successNotification({ title: 'Assessment updated successfully' })
        }
        setHasSaved(true)
        router.push(`/automation/questionnaires/${input.existingId}`)
        return
      }

      await createAssessmentData({ name, jsonconfig, assessmentType, responseDueDuration })
      setHasSaved(true)
      successNotification({ title: 'Assessment created successfully' })
      router.push(`/automation/questionnaires`)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Panel gap={0} className="flex flex-col h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyEditorToolbar creator={creator} titlePlaceholder={UNTITLED_QUESTIONNAIRE} onSave={saveAssessment} isSaving={isCreating || isUpdating || hasSaved}>
        <QuestionnaireSettingsFields state={questionnaireEditorState} onSettingChange={handleSettingChange} />
      </SurveyEditorToolbar>
      <div className="flex-1 min-h-0">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Panel>
  )
}

export default QuestionnaireEditor
