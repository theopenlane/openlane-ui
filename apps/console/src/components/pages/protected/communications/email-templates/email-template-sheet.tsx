'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Switch } from '@repo/ui/switch'
import { Badge } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, Plus, SaveIcon, X } from 'lucide-react'
import { useCreateEmailTemplate, useUpdateEmailTemplate, useEmailTemplate } from '@/lib/graphql-hooks/email-template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext } from '@repo/codegen/src/schema'

interface EmailTemplateSheetProps {
  open: boolean
  templateId?: string
  onClose: () => void
  readOnly?: boolean
}

const DEFAULT_VARIABLES = ['{due_date}', '{company_name}', '{sender_name}', '{unsubscribe_link}', '{support_email}']

export const EmailTemplateSheet: React.FC<EmailTemplateSheetProps> = ({ open, templateId, onClose, readOnly = false }) => {
  const isEditMode = !!templateId

  const [active, setActive] = useState(true)
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [locale, setLocale] = useState('en')
  const [format, setFormat] = useState<EmailTemplateNotificationTemplateFormat>(EmailTemplateNotificationTemplateFormat.HTML)
  const [customVariable, setCustomVariable] = useState('')
  const [variables, setVariables] = useState<string[]>([...DEFAULT_VARIABLES])
  const [initialized, setInitialized] = useState(false)

  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const { data: templateData, isLoading: isLoadingTemplate } = useEmailTemplate(isEditMode ? templateId : undefined)
  const { mutateAsync: createEmailTemplate, isPending: isCreating } = useCreateEmailTemplate()
  const { mutateAsync: updateEmailTemplate, isPending: isUpdating } = useUpdateEmailTemplate()
  const { successNotification, errorNotification } = useNotification()

  const isPending = isCreating || isUpdating

  const resetForm = () => {
    setActive(true)
    setName('')
    setKey('')
    setDescription('')
    setLocale('en')
    setFormat(EmailTemplateNotificationTemplateFormat.HTML)
    setCustomVariable('')
    setVariables([...DEFAULT_VARIABLES])
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
      setKey(t.key)
      setDescription(t.description ?? '')
      setLocale(t.locale ?? 'en')
      setFormat(t.format ?? EmailTemplateNotificationTemplateFormat.HTML)
      setVariables(DEFAULT_VARIABLES)

      setInitialized(true)
    }
  }, [open, isEditMode, templateData, initialized])

  const handleClose = () => {
    resetForm()
    setInitialized(false)
    onClose()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!isEditMode) {
      setKey(value.trim().toLowerCase().replace(/\s+/g, '-'))
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current
    if (textarea) {
      const start = textarea.selectionStart
      setTimeout(() => {
        textarea.focus()
        const cursorPos = start + variable.length
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    }
  }

  const addCustomVariable = () => {
    if (!customVariable.trim()) return
    const formatted = customVariable.trim().startsWith('{') ? customVariable.trim() : `{${customVariable.trim()}}`
    if (!variables.includes(formatted)) {
      setVariables((prev) => [...prev, formatted])
    }
    insertVariable(formatted)
    setCustomVariable('')
  }

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) return

    try {
      if (isEditMode) {
        await updateEmailTemplate({
          updateEmailTemplateId: templateId as string,
          input: {
            name: name.trim(),
            key: key.trim(),
            description: description.trim() || undefined,
            locale: locale.trim() || 'en',
            format,
            active,
          },
        })
        successNotification({ title: 'Email template updated' })
      } else {
        await createEmailTemplate({
          input: {
            name: name.trim(),
            key: key.trim(),
            description: description.trim() || undefined,
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

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        className="flex flex-col"
        minWidth="40vw"
        initialWidth="50vw"
        header={
          <SheetHeader>
            <SheetTitle className="sr-only">{readOnly ? 'Preview Email Template' : isEditMode ? 'Edit Email Template' : 'Create Email Template'}</SheetTitle>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-muted-foreground">
                Communications / <span className="font-semibold text-foreground">{readOnly ? 'Preview Email Template' : isEditMode ? 'Edit Email Template' : 'Create Email Template'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleClose} disabled={isPending}>
                    {readOnly ? 'Close' : 'Cancel'}
                  </Button>
                  {!readOnly && (
                    <Button variant="primary" onClick={handleSave} disabled={isPending || !name.trim() || !key.trim()} icon={<SaveIcon size={16} />} iconPosition="left">
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

            <Accordion type="multiple" defaultValue={['basic', 'email-content']} className="flex flex-col gap-6">
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
                        <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Welcome Email" disabled={readOnly} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          Key<span className="text-destructive">*</span>
                        </label>
                        <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. welcome-email" disabled={readOnly} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the purpose of this template..." rows={3} disabled={readOnly} />
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
                        <Select value={format} onValueChange={(val) => setFormat(val as EmailTemplateNotificationTemplateFormat)} disabled={readOnly}>
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

                    <div className="text-sm text-muted-foreground">
                      Version: <span className="font-medium text-foreground">1.0.0</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="email-content" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Email Content</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4">
                    <Tabs defaultValue="customize" variant="underline">
                      <TabsList className="mb-4">
                        <TabsTrigger value="customize">Customize</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>

                      {!readOnly && (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              value={customVariable}
                              onChange={(e) => setCustomVariable(e.target.value)}
                              placeholder="Enter a variable to insert"
                              className="flex-1"
                              onKeyDown={(e) => e.key === 'Enter' && addCustomVariable()}
                            />
                            <Button variant="secondary" onClick={addCustomVariable} icon={<Plus size={16} />} iconPosition="left">
                              Add Variable
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {variables.map((v) => (
                              <Badge key={v} variant="outline" className="cursor-pointer font-mono text-xs hover:bg-accent" onClick={() => insertVariable(v)}>
                                {v}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Click a variable to insert it into the body template</p>
                        </>
                      )}
                    </Tabs>
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
