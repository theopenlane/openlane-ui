'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDebounce, useCopyToClipboard } from '@uidotdev/usehooks'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { Accordion } from '@radix-ui/react-accordion'
import { SaveIcon, X } from 'lucide-react'
import { useCreateEmailTemplate, useUpdateEmailTemplate, useEmailTemplate, useEmailTemplateCatalog, usePreviewEmailTemplate } from '@/lib/graphql-hooks/email-template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext } from '@repo/codegen/src/schema'
import { EmailTemplateSection } from './email-template-section'
import { EmailTemplateBasicFields } from './email-template-basic-fields'
import { EmailTemplateConfiguration } from './email-template-configuration'
import { EmailTemplateVariables } from './email-template-variables'
import { EmailTemplatePreview } from './email-template-preview'

interface EmailTemplateSheetProps {
  open: boolean
  templateId?: string
  onClose: () => void
  readOnly?: boolean
}

export const EmailTemplateSheet: React.FC<EmailTemplateSheetProps> = ({ open, templateId, onClose, readOnly = false }) => {
  const isEditMode = !!templateId

  const [active, setActive] = useState(true)
  const [name, setName] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [locale, setLocale] = useState('en')
  const [format, setFormat] = useState<EmailTemplateNotificationTemplateFormat>(EmailTemplateNotificationTemplateFormat.HTML)
  const [configData, setConfigData] = useState<Record<string, unknown>>({})
  const [initialized, setInitialized] = useState(false)

  const { entries, isLoading: isCatalogLoading } = useEmailTemplateCatalog()
  const { data: templateData, isLoading: isLoadingTemplate } = useEmailTemplate(isEditMode ? templateId : undefined)
  const { mutateAsync: createEmailTemplate, isPending: isCreating } = useCreateEmailTemplate()
  const { mutateAsync: updateEmailTemplate, isPending: isUpdating } = useUpdateEmailTemplate()
  const { successNotification, errorNotification } = useNotification()
  const [, copyToClipboard] = useCopyToClipboard()

  const isPending = isCreating || isUpdating

  const selectedEntry = useMemo(() => entries.find((e) => e.key === selectedKey), [entries, selectedKey])

  const debouncedConfigData = useDebounce(configData, 400)

  const {
    data: previewData,
    isFetching: isPreviewFetching,
    error: previewError,
  } = usePreviewEmailTemplate({
    key: selectedKey,
    defaults: debouncedConfigData,
    enabled: !!selectedEntry,
  })

  const previewHtml = previewData?.previewEmailTemplate ?? selectedEntry?.htmlPreview ?? ''

  const resetForm = () => {
    setActive(true)
    setName('')
    setSelectedKey('')
    setLocale('en')
    setFormat(EmailTemplateNotificationTemplateFormat.HTML)
    setConfigData({})
  }

  useEffect(() => {
    if (!open) {
      setInitialized(false)
      return
    }

    if (!isEditMode) {
      resetForm()
      setInitialized(true)
      return
    }

    const t = templateData?.emailTemplate
    if (t && !initialized) {
      setActive(t.active)
      setName(t.name)
      setSelectedKey(t.key)
      setLocale(t.locale ?? 'en')
      setFormat(t.format ?? EmailTemplateNotificationTemplateFormat.HTML)
      setConfigData(t.defaults ?? {})

      setInitialized(true)
    }
  }, [open, isEditMode, templateData, initialized])

  useEffect(() => {
    if (!open || isEditMode || selectedKey || entries.length !== 1) return
    const only = entries[0]
    setSelectedKey(only.key)
    setConfigData(only.exampleValues ?? {})
  }, [open, isEditMode, selectedKey, entries])

  const handleClose = () => {
    resetForm()
    setInitialized(false)
    onClose()
  }

  const handleKeyChange = (key: string) => {
    setSelectedKey(key)
    if (!isEditMode) {
      const entry = entries.find((e) => e.key === key)
      setConfigData(entry?.exampleValues ?? {})
    }
  }

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
            locale: locale.trim() || 'en',
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
            locale: locale.trim() || 'en',
            format,
            active,
            templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT,
          },
        })
        successNotification({ title: 'Email template created' })
      }
      handleClose()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const title = readOnly ? 'Preview Email Template' : isEditMode ? 'Edit Email Template' : 'Create Email Template'

  const isCatalogDrift = isEditMode && !!selectedKey && entries.length > 0 && !selectedEntry

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        className="flex flex-col"
        minWidth="40vw"
        initialWidth="50vw"
        header={
          <SheetHeader>
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-muted-foreground">
                Communications / <span className="font-semibold text-foreground">{title}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleClose} disabled={isPending}>
                    {readOnly ? 'Close' : 'Cancel'}
                  </Button>
                  {!readOnly && (
                    <Button variant="primary" onClick={handleSave} disabled={isPending || !name.trim() || !selectedKey} icon={<SaveIcon size={16} />} iconPosition="left">
                      {isPending ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Draft'}
                    </Button>
                  )}
                </div>
                <button type="button" onClick={handleClose} className="cursor-pointer mr-6">
                  <X size={16} />
                </button>
              </div>
            </div>
          </SheetHeader>
        }
      >
        {isEditMode && isLoadingTemplate ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="flex flex-col gap-6 mt-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-semibold">Active</span>
              <Switch checked={active} onCheckedChange={setActive} disabled={readOnly} />
            </div>

            <Accordion type="multiple" defaultValue={['basic', 'configuration', 'preview']} className="flex flex-col gap-6">
              <EmailTemplateSection value="basic" title="Basic" contentClassName="flex flex-col gap-4">
                <EmailTemplateBasicFields
                  name={name}
                  onNameChange={setName}
                  selectedKey={selectedKey}
                  onKeyChange={handleKeyChange}
                  locale={locale}
                  onLocaleChange={setLocale}
                  format={format}
                  onFormatChange={setFormat}
                  entries={entries}
                  selectedEntry={selectedEntry}
                  readOnly={readOnly}
                  isEditMode={isEditMode}
                />
              </EmailTemplateSection>

              <EmailTemplateSection value="configuration" title="Configuration">
                <EmailTemplateConfiguration
                  isCatalogLoading={isCatalogLoading}
                  isCatalogDrift={isCatalogDrift}
                  selectedKey={selectedKey}
                  selectedEntry={selectedEntry}
                  configData={configData}
                  onConfigChange={setConfigData}
                  readOnly={readOnly}
                />
              </EmailTemplateSection>

              {!!selectedEntry?.variables?.length && (
                <EmailTemplateSection value="variables" title="Variables">
                  <EmailTemplateVariables variables={selectedEntry.variables} onCopy={copyVariableToken} />
                </EmailTemplateSection>
              )}

              <EmailTemplateSection value="preview" title="Preview">
                <EmailTemplatePreview
                  previewHtml={previewHtml}
                  isFetching={isPreviewFetching}
                  errorMessage={previewError ? parseErrorMessage(previewError) : null}
                  isCatalogDrift={isCatalogDrift}
                  selectedKey={selectedKey}
                />
              </EmailTemplateSection>
            </Accordion>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
