'use client'

import { use, useEffect, useReducer, useRef, useState } from 'react'
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import { type ITheme, slk } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { useTheme } from 'next-themes'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

import 'survey-core/survey-core.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

import { lightTheme } from '@/styles/questionnaire/theme-light'
import { darkTheme } from '@/styles/questionnaire/theme-dark'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@repo/ui/panel'
import { useRouter } from 'next/navigation'

import '@/styles/questionnaire/custom.css'
import '@/components/shared/survey/survey-creator-types'
import { surveyLicenseKey } from '@repo/dally/auth'
import { useCreateAssessmentWithPolicies, useGetAssessment, useUpdateAssessment } from '@/lib/graphql-hooks/assessment'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { initialQuestionnaireEditorState, NO_DUE_DATE_DURATION, questionnaireEditorReducer, type TQuestionnaireEditorAction, UNTITLED_QUESTIONNAIRE } from './questionnaire-editor-state'
import { QuestionnaireEditorToolbar } from './questionnaire-editor-toolbar'

const enLocale = editorLocalization.getLocale('en')

const customThemeName = 'Openlane'
const JSON_EDITOR_TAB = 'json'

if (lightTheme.themeName) enLocale.theme.names[lightTheme.themeName] = customThemeName
if (darkTheme.themeName) enLocale.theme.names[darkTheme.themeName] = customThemeName

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
  showSaveButton: false,
}

const createSurveyCreator = () => {
  const creator = new SurveyCreator(creatorOptions)
  creator.toolbox.forceCompact = false

  const themeTabPlugin = creator.themeEditor
  themeTabPlugin.addTheme(lightTheme, true)
  themeTabPlugin.addTheme(darkTheme as ITheme, true)

  return creator
}

slk(surveyLicenseKey as string)

const getSaveDisabledReason = ({ activeTab, isModified }: { activeTab: string; isModified: boolean }) => {
  if (activeTab === JSON_EDITOR_TAB) return 'Leave the JSON Editor to apply your changes before saving'
  if (!isModified) return 'No changes to save'
  return undefined
}

const QuestionnaireEditor = (input: { templateId: string; existingId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [questionnaireEditorState, dispatchQuestionnaireEditorState] = useReducer(questionnaireEditorReducer, initialQuestionnaireEditorState)
  const { assessmentType, responseDueDuration } = questionnaireEditorState
  const [creator] = useState(() => createSurveyCreator())
  const creatorRef = useRef(creator)
  const [isModified, setIsModified] = useState(false)
  const [activeTab, setActiveTab] = useState(creator.activeTab)
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    const syncState = () => setIsModified(creator.state === 'modified')
    const syncActiveTab = () => setActiveTab(creator.activeTab)

    creator.onStateChanged.add(syncState)
    creator.onActiveTabChanged.add(syncActiveTab)

    return () => {
      creator.onStateChanged.remove(syncState)
      creator.onActiveTabChanged.remove(syncActiveTab)
    }
  }, [creator])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Questionnaire Editor', href: '/automation/questionnaires/questionnaire-editor' },
    ])
  }, [setCrumbs])

  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  useEffect(() => {
    creator.applyCreatorTheme(theme === 'dark' ? (darkTheme as ITheme) : lightTheme)
  }, [creator, theme])

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

    dispatchQuestionnaireEditorState({
      type: 'hydrate-from-assessment',
      assessmentType: assessmentResult.assessment.assessmentType,
      responseDueDuration: assessmentResult.assessment.responseDueDuration,
    })
  }, [assessmentResult])

  const { mutateAsync: createAssessmentData, isPending: isCreating } = useCreateAssessmentWithPolicies()
  const { mutateAsync: updateAssessmentData, isPending: isUpdating } = useUpdateAssessment()

  const handleTitleChange = (nextTitle: string) => {
    creatorRef.current.survey.title = nextTitle
  }

  const handleSettingChange = (action: TQuestionnaireEditorAction) => {
    dispatchQuestionnaireEditorState(action)
    creator.setModified({ type: 'PROPERTY_CHANGED' })
  }

  const saveAssessment = async () => {
    const jsonconfig = creator.JSON
    const name = creator.survey.title?.trim() || UNTITLED_QUESTIONNAIRE

    try {
      if (input.existingId) {
        await updateAssessmentData({
          updateAssessmentId: input.existingId,
          input: {
            name,
            jsonconfig,
            assessmentType,
            ...(responseDueDuration === NO_DUE_DATE_DURATION ? { clearResponseDueDuration: true } : { responseDueDuration }),
          },
        })
        setHasSaved(true)
        successNotification({ title: 'Assessment updated successfully' })
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
      <QuestionnaireEditorToolbar
        creator={creator}
        onTitleChange={handleTitleChange}
        state={questionnaireEditorState}
        onSettingChange={handleSettingChange}
        onSave={() => void saveAssessment()}
        isSaving={isCreating || isUpdating || hasSaved}
        saveDisabledReason={getSaveDisabledReason({ activeTab, isModified })}
      />
      <div className="flex-1 min-h-0">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Panel>
  )
}

export default QuestionnaireEditor
