'use client'

import React, { useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { Edit, Send, Trash2 } from 'lucide-react'
import { useDeleteTemplate } from '@/lib/graphql-hooks/templates'
import { useNotification } from '@/hooks/useNotification'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { Form, FormField, FormItem, FormControl, FormMessage } from '@repo/ui/form'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@repo/ui/input'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const ViewQuestionnaire = dynamic(() => import('@/components/pages/protected/questionnaire/questionnaire-viewer'), {
  ssr: false,
})

const QuestionnaireViewerPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingId = searchParams.get('id') as string

  const { data: permission, isLoading } = useOrganizationRoles()
  const editAllowed = canEdit(permission?.roles)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteTemplate } = useDeleteTemplate()

  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  const handleEdit = () => {
    router.push(`/questionnaires/questionnaire-editor?id=${existingId}`)
  }

  const handleSend: SubmitHandler<{ email: string }> = (data) => {
    return null
    successNotification({ title: `Email sent to ${data.email}` })
    form.reset()
    setIsSendDialogOpen(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTemplate({ deleteTemplateId: existingId })
      successNotification({ title: 'Questionnaire deleted successfully' })
      router.push('/questionnaires')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <PageHeading eyebrow="Questionnaires" heading="Preview" />
        {!isLoading && (
          <div className="flex gap-2 items-center">
            <Button
  disabled
  type="button"
  className="h-8 px-3"
  icon={<Send />}
  iconPosition="left"
>
  Send (Coming Soon)
</Button>   

            {editAllowed && (
              <>
                <Button type="button" className="h-8 px-3" icon={<Edit />} iconPosition="left" onClick={handleEdit}>
                  Edit
                </Button>
                <Button type="button" className="h-8 px-3" icon={<Trash2 />} iconPosition="left" onClick={() => setIsDeleteDialogOpen(true)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <ViewQuestionnaire existingId={existingId} />

      {/* Send Dialog */}
      <AlertDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Questionnaire</AlertDialogTitle>
            <AlertDialogDescription>Enter the recipient&apos;s email to send the questionnaire.</AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={form.handleSubmit(handleSend)}>Send</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone and will permanently delete the questionnaire.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Questionnaire
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default QuestionnaireViewerPage
