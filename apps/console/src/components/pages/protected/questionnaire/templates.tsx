'use client'

import { useRouter } from 'next/navigation'
import { TemplateWhereInput, TemplateDocumentType } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@repo/ui/select'
import { Form, FormControl, FormField, FormItem } from '@repo/ui/form'
import { z, infer as zInfer } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pageStyles } from './page.styles'
import { AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { useTemplates } from '@/lib/graphql-hooks/templates'

export const TemplateList = () => {
  const router = useRouter()

  const { selectTemplate } = pageStyles()

  const handleFromTemplate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value
    router.push(`/questionnaires/questionnaire-editor?template_id=${templateId}`)
  }

  const whereFilter: TemplateWhereInput = {
    templateType: TemplateDocumentType.ROOTTEMPLATE,
  }

  const { data: allTemplates, isLoading, isError } = useTemplates({ where: whereFilter })

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
    return <div>failed to load</div>
  }

  // Wait for the session and template data
  if (isLoading) {
    return <div>loading...</div>
  }

  const templates = allTemplates?.templates?.edges || []

  return (
    <>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Questionnaire From Template</AlertDialogTitle>
          <AlertDialogDescription>Choose a template to create a new questionnaire</AlertDialogDescription>
        </AlertDialogHeader>

        <div className={selectTemplate()}>
          <Form {...form}>
            <FormField
              name="templateId"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template?.node?.id} value={template?.node?.id || ''}>
                            {template?.node?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="filled" onClick={handleSubmit((data) => handleFromTemplate({ target: { value: data.templateId } } as React.ChangeEvent<HTMLSelectElement>))}>
              Create Questionnaire
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </>
  )
}
