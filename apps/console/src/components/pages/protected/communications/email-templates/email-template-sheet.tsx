'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Switch } from '@repo/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, SaveIcon, TriangleAlert, X } from 'lucide-react'
import { useCreateEmailTemplate, useUpdateEmailTemplate, useEmailTemplate, useEmailTemplateCatalog } from '@/lib/graphql-hooks/email-template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext } from '@repo/codegen/src/schema'
import { EmailTemplateConfigForm } from './email-template-config-form'

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

  const isPending = isCreating || isUpdating

  const selectedEntry = useMemo(() => entries.find((e) => e.key === selectedKey), [entries, selectedKey])

  const sanitizedPreview = useMemo(() => {
    if (!selectedEntry?.htmlPreview) return ''
    return DOMPurify.sanitize(selectedEntry.htmlPreview, { WHOLE_DOCUMENT: true })
  }, [selectedEntry])

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
      setConfigData((t.defaults as Record<string, unknown>) ?? {})

      setInitialized(true)
    }
  }, [open, isEditMode, templateData, initialized])

  const handleClose = () => {
    resetForm()
    setInitialized(false)
    onClose()
  }

  const handleKeyChange = (key: string) => {
    setSelectedKey(key)
    if (!isEditMode) setConfigData({})
  }

  const handleSave = async () => {
    if (!name.trim() || !selectedKey) return

    try {
      if (isEditMode) {
        await updateEmailTemplate({
          updateEmailTemplateId: templateId as string,
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
              <AccordionItem value="basic" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Basic</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          Name<span className="text-destructive">*</span>
                        </label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome Email" disabled={readOnly} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          Template<span className="text-destructive">*</span>
                        </label>
                        <Select value={selectedKey} onValueChange={handleKeyChange} disabled={readOnly || isEditMode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {entries.map((entry) => (
                              <SelectItem key={entry.key} value={entry.key}>
                                {entry.key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedEntry?.description && <p className="text-xs text-muted-foreground">{selectedEntry.description}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          Locale<span className="text-destructive">*</span>
                        </label>
                        <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en" disabled={readOnly} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Format</label>
                        <Select value={format} onValueChange={(val) => setFormat(val as EmailTemplateNotificationTemplateFormat)} disabled={readOnly || isEditMode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(EmailTemplateNotificationTemplateFormat).map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="configuration" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Configuration</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4">
                    {isCatalogLoading ? (
                      <p className="text-sm text-muted-foreground">Loading configuration...</p>
                    ) : isCatalogDrift ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          <TriangleAlert size={16} className="shrink-0 text-yellow-500" />
                          <span>
                            This template uses the catalog key <span className="font-mono">{selectedKey}</span>, which is no longer available. Showing its saved configuration as read-only JSON.
                          </span>
                        </div>
                        <pre className="overflow-auto rounded-md border border-border bg-card p-3 text-xs">{JSON.stringify(configData, null, 2)}</pre>
                      </div>
                    ) : selectedEntry ? (
                      <EmailTemplateConfigForm schema={selectedEntry.configSchema} data={configData} onChange={setConfigData} readOnly={readOnly} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a template to configure its fields.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="preview" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Preview</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4">
                    {sanitizedPreview ? (
                      <>
                        <iframe srcDoc={sanitizedPreview} title="Email template preview" sandbox="" className="w-full h-150 rounded-md border border-border bg-white" />
                        <p className="mt-2 text-xs text-muted-foreground">Preview shows the template rendered with example values.</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a template to preview it.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
