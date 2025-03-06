'use client'

import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import { ITheme, slk } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { useTheme } from 'next-themes'

import 'survey-core/defaultV2.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

import { lightTheme } from './theme-light'
import { darkTheme } from './theme-dark'
import { TemplateDocumentType } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@repo/ui/panel'
import { pageStyles } from './page.styles'
import { useRouter } from 'next/navigation'

import './custom.css'
import { surveyLicenseKey } from '@repo/dally/auth'
import { useCreateTemplate, useGetTemplate, useUpdateTemplate } from '@/lib/graphql-hooks/templates'

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
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const creator = new SurveyCreator(creatorOptions)
  const themeTabPlugin = creator.themeEditor

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
  addCustomTheme(darkTheme, customThemeName)

  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  if (theme === 'dark') {
    creator.applyTheme(darkTheme)
  } else {
    creator.applyTheme(lightTheme)
  }

  const { data: templateResult } = useGetTemplate(input.existingId || input.templateId)

  if (templateResult) {
    creator.JSON = templateResult.template.jsonconfig
  }

  const { mutateAsync: createTemplateData } = useCreateTemplate()
  const { mutateAsync: updateTemplateData } = useUpdateTemplate()

  const saveTemplate = async (data: any, saveNo: string, callback: any) => {
    const variables = {
      input: {
        name: data.title,
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
      } catch {
        errorNotification({
          title: 'There was a problem saving the questionnaire, please try again',
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
    } catch {
      errorNotification({
        title: 'There was a problem saving the questionnaire ',
      })
    }
  }

  creator.saveSurveyFunc = (saveNo: string, callback: any) => {
    saveTemplate(creator.JSON, saveNo, callback)
  }

  return (
    <Panel className="flex h-full bg-panel-bg border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyCreatorComponent creator={creator} />
    </Panel>
  )
}
