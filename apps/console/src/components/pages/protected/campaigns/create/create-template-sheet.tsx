'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Switch } from '@repo/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, SaveIcon, X } from 'lucide-react'
import { useCreateEmailTemplate } from '@/lib/graphql-hooks/email-template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext } from '@repo/codegen/src/schema'

interface CreateTemplateSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (templateId: string, templateName: string) => void
}

export const CreateTemplateSheet: React.FC<CreateTemplateSheetProps> = ({ open, onClose, onCreated }) => {
  const [active, setActive] = useState(true)
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [locale, setLocale] = useState('en')
  const [format, setFormat] = useState<EmailTemplateNotificationTemplateFormat>(EmailTemplateNotificationTemplateFormat.HTML)

  const { mutateAsync: createEmailTemplate, isPending } = useCreateEmailTemplate()
  const { successNotification, errorNotification } = useNotification()

  const resetForm = () => {
    setActive(true)
    setName('')
    setKey('')
    setDescription('')
    setLocale('en')
    setFormat(EmailTemplateNotificationTemplateFormat.HTML)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setKey(value.trim().toLowerCase().replace(/\s+/g, '-'))
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
          templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT,
        },
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

          <Accordion type="multiple" defaultValue={['basic', 'email-content']} className="flex flex-col gap-6">
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
                  </Tabs>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  )
}
