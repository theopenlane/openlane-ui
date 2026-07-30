'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useNotification } from '@/hooks/useNotification'
import { useCreateAssessmentTemplate } from '@/lib/graphql-hooks/assessment'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type Assessment } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import MultipleSelector from '@repo/ui/multiple-selector'
import { Textarea } from '@repo/ui/textarea'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z, type infer as zInfer } from 'zod'

const formSchema = z.object({
  name: z.string().trim().max(255, 'Name must be 255 characters or fewer'),
  description: z.string().trim().max(1000, 'Description must be 1000 characters or fewer'),
  tags: z.array(z.string().trim().min(1)),
})

type FormData = zInfer<typeof formSchema>

type AssessmentTemplateCloneProps = {
  open: boolean
  assessment?: Assessment | null
  onOpenChange: (open: boolean) => void
}

export const CreateAssessmentTemplateDialog = ({ open, onOpenChange, assessment }: AssessmentTemplateCloneProps) => {
  const { tagOptions } = useGetTags()
  const { mutateAsync: createAssessmentTemplate, isPending } = useCreateAssessmentTemplate()

  const { successNotification, errorNotification } = useNotification()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      tags: [],
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      name: assessment?.name ?? '',
      description: '',
      tags: assessment?.tags ?? [],
    })
  }, [assessment?.name, assessment?.tags, form, open])

  const handleSubmit = async (data: FormData) => {
    if (!assessment?.id || isPending) {
      return
    }

    try {
      await createAssessmentTemplate({
        input: {
          assessmentID: assessment.id,
          name: data.name || undefined,
          description: data.description || undefined,
          tags: data.tags,
        },
      })

      successNotification({ title: 'Template created successfully' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const isSubmitting = isPending || form.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Template from Assessment</DialogTitle>
          <DialogDescription>{assessment?.name ? `Create a reusable template from "${assessment.name}".` : 'Create a reusable template from this assessment.'}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="assessment-template-name">Name</FormLabel>
                  <FormControl>
                    <Input id="assessment-template-name" {...field} placeholder={assessment?.name ?? 'Template name'} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="assessment-template-description">Description</FormLabel>
                  <FormControl>
                    <Textarea id="assessment-template-description" {...field} placeholder="Describe this template" rows={3} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      options={tagOptions}
                      placeholder="Add tag..."
                      creatable
                      value={(field.value ?? []).map((tag) => ({ value: tag, label: tag }))}
                      onChange={(selectedOptions) => field.onChange(selectedOptions.map((option) => option.value))}
                      className="w-full"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!assessment?.id || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
