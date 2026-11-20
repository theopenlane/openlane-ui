'use client'

import React, { useEffect, useRef } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Button } from '@repo/ui/button'
import { Callout } from '@/components/shared/callout/callout'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { useCreateEmailTemplate, useEmailTemplateCatalog, usePreviewEmailTemplateHtml, type EmailTemplateCatalogEntryNode } from '@/lib/graphql-hooks/email-template'
import { buildCampaignEmailTemplateInput } from '@/lib/email-template-input'
import { catalogEntryForType, EmailTemplateType } from '@/lib/email-template-type'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateConfigForm, useEmailTemplateSaveBlockedReason } from './email-template-config-form'
import { EmailTemplatePreview } from './email-template-preview'
import { EmailTemplateNameField } from './email-template-basic-fields'

export type InlineEmailTemplateDraft = { name: string; configData: Record<string, unknown> }

interface InlineEmailTemplateCreatorProps {
  type: EmailTemplateType
  draft: InlineEmailTemplateDraft | null
  onDraftChange: (draft: InlineEmailTemplateDraft) => void
  onCreated: (emailTemplateID: string) => void
  onCancel: () => void
}

export const InlineEmailTemplateCreator: React.FC<InlineEmailTemplateCreatorProps> = ({ type, ...props }) => {
  const { entries, isLoading } = useEmailTemplateCatalog()
  const entry = catalogEntryForType(entries, type)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading email template editor...</p>
  }

  if (!entry) {
    return (
      <Callout variant="warning" compact>
        {getEnumLabel(type)} email templates are not available yet.
      </Callout>
    )
  }

  return <InlineEmailTemplateForm key={entry.key} type={type} entry={entry} {...props} />
}

type InlineEmailTemplateFormProps = InlineEmailTemplateCreatorProps & { entry: EmailTemplateCatalogEntryNode }

const InlineEmailTemplateForm: React.FC<InlineEmailTemplateFormProps> = ({ type, entry, draft, onDraftChange, onCreated, onCancel }) => {
  const { name, configData } = draft ?? { name: '', configData: entry.exampleValues ?? {} }
  const setName = (nextName: string) => onDraftChange({ name: nextName, configData })
  const setConfigData = (nextConfigData: Record<string, unknown>) => onDraftChange({ name, configData: nextConfigData })
  const savingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const { mutateAsync: createEmailTemplate, isPending } = useCreateEmailTemplate()
  const { successNotification, errorNotification } = useNotification()

  const debouncedConfigData = useDebounce(configData, 400)
  const { previewHtml, isFetching, errorMessage } = usePreviewEmailTemplateHtml({ key: entry.key, defaults: debouncedConfigData, fallbackHtml: entry.htmlPreview })

  const saveBlockedReason = useEmailTemplateSaveBlockedReason(name, entry.configSchema, configData)
  const canSave = !saveBlockedReason && !isPending

  const handleSave = async () => {
    if (!canSave || savingRef.current) return
    savingRef.current = true
    let createdId: string
    try {
      const result = await createEmailTemplate({ input: buildCampaignEmailTemplateInput({ key: entry.key, name, defaults: configData, active: true }) })
      createdId = result.createEmailTemplate.emailTemplate.id
    } catch (error) {
      errorNotification({ title: 'Error creating email template', description: parseErrorMessage(error) })
      savingRef.current = false
      return
    }
    successNotification({ title: 'Email template created' })
    if (mountedRef.current) onCreated(createdId)
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">New {getEnumLabel(type).toLowerCase()} email template</span>
        <span className="text-xs text-muted-foreground">
          Prefilled with the default wording.{type === EmailTemplateType.QUESTIONNAIRE && ' The questionnaire access button is always added by the system.'}
        </span>
      </div>

      <EmailTemplateNameField name={name} onNameChange={setName} placeholder="e.g. Policy sign-off email" />

      <EmailTemplateConfigForm schema={entry.configSchema} uiSchema={entry.uiSchema} formData={configData} defaultValues={entry.exampleValues} onChange={setConfigData} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Preview</span>
        <EmailTemplatePreview previewHtml={previewHtml} isFetching={isFetching} errorMessage={errorMessage} isCatalogDrift={false} selectedKey={entry.key} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <DisabledReasonTooltip reason={saveBlockedReason}>
          <SaveButton type="button" title="Save template" onClick={handleSave} disabled={!canSave} isSaving={isPending} loading={isPending} />
        </DisabledReasonTooltip>
      </div>
    </div>
  )
}
