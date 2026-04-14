'use client'

import React, { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Switch } from '@repo/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, SaveIcon, X } from 'lucide-react'
import { useCreateNotificationTemplate, useUpdateNotificationTemplate, useNotificationTemplate } from '@/lib/graphql-hooks/notification-template'
import { useEmailTemplatesWithFilter } from '@/lib/graphql-hooks/email-template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { NotificationTemplateChannel, NotificationTemplateNotificationTemplateFormat, NotificationTemplateTemplateContext } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

interface NotificationTemplateSheetProps {
  open: boolean
  templateId?: string
  onClose: () => void
  readOnly?: boolean
}

export const NotificationTemplateSheet: React.FC<NotificationTemplateSheetProps> = ({ open, templateId, onClose, readOnly = false }) => {
  const isEditMode = !!templateId

  const [active, setActive] = useState(true)
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [channel, setChannel] = useState<NotificationTemplateChannel>(NotificationTemplateChannel.EMAIL)
  const [locale, setLocale] = useState('en')
  const [titleTemplate, setTitleTemplate] = useState('')
  const [format, setFormat] = useState<NotificationTemplateNotificationTemplateFormat>(NotificationTemplateNotificationTemplateFormat.HTML)
  const [bodyTemplate, setBodyTemplate] = useState('')
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [topicPattern, setTopicPattern] = useState('')
  const [emailTemplateID, setEmailTemplateID] = useState<string | undefined>()
  const [initialized, setInitialized] = useState(false)

  const { data: templateData, isLoading: isLoadingTemplate } = useNotificationTemplate(isEditMode ? templateId : undefined)
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreateNotificationTemplate()
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateNotificationTemplate()
  const { successNotification, errorNotification } = useNotification()
  const { emailTemplatesNodes } = useEmailTemplatesWithFilter({ where: {}, enabled: open })

  const isPending = isCreating || isUpdating

  const resetForm = () => {
    setActive(true)
    setName('')
    setKey('')
    setDescription('')
    setChannel(NotificationTemplateChannel.EMAIL)
    setLocale('en')
    setTitleTemplate('')
    setFormat(NotificationTemplateNotificationTemplateFormat.HTML)
    setBodyTemplate('')
    setSubjectTemplate('')
    setTopicPattern('')
    setEmailTemplateID(undefined)
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

    const t = templateData?.notificationTemplate
    if (t && !initialized) {
      setActive(t.active)
      setName(t.name)
      setKey(t.key)
      setDescription(t.description ?? '')
      setLocale(t.locale ?? 'en')
      setTitleTemplate(t.titleTemplate ?? '')
      setBodyTemplate(t.bodyTemplate ?? '')
      setSubjectTemplate(t.subjectTemplate ?? '')
      setTopicPattern(t.topicPattern ?? '')
      setEmailTemplateID(t.emailTemplateID ?? undefined)

      if ('channel' in t && t.channel) {
        setChannel(t.channel as NotificationTemplateChannel)
      }
      if ('format' in t && t.format) {
        setFormat(t.format as NotificationTemplateNotificationTemplateFormat)
      }

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

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) return

    try {
      if (isEditMode) {
        await updateTemplate({
          updateNotificationTemplateId: templateId as string,
          input: {
            name: name.trim(),
            key: key.trim(),
            description: description.trim() || undefined,
            channel,
            locale: locale.trim() || 'en',
            format,
            active,
            titleTemplate: titleTemplate.trim() || undefined,
            bodyTemplate: bodyTemplate.trim() || undefined,
            subjectTemplate: subjectTemplate.trim() || undefined,
            topicPattern: topicPattern.trim() || undefined,
            emailTemplateID: emailTemplateID || undefined,
            templateContext: NotificationTemplateTemplateContext.CAMPAIGN_RECIPIENT,
          },
        })
        successNotification({ title: 'Notification template updated' })
      } else {
        await createTemplate({
          input: {
            name: name.trim(),
            key: key.trim(),
            description: description.trim() || undefined,
            channel,
            locale: locale.trim() || 'en',
            format,
            active,
            titleTemplate: titleTemplate.trim() || undefined,
            bodyTemplate: bodyTemplate.trim() || undefined,
            subjectTemplate: subjectTemplate.trim() || undefined,
            topicPattern: topicPattern.trim(),
            emailTemplateID: emailTemplateID || undefined,
            templateContext: NotificationTemplateTemplateContext.CAMPAIGN_RECIPIENT,
          },
        })
        successNotification({ title: 'Notification template created' })
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
            <SheetTitle className="sr-only">{readOnly ? 'Preview Notification Template' : isEditMode ? 'Edit Notification Template' : 'Create Notification Template'}</SheetTitle>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-muted-foreground">
                Communications / <span className="font-semibold text-foreground">{readOnly ? 'Preview Notification Template' : isEditMode ? 'Edit Notification Template' : 'Create Notification Template'}</span>
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

            <Accordion type="multiple" defaultValue={['basic', 'content', 'links']} className="flex flex-col gap-6">
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
                        <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Campaign Reminder Notification" disabled={readOnly} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">
                          Key<span className="text-destructive">*</span>
                        </label>
                        <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. campaign-reminder-notif" disabled={readOnly} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the purpose of this template..." rows={3} disabled={readOnly} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Channel</label>
                        <Select value={channel} onValueChange={(val) => setChannel(val as NotificationTemplateChannel)} disabled={readOnly}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(NotificationTemplateChannel).map((ch) => (
                              <SelectItem key={ch} value={ch}>
                                {getEnumLabel(ch)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Locale</label>
                        <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en" disabled={readOnly} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Topic Pattern</label>
                      <Input value={topicPattern} onChange={(e) => setTopicPattern(e.target.value)} placeholder="e.g. campaign.reminder" disabled={readOnly} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="content" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Content</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Title Template</label>
                      <Input value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} placeholder="e.g. Campaign deadline approaching" disabled={readOnly} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Subject Template</label>
                      <Input value={subjectTemplate} onChange={(e) => setSubjectTemplate(e.target.value)} placeholder="e.g. Important Update from CEO" disabled={readOnly} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Format</label>
                      <Select value={format} onValueChange={(val) => setFormat(val as NotificationTemplateNotificationTemplateFormat)} disabled={readOnly}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(NotificationTemplateNotificationTemplateFormat).map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Body Template</label>
                      <Textarea value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} placeholder="Write your notification body content here..." rows={8} className="font-mono text-sm" disabled={readOnly} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="links" className="rounded-lg border border-border bg-card overflow-hidden">
                <AccordionTrigger asChild>
                  <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
                    <span className="text-sm font-semibold">Links</span>
                    <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Email Template</label>
                      <Select value={emailTemplateID ?? ''} onValueChange={(val) => setEmailTemplateID(val || undefined)} disabled={readOnly}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select email template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {emailTemplatesNodes.map((et) => (
                            <SelectItem key={et.id} value={et.id}>
                              {et.name || et.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
