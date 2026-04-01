'use client'

import React, { useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Switch } from '@repo/ui/switch'
import { Badge } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, Plus, SaveIcon, SquarePlus, X } from 'lucide-react'
import { useCreateEmailTemplate } from '@/lib/graphql-hooks/email-template'
import { useEmailBrandingsWithFilter } from '@/lib/graphql-hooks/email-branding'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext } from '@repo/codegen/src/schema'
import { EmailBrandingPanel } from './email-branding-panel'

interface CreateTemplateSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (templateId: string, templateName: string) => void
}

const DEFAULT_VARIABLES = ['{due_date}', '{company_name}', '{sender_name}', '{unsubscribe_link}', '{support_email}']

export const CreateTemplateSheet: React.FC<CreateTemplateSheetProps> = ({ open, onClose, onCreated }) => {
  const [active, setActive] = useState(true)
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [locale, setLocale] = useState('en')
  const [format, setFormat] = useState<EmailTemplateNotificationTemplateFormat>(EmailTemplateNotificationTemplateFormat.HTML)
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [preheaderTemplate, setPreheaderTemplate] = useState('')
  const [bodyTemplate, setBodyTemplate] = useState('')
  const [textTemplate, setTextTemplate] = useState('')
  const [customVariable, setCustomVariable] = useState('')
  const [variables, setVariables] = useState<string[]>([...DEFAULT_VARIABLES])
  const [emailBrandingID, setEmailBrandingID] = useState<string | undefined>()
  const [brandingPanelOpen, setBrandingPanelOpen] = useState(false)

  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const { mutateAsync: createEmailTemplate, isPending } = useCreateEmailTemplate()
  const { successNotification, errorNotification } = useNotification()
  const { emailBrandingsNodes } = useEmailBrandingsWithFilter({ where: {}, enabled: open })

  const resetForm = () => {
    setActive(true)
    setName('')
    setKey('')
    setDescription('')
    setLocale('en')
    setFormat(EmailTemplateNotificationTemplateFormat.HTML)
    setSubjectTemplate('')
    setPreheaderTemplate('')
    setBodyTemplate('')
    setTextTemplate('')
    setCustomVariable('')
    setVariables([...DEFAULT_VARIABLES])
    setEmailBrandingID(undefined)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setKey(value.trim().toLowerCase().replace(/\s+/g, '-'))
  }

  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = bodyTemplate.substring(0, start) + variable + bodyTemplate.substring(end)
      setBodyTemplate(newBody)
      setTimeout(() => {
        textarea.focus()
        const cursorPos = start + variable.length
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    } else {
      setBodyTemplate((prev) => prev + variable)
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
      const result = await createEmailTemplate({
        input: {
          name: name.trim(),
          key: key.trim(),
          description: description.trim() || undefined,
          locale: locale.trim() || 'en',
          format,
          active,
          subjectTemplate: subjectTemplate.trim() || undefined,
          preheaderTemplate: preheaderTemplate.trim() || undefined,
          bodyTemplate: bodyTemplate.trim() || undefined,
          textTemplate: textTemplate.trim() || undefined,
          templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT,
          // emailBrandingIDs exists on backend schema but generated types have stale emailBrandingID
          ...(emailBrandingID ? { emailBrandingIDs: [emailBrandingID] } : {}),
          jsonconfig: {
            tokens: variables.map((v) => v.replace(/[{}]/g, '')),
            addButtonLink: false,
          },
        } as never,
      })

      const emailTemplate = result?.createEmailTemplate?.emailTemplate
      if (emailTemplate?.id) {
        successNotification({ title: 'Email template created' })
        resetForm()
        onCreated(emailTemplate.id, name.trim())
      }
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
            <SheetTitle className="sr-only">Create Template</SheetTitle>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-muted-foreground">
                Campaign Template / <span className="font-semibold text-foreground">Create Template</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleClose} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button variant="secondary" onClick={handleSave} disabled={isPending || !name.trim() || !key.trim()} icon={<SaveIcon size={16} />} iconPosition="left">
                    {isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={isPending || !name.trim() || !key.trim()}>
                    {isPending ? 'Saving...' : 'Next'}
                  </Button>
                </div>
                <button type="button" onClick={handleClose} className="cursor-pointer mr-6">
                  <X size={16} />
                </button>
              </div>
            </div>
          </SheetHeader>
        }
      >
        <div className="flex flex-col gap-6 mt-2">
          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <span className="text-sm font-semibold">Active</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <Accordion type="multiple" defaultValue={['basic', 'email-content', 'branding-link']} className="flex flex-col gap-6">
            {/* Basic Section */}
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
                      <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Welcome Email" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">
                        Key<span className="text-destructive">*</span>
                      </label>
                      <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. welcome-email" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the purpose of this template..." rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">
                        Locale<span className="text-destructive">*</span>
                      </label>
                      <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Format</label>
                      <Select value={format} onValueChange={(val) => setFormat(val as EmailTemplateNotificationTemplateFormat)}>
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

            {/* Email Content Section */}
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

                    <TabsContent value="customize" className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Subject Template</label>
                        <Input value={subjectTemplate} onChange={(e) => setSubjectTemplate(e.target.value)} placeholder="e.g. Welcome to the Team!" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Preheader Template</label>
                        <Input value={preheaderTemplate} onChange={(e) => setPreheaderTemplate(e.target.value)} placeholder="e.g. Get started with Openlane today" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Body Template</label>
                        <Textarea ref={bodyRef} value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} placeholder="Write your email body content here..." rows={6} />
                      </div>

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

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Text Template</label>
                        <Textarea value={textTemplate} onChange={(e) => setTextTemplate(e.target.value)} placeholder="Plain text fallback content..." rows={4} />
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="flex flex-col gap-4">
                      <div className="rounded-lg border border-border bg-background p-4">
                        <div className="mb-3 border-b border-border pb-3">
                          <p className="text-xs text-muted-foreground">Subject</p>
                          <p className="text-sm font-medium">{subjectTemplate || '(No subject)'}</p>
                        </div>
                        {preheaderTemplate && (
                          <div className="mb-3 border-b border-border pb-3">
                            <p className="text-xs text-muted-foreground">Preheader</p>
                            <p className="text-sm">{preheaderTemplate}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Body</p>
                          {format === EmailTemplateNotificationTemplateFormat.HTML ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: bodyTemplate || '<em>No body content</em>' }} />
                          ) : (
                            <pre className="text-sm whitespace-pre-wrap">{bodyTemplate || '(No body content)'}</pre>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Branding Link Section */}
            <AccordionItem value="branding-link" className="rounded-lg border border-border bg-card overflow-hidden">
              <AccordionTrigger asChild>
                <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                  <span className="text-sm font-semibold">Branding Link</span>
                  <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="border-t border-border px-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Email Branding Config</label>
                    <Select value={emailBrandingID ?? ''} onValueChange={(val) => setEmailBrandingID(val || undefined)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select branding..." />
                      </SelectTrigger>
                      <SelectContent>
                        {emailBrandingsNodes.map((branding) => (
                          <SelectItem key={branding.id} value={branding.id}>
                            {branding.name || branding.id}
                          </SelectItem>
                        ))}
                        <div className="border-t border-border mt-1 pt-1 px-2 pb-1">
                          <button type="button" className="flex items-center gap-2 w-full py-1.5 text-sm font-medium text-primary cursor-pointer" onClick={() => setBrandingPanelOpen(true)}>
                            <SquarePlus size={16} />
                            Create New
                          </button>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <EmailBrandingPanel
          open={brandingPanelOpen}
          onClose={() => setBrandingPanelOpen(false)}
          onSave={(brandingId) => {
            setEmailBrandingID(brandingId)
            setBrandingPanelOpen(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
