'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TemplateWhereInput, TemplateDocumentType } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@repo/ui/select'
import { Form, FormControl, FormField, FormItem } from '@repo/ui/form'
import { z, infer as zInfer } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pageStyles } from './page.styles'
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import { useCreateAssessment } from '@/lib/graphql-hooks/assessments'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

export const TemplateList = () => {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createAssessment } = useCreateAssessment()

  const { selectTemplate } = pageStyles()

  const handleFromTemplate = async (templateId: string) => {
    try {
      const selectedTemplate = templates?.find((template) => template?.id === templateId)

      const suffix = `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      const response = await createAssessment({
        input: {
          name: `${selectedTemplate?.name}${suffix}`,
          templateID: templateId,
        },
      })

      const assessmentId = response.createAssessment?.assessment?.id
      if (assessmentId) {
        successNotification({
          title: 'Questionnaire created successfully',
        })
        router.push(`/questionnaires/questionnaire-viewer?id=${assessmentId}`)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const whereFilter: TemplateWhereInput = {
    templateType: TemplateDocumentType.DOCUMENT,
  }

  const { templates, isLoading, isError } = useTemplates({ where: whereFilter })

  const formSchema = z.object({
    templateId: z.string(),
  })

  type FormData = zInfer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  const { control, handleSubmit } = form

  if (isError) {
    return (
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Questionnaire From Template</DialogTitle>
          <DialogDescription>Failed to load templates.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <CancelButton />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    )
  }

  if (isLoading) {
    return (
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Questionnaire From Template</DialogTitle>
          <DialogDescription>Loading templates...</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <CancelButton />
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    )
  }

  const hasTemplates = templates && templates.length > 0

  return (
    <>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Questionnaire From Template</DialogTitle>
          <DialogDescription>Choose a template to create a new questionnaire</DialogDescription>
        </DialogHeader>

        <div className={selectTemplate()}>
          <Form {...form}>
            <FormField
              name="templateId"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange} disabled={!hasTemplates}>
                      <SelectTrigger>
                        <SelectValue placeholder={hasTemplates ? 'Select template' : 'No templates available'} />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template?.id} value={template?.id || ''}>
                            {template?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
          <div className="mt-2 text-sm text-muted-foreground flex gap-2">
            <Link href="/templates" className="text-primary hover:underline">
              View all templates
            </Link>
            {!hasTemplates && (
              <>
                <span>•</span>
                <Link href="/templates/template-editor" className="text-primary hover:underline">
                  Create a new template
                </Link>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <CancelButton />
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary" onClick={handleSubmit((data) => handleFromTemplate(data.templateId))}>
              Create Questionnaire
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </>
  )
}
