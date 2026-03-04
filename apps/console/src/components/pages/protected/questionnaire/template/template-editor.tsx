'use client'

import { useCallback, use, useEffect, useRef, useState } from 'react'
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

if (lightTheme.themeName) enLocale.theme.names[lightTheme.themeName] = customThemeName
if (darkTheme.themeName) enLocale.theme.names[darkTheme.themeName] = customThemeName

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
  showThemeTab: true,
}

// Register the SurveyJS license key
slk(surveyLicenseKey as string)

function createCreator(): SurveyCreator {
  const c = new SurveyCreator(creatorOptions)
  c.toolbox.forceCompact = false

  const themeTabPlugin = c.themeEditor
  themeTabPlugin.addTheme(lightTheme, true)
  themeTabPlugin.addTheme(darkTheme as ITheme, true)

  return c
}

export default function CreateTemplate(input: { templateId: string; existingId: string }) {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [creator] = useState(createCreator)
  const creatorRef = useRef(creator)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/automation/assessments' },
      { label: 'Templates', href: '/automation/assessments/templates' },
      { label: 'Template Editor', href: '/template-editor' },
    ])
  }, [setCrumbs])

  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  useEffect(() => {
    if (theme === 'dark') {
      creatorRef.current.applyCreatorTheme(darkTheme as ITheme)
    } else {
      creatorRef.current.applyCreatorTheme(lightTheme)
    }
  }, [theme])

  const { data: templateResult } = useGetTemplate(input.existingId)

  useEffect(() => {
    if (templateResult?.template?.jsonconfig) {
      creatorRef.current.JSON = templateResult.template.jsonconfig
    }
  }, [templateResult])

  const { mutateAsync: createTemplateData } = useCreateTemplate()
  const { mutateAsync: updateTemplateData } = useUpdateTemplate()

  const saveTemplate = useCallback(
    async (data: { title?: string; description?: string }) => {
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
    },
    [input.existingId, updateTemplateData, createTemplateData, successNotification, errorNotification, router],
  )

  useEffect(() => {
    creatorRef.current.saveSurveyFunc = () => {
      saveTemplate(creatorRef.current.JSON)
    }
  }, [saveTemplate])

  return (
    <Panel className="flex h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyCreatorComponent creator={creator} />
    </Panel>
  )
}
