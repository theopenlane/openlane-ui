'use client'

import { use, useEffect, useRef } from 'react'
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react'
import { type ITheme, slk } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { useTheme } from 'next-themes'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

import 'survey-core/survey-core.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

import { lightTheme } from '../theme-light'
import { darkTheme } from '../theme-dark'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@repo/ui/panel'
import { useRouter } from 'next/navigation'

import '../custom.css'
import { surveyLicenseKey } from '@repo/dally/auth'
import { useCreateTemplate, useGetTemplate, useUpdateTemplate } from '@/lib/graphql-hooks/template'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TemplateDocumentType } from '@repo/codegen/src/schema'

const enLocale = editorLocalization.getLocale('en')

const customThemeName = 'Openlane'

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
}

// Register the SurveyJS license key
slk(surveyLicenseKey as string)

export default function CreateTemplate(input: { templateId: string; existingId: string }) {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const creatorRef = useRef<SurveyCreator>(new SurveyCreator(creatorOptions))
  // eslint-disable-next-line react-hooks/refs -- SurveyCreator is a mutable third-party object, stable across renders
  const creator = creatorRef.current

  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  useEffect(() => {
    creator.toolbox.forceCompact = false

    const themeTabPlugin = creator.themeEditor
    if (lightTheme.themeName) enLocale.theme.names[lightTheme.themeName] = customThemeName
    if (darkTheme.themeName) enLocale.theme.names[darkTheme.themeName] = customThemeName
    themeTabPlugin.addTheme(lightTheme, true)
    themeTabPlugin.addTheme(darkTheme as ITheme, true)
  }, [creator])

  useEffect(() => {
    if (theme === 'dark') {
      creator.applyCreatorTheme(darkTheme as ITheme)
    } else {
      creator.applyCreatorTheme(lightTheme)
    }
  }, [creator, theme])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/assessments' },
      { label: 'Questionnaires', href: '/automation/assessments' },
      { label: 'Templates', href: '/automation/assessments/templates' },
      { label: 'Template Editor', href: '/template-editor' },
    ])
  }, [setCrumbs])

  const { data: templateResult } = useGetTemplate(input.existingId)

  useEffect(() => {
    if (templateResult?.template?.jsonconfig) {
      creator.JSON = templateResult.template.jsonconfig
    }
  }, [creator, templateResult])

  const { mutateAsync: createTemplateData } = useCreateTemplate()
  const { mutateAsync: updateTemplateData } = useUpdateTemplate()

  const saveTemplate = async (data: { title?: string; description?: string }) => {
    if (input.existingId) {
      try {
        await updateTemplateData({
          updateTemplateId: input.existingId,
          input: {
            name: data.title || 'Untitled Template',
            jsonconfig: data,
            templateType: TemplateDocumentType.DOCUMENT,
          },
        })

        successNotification({
          title: 'Template updated successfully',
        })

        router.push(`/automation/assessments/templates`)
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
      await createTemplateData({
        input: {
          name: data.title || 'Untitled Template',
          jsonconfig: data,
          templateType: TemplateDocumentType.DOCUMENT,
        },
      })

      successNotification({
        title: 'Template created successfully',
      })

      router.push(`/automation/assessments/templates`)
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
    <Panel className="flex h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyCreatorComponent creator={creator} />
    </Panel>
  )
}
