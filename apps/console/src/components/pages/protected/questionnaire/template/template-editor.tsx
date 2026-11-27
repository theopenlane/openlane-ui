'use client'

import { use, useEffect, useRef, useState } from 'react'
import { SurveyCreatorComponent } from 'survey-creator-react'
import { type ICreatorOptions } from 'survey-creator-core'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { createSurveyCreator } from '@/components/shared/survey/survey-creator'
import { useNotification } from '@/hooks/useNotification'
import { Panel } from '@theopenlane/ui/panel'
import { useRouter } from 'next/navigation'

import '@/styles/questionnaire/custom.css'
import { useCreateTemplate, useGetTemplate, useUpdateTemplate } from '@/lib/graphql-hooks/template'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { diffBuiltInput } from '@/utils/input-diff'
import { isRecord } from '@/utils/type-guards'
import { type CreateTemplateInput, TemplateDocumentType } from '@repo/codegen/src/schema'
import { SurveyEditorToolbar } from '../survey-editor-toolbar'
import { surveyTitleOr } from '../survey-title-field'

const UNTITLED_TEMPLATE = 'Untitled Template'
const TEMPLATES_PATH = '/automation/questionnaires/templates'

const creatorOptions = {
  showLogicTab: true,
} satisfies ICreatorOptions

type TTemplateValues = Pick<CreateTemplateInput, 'name' | 'jsonconfig'>

const withSurveyTitle = (jsonconfig: TTemplateValues['jsonconfig'], title: string): TTemplateValues['jsonconfig'] => ({
  ...jsonconfig,
  title: isRecord(jsonconfig.title) ? { ...jsonconfig.title, default: title } : title,
})

const TemplateEditor = (input: { templateId: string; existingId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()

  const [creator] = useState(() => createSurveyCreator(creatorOptions))
  const creatorRef = useRef(creator)
  const [hasSaved, setHasSaved] = useState(false)
  const baselineRef = useRef<TTemplateValues | undefined>(undefined)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Templates', href: TEMPLATES_PATH },
      { label: 'Template Editor', href: `${TEMPLATES_PATH}/template-editor` },
    ])
  }, [setCrumbs])

  const { data: templateResult } = useGetTemplate(input.existingId)

  useEffect(() => {
    const template = templateResult?.template
    if (!template?.jsonconfig) return

    creatorRef.current.JSON = template.jsonconfig
    if (surveyTitleOr(creatorRef.current, '') !== template.name) {
      creatorRef.current.JSON = withSurveyTitle(template.jsonconfig, template.name)
    }
    baselineRef.current = { name: template.name, jsonconfig: creatorRef.current.JSON }
  }, [templateResult])

  const { mutateAsync: createTemplateData, isPending: isCreating } = useCreateTemplate()
  const { mutateAsync: updateTemplateData, isPending: isUpdating } = useUpdateTemplate()

  const saveTemplate = async () => {
    const values: TTemplateValues = { name: surveyTitleOr(creator, UNTITLED_TEMPLATE), jsonconfig: creator.JSON }

    try {
      if (input.existingId) {
        const baseline = baselineRef.current
        const updateInput = diffBuiltInput(values, baseline)

        if (Object.keys(updateInput).length > 0) {
          await updateTemplateData({ updateTemplateId: input.existingId, input: updateInput })
          baselineRef.current = values
          successNotification({ title: 'Template updated successfully' })
        }
      } else {
        await createTemplateData({ input: { ...values, templateType: TemplateDocumentType.DOCUMENT } })
        successNotification({ title: 'Template created successfully' })
      }

      setHasSaved(true)
      router.push(TEMPLATES_PATH)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Panel gap={0} className="flex flex-col h-full bg-card border-oxford-blue-100 dark:border-oxford-blue-900 p-0">
      <SurveyEditorToolbar creator={creator} titlePlaceholder={UNTITLED_TEMPLATE} onSave={saveTemplate} isSaving={isCreating || isUpdating || hasSaved} />
      <div className="flex-1 min-h-0">
        <SurveyCreatorComponent creator={creator} />
      </div>
    </Panel>
  )
}

export default TemplateEditor
