'use client'

import { use, useEffect, useRef, useState } from 'react'
import { SurveyCreatorComponent } from 'survey-creator-react'
import { type ICreatorOptions } from 'survey-creator-core'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { createSurveyCreator } from '@/components/shared/survey/survey-creator'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@repo/ui/panel'
import { useRouter } from 'next/navigation'

import '@/styles/questionnaire/custom.css'
import { useCreateTemplate, useGetTemplate, useUpdateTemplate } from '@/lib/graphql-hooks/template'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { diffBuiltInput } from '@/utils/input-diff'
import { TemplateDocumentType, type UpdateTemplateInput } from '@repo/codegen/src/schema'

const creatorOptions = {
  showLogicTab: true,
  isAutoSave: false,
} satisfies ICreatorOptions

type TSurveyJSON = { title?: string; description?: string }

const buildTemplateUpdateInput = (jsonconfig: TSurveyJSON): UpdateTemplateInput => ({
  name: jsonconfig.title || 'Untitled Template',
  jsonconfig,
  templateType: TemplateDocumentType.DOCUMENT,
})

export default function CreateTemplate(input: { templateId: string; existingId: string }) {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [creator] = useState(() => createSurveyCreator(creatorOptions))
  const creatorRef = useRef(creator)
  const baselineRef = useRef<TSurveyJSON | undefined>(undefined)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Templates', href: '/automation/questionnaires/templates' },
      { label: 'Template Editor', href: '/automation/questionnaires/templates/template-editor' },
    ])
  }, [setCrumbs])

  const { data: templateResult } = useGetTemplate(input.existingId)

  useEffect(() => {
    if (templateResult?.template?.jsonconfig) {
      creatorRef.current.JSON = templateResult.template.jsonconfig
      baselineRef.current = creatorRef.current.JSON
    }
  }, [templateResult])

  const { mutateAsync: createTemplateData } = useCreateTemplate()
  const { mutateAsync: updateTemplateData } = useUpdateTemplate()

  const saveTemplate = async (data: TSurveyJSON) => {
    if (input.existingId) {
      try {
        const baseline = baselineRef.current
        const updateInput = diffBuiltInput(buildTemplateUpdateInput(data), baseline && buildTemplateUpdateInput(baseline))

        if (Object.keys(updateInput).length > 0) {
          await updateTemplateData({ updateTemplateId: input.existingId, input: updateInput })
          baselineRef.current = data
          successNotification({
            title: 'Template updated successfully',
          })
        }

        router.push(`/automation/questionnaires/templates`)
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

      router.push(`/automation/questionnaires/templates`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    creatorRef.current.saveSurveyFunc = () => {
      saveTemplate(creatorRef.current.JSON)
    }
  })

  return (
    <Panel className="flex h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyCreatorComponent creator={creator} />
    </Panel>
  )
}
