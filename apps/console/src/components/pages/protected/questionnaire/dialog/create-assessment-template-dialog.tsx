'use client'

import { useNotification } from '@/hooks/useNotification'
import { useCreateAssessmentTemplate } from '@/lib/graphql-hooks/assessment'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type Assessment } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { Textarea } from '@repo/ui/textarea'
import { useEffect, useMemo, useState } from 'react'

type AssessmentTemplateCloneProps = {
  open: boolean
  assessment?: Assessment | null
  onOpenChange: (open: boolean) => void
}

export const CreateAssessmentTemplateDialog = ({ open, onOpenChange, assessment }: AssessmentTemplateCloneProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<Option[]>([])

  const { tagOptions } = useGetTags()
  const { mutateAsync: createAssessmentTemplate, isPending } = useCreateAssessmentTemplate()

  const { successNotification, errorNotification } = useNotification()

  const defaultTags = useMemo(() => (assessment?.tags ?? []).map((tag) => ({ value: tag, label: tag })), [assessment?.tags])

  useEffect(() => {
    if (!open) {
      return
    }

    setName(assessment?.name ?? '')
    setDescription('')
    setSelectedTags(defaultTags)
  }, [assessment?.name, defaultTags, open])

  const handleSubmit = async () => {
    if (!assessment?.id || isPending) {
      return
    }

    try {
      await createAssessmentTemplate({
        input: {
          assessmentID: assessment.id,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          tags: selectedTags.map((tag) => tag.value),
        },
      })

      successNotification({ title: 'Template created successfully' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Template from Assessment</DialogTitle>
          <DialogDescription>{assessment?.name ? `Create a reusable template from "${assessment.name}".` : 'Create a reusable template from this assessment.'}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assessment-template-name">Name</Label>
            <Input id="assessment-template-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={assessment?.name ?? 'Template name'} disabled={isPending} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assessment-template-description">Description</Label>
            <Textarea
              id="assessment-template-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this template"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <MultipleSelector options={tagOptions} placeholder="Add tag..." creatable value={selectedTags} onChange={setSelectedTags} className="w-full" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!assessment?.id || isPending}>
            {isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
