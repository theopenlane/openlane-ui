'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce, useCopyToClipboard } from '@uidotdev/usehooks'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { PageHeading } from '@repo/ui/page-heading'
import { SaveIcon } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useCreateEmailTemplate, useUpdateEmailTemplate, useEmailTemplate, useEmailTemplateCatalog, usePreviewEmailTemplateHtml } from '@/lib/graphql-hooks/email-template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext } from '@repo/codegen/src/schema'
import { EmailTemplateBasicFields } from './email-template-basic-fields'
import { EmailTemplateConfiguration } from './email-template-configuration'
import { EmailTemplateVariables } from './email-template-variables'
import { EmailTemplatePreview } from './email-template-preview'

const LIST_PATH = '/automation/email-templates'

const EditorCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden">
    <div className="px-4 py-3">
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className="border-t border-border px-4 py-4">{children}</div>
  </div>
)

export const EmailTemplateEditorPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('id') ?? undefined
  const isEditMode = !!templateId

  const { setCrumbs } = React.use(BreadcrumbContext)

  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(true)
  const [name, setName] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [configData, setConfigData] = useState<Record<string, unknown>>({})
  const initializedIdRef = useRef<string | null>(null)

  const { entries, isLoading: isCatalogLoading } = useEmailTemplateCatalog()
  const { data: templateData, isLoading: isLoadingTemplate } = useEmailTemplate(isEditMode ? templateId : undefined)
  const { mutateAsync: createEmailTemplate, isPending: isCreating } = useCreateEmailTemplate()
  const { mutateAsync: updateEmailTemplate, isPending: isUpdating } = useUpdateEmailTemplate()
  const { successNotification, errorNotification } = useNotification()
  const [, copyToClipboard] = useCopyToClipboard()

  const isPending = isCreating || isUpdating
  const title = isEditMode ? 'Edit Email Template' : 'Create Email Template'

  const selectedEntry = useMemo(() => entries.find((e) => e.key === selectedKey), [entries, selectedKey])
  const debouncedConfigData = useDebounce(configData, 400)

  const {
    previewHtml,
    isFetching: isPreviewFetching,
    errorMessage: previewErrorMessage,
  } = usePreviewEmailTemplateHtml({
    key: selectedKey,
    defaults: debouncedConfigData,
    fallbackHtml: selectedEntry?.htmlPreview,
    enabled: !!selectedEntry,
  })

  const isCatalogDrift = isEditMode && !!selectedKey && entries.length > 0 && !selectedEntry

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: LIST_PATH },
      { label: 'Email Templates', href: LIST_PATH },
      { label: title, href: '#' },
    ])
  }, [setCrumbs, title])

  useEffect(() => {
    if (isEditMode) return
    if (selectedKey || entries.length === 0) return
    const first = entries[0]
    setSelectedKey(first.key)
    setConfigData(first.exampleValues ?? {})
  }, [isEditMode, selectedKey, entries])

  useEffect(() => {
    const t = templateData?.emailTemplate
    if (!isEditMode || !t || initializedIdRef.current === templateId) return
    setActive(t.active)
    setName(t.name)
    setSelectedKey(t.key)
    setConfigData(t.defaults ?? {})
    initializedIdRef.current = templateId ?? null
  }, [isEditMode, templateData, templateId])

  const handleCancel = () => router.push(LIST_PATH)

  const copyVariableToken = (variableName: string) => {
    copyToClipboard(`{{ .${variableName} }}`)
    successNotification({ title: `Copied {{ .${variableName} }}` })
  }

  const handleSave = async () => {
    if (!name.trim() || !selectedKey) return

    try {
      if (templateId) {
        await updateEmailTemplate({
          updateEmailTemplateId: templateId,
          input: {
            name: name.trim(),
            defaults: configData,
            locale: templateData?.emailTemplate?.locale ?? 'en',
            active,
          },
        })
        successNotification({ title: 'Email template updated' })
      } else {
        await createEmailTemplate({
          input: {
            key: selectedKey,
            name: name.trim(),
            defaults: configData,
            locale: 'en',
            format: EmailTemplateNotificationTemplateFormat.HTML,
            active,
            templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT,
          },
        })
        successNotification({ title: 'Email template created' })
      }
      router.push(LIST_PATH)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeading heading={title} />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isPending || !name.trim() || !selectedKey} icon={<SaveIcon size={16} />} iconPosition="left">
            {isPending ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Draft'}
          </Button>
        </div>
      </div>

      {isEditMode && isLoadingTemplate ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-start">
          <div className="flex flex-col gap-6 min-w-0">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-semibold">Active</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>

            <EditorCard title="Basic">
              <EmailTemplateBasicFields name={name} onNameChange={setName} />
            </EditorCard>

            <EditorCard title="Configuration">
              <EmailTemplateConfiguration
                isCatalogLoading={isCatalogLoading}
                isCatalogDrift={isCatalogDrift}
                selectedKey={selectedKey}
                selectedEntry={selectedEntry}
                configData={configData}
                onConfigChange={setConfigData}
                readOnly={false}
              />
            </EditorCard>

            {!!selectedEntry?.variables?.length && (
              <EditorCard title="Variables">
                <EmailTemplateVariables variables={selectedEntry.variables} onCopy={copyVariableToken} />
              </EditorCard>
            )}
          </div>

          <div className="xl:sticky xl:top-6 min-w-0">
            <EditorCard title="Preview">
              {mounted ? (
                <EmailTemplatePreview previewHtml={previewHtml} isFetching={isPreviewFetching} errorMessage={previewErrorMessage} isCatalogDrift={isCatalogDrift} selectedKey={selectedKey} />
              ) : (
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              )}
            </EditorCard>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailTemplateEditorPage
