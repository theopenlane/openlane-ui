'use client'

import { useContext, useEffect } from 'react'
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import { ITheme, slk } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { useTheme } from 'next-themes'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

import 'survey-core/defaultV2.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

import { lightTheme } from './theme-light'
import { darkTheme } from './theme-dark'
import { TemplateDocumentType } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@repo/ui/panel'
import { useRouter } from 'next/navigation'

import './custom.css'
import { surveyLicenseKey } from '@repo/dally/auth'
import { useCreateTemplate, useGetTemplate, useUpdateTemplate } from '@/lib/graphql-hooks/templates'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const enLocale = editorLocalization.getLocale('en')

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

  const creator = new SurveyCreator(creatorOptions)
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

  const { data: templateResult } = useGetTemplate(input.existingId || input.templateId)

  if (templateResult) {
    creator.JSON = templateResult.template.jsonconfig
  }

  const { mutateAsync: createTemplateData } = useCreateTemplate()
  const { mutateAsync: updateTemplateData } = useUpdateTemplate()

  const saveTemplate = async (data: { title?: string; description?: string }) => {
    const variables = {
      input: {
        name: data.title || 'Untitled Questionnaire',
        jsonconfig: data,
        templateType: TemplateDocumentType.DOCUMENT,
        description: data.description,
      },
    }

    if (input.existingId) {
      try {
        updateTemplateData({
          updateTemplateId: input.existingId,
          input: { ...variables.input },
        })
        successNotification({
          title: 'Questionnaire saved successfully',
        })
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
      const data = await createTemplateData(variables)
      successNotification({
        title: 'Questionnaire saved successfully',
      })
      router.push(`/questionnaires/questionnaire-editor?id=${data?.createTemplate.template.id}`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  creator.saveSurveyFunc = () => {
    saveTemplate(creator.JSON)
  }

  return (
    <Panel className="flex h-full bg-panel-bg border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyCreatorComponent creator={creator} />
    </Panel>
  )
}
