'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Switch } from '@repo/ui/switch'
import { SaveIcon, X } from 'lucide-react'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { useCreateTemplate } from '@/lib/graphql-hooks/template'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TemplateDocumentType } from '@repo/codegen/src/schema'

interface CreateTemplateSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (templateId: string) => void
}

export const CreateTemplateSheet: React.FC<CreateTemplateSheetProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [tokenOptions, setTokenOptions] = useState<Option[]>([])
  const [addButtonLink, setAddButtonLink] = useState(false)

  const { mutateAsync: createTemplate, isPending } = useCreateTemplate()
  const { successNotification, errorNotification } = useNotification()

  const resetForm = () => {
    setName('')
    setSubject('')
    setBody('')
    setTokenOptions([])
    setAddButtonLink(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) return

    try {
      const tokens = tokenOptions.map((t) => t.value)
      const result = await createTemplate({
        input: {
          name: name.trim(),
          templateType: TemplateDocumentType.DOCUMENT,
          jsonconfig: {
            subject: subject.trim(),
            body: body.trim(),
            tokens,
            addButtonLink,
          },
        },
      })

      const templateId = result?.createTemplate?.template?.id
      if (templateId) {
        successNotification({ title: 'Template created' })
        resetForm()
        onCreated(templateId)
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
                  <Button variant="secondary" onClick={handleSave} disabled={isPending || !name.trim()} icon={<SaveIcon size={16} />} iconPosition="left">
                    {isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={isPending || !name.trim()}>
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
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-base font-semibold">Create Email Template</h3>
          <p className="text-sm text-muted-foreground">Design your email content with dynamic tokens</p>
        </div>

        <div className="flex flex-col gap-6 mt-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Template Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Custom Phishing Email" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Action Required: Verify Your Account" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email Body</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email here..." rows={6} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Insert Tokens</label>
            <MultipleSelector
              value={tokenOptions}
              onChange={setTokenOptions}
              creatable
              placeholder="Type a token and press Enter..."
              hidePlaceholderWhenSelected
              hideClearAllButton
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={addButtonLink} onCheckedChange={setAddButtonLink} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Add Button Link</span>
              <span className="text-sm text-muted-foreground">This would be the description of this action</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
