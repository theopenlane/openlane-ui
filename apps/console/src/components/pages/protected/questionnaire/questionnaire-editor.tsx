'use client'

import { useContext, useEffect, useRef, useState } from 'react'
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
import { useCreateAssessment, useGetAssessment, useUpdateAssessment } from '@/lib/graphql-hooks/assessments'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { AssessmentAssessmentType } from '@repo/codegen/src/schema'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { Badge } from '@repo/ui/badge'

const enLocale = editorLocalization.getLocale('en')

const DURATION_OPTIONS = [
  { value: 604800, label: '7 days' },
  { value: 1209600, label: '14 days' },
  { value: 2592000, label: '30 days' },
  { value: 5184000, label: '60 days' },
  { value: 7776000, label: '90 days' },
]

const customThemeName = 'Openlane'

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
}

// Register the SurveyJS license key
slk(surveyLicenseKey as string)

export default function CreateQuestionnaire(input: { templateId: string; existingId: string }) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [assessmentType, setAssessmentType] = useState<AssessmentAssessmentType>(AssessmentAssessmentType.EXTERNAL)
  const [responseDueDuration, setResponseDueDuration] = useState<number>(604800)

  const creatorRef = useRef<SurveyCreator>(new SurveyCreator(creatorOptions))

  if (!creatorRef.current) {
    creatorRef.current = new SurveyCreator(creatorOptions)
    creatorRef.current.toolbox.forceCompact = false

    const themeTabPlugin = creatorRef.current.themeEditor
    if (lightTheme.themeName) enLocale.theme.names[lightTheme.themeName] = customThemeName
    if (darkTheme.themeName) enLocale.theme.names[darkTheme.themeName] = customThemeName
    themeTabPlugin.addTheme(lightTheme, true)
    themeTabPlugin.addTheme(darkTheme as ITheme, true)
  }

  const creator = creatorRef.current
  const themeTabPlugin = creator.themeEditor
  creator.toolbox.forceCompact = false

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
      { label: 'Questionnaire Editor', href: '/questionnaire-editor' },
    ])
  }, [setCrumbs])

  function addCustomTheme(theme: ITheme, userFriendlyThemeName: string) {
    // Add a localized user-friendly theme name
    if (theme.themeName) {
      enLocale.theme.names[theme.themeName] = userFriendlyThemeName
    }
    // Add the theme to the theme list as the default theme
    themeTabPlugin.addTheme(theme, true)
  }

  // Register a custom theme with Dark and Light variations
  addCustomTheme(lightTheme, customThemeName)
  addCustomTheme(darkTheme as ITheme, customThemeName)

  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  if (theme === 'dark') {
    creator.applyCreatorTheme(darkTheme as ITheme)
  } else {
    creator.applyCreatorTheme(lightTheme)
  }

  const { data: assessmentResult } = useGetAssessment(input.existingId)

  useEffect(() => {
    if (assessmentResult?.assessment) {
      if (assessmentResult.assessment.jsonconfig) {
        creator.JSON = assessmentResult.assessment.jsonconfig
      }
      if (assessmentResult.assessment.assessmentType) {
        setAssessmentType(assessmentResult.assessment.assessmentType)
      }
      if (assessmentResult.assessment.responseDueDuration) {
        setResponseDueDuration(assessmentResult.assessment.responseDueDuration)
      }
    }
  }, [assessmentResult, creator])

  const { mutateAsync: createAssessmentData } = useCreateAssessment()
  const { mutateAsync: updateAssessmentData } = useUpdateAssessment()

  const saveAssessment = async (data: { title?: string; description?: string }) => {
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
  }

  creator.saveSurveyFunc = () => {
    saveAssessment(creator.JSON)
  }

  const isEditing = !!input.existingId

  return (
    <Panel className="flex flex-col h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <div className="flex items-center gap-6 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="assessment-type">Type</Label>
          {isEditing ? (
            <Badge variant="outline">{assessmentType === AssessmentAssessmentType.INTERNAL ? 'Internal' : 'External'}</Badge>
          ) : (
            <Select value={assessmentType} onValueChange={(value) => setAssessmentType(value as AssessmentAssessmentType)}>
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
          <Select value={String(responseDueDuration)} onValueChange={(value) => setResponseDueDuration(Number(value))}>
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
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Panel>
  )
}
