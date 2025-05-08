'use client'

import { Edit, Trash2, Send } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@repo/ui/input'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { z, infer as zInfer } from 'zod'
import { useDeleteTemplate } from '@/lib/graphql-hooks/templates'

type TemplateActionsProps = {
  templateId: string
}

const ICON_SIZE = 16

export const Actions = ({ templateId }: TemplateActionsProps) => {
  const router = useRouter()
  const { emailRow } = pageStyles()
  const { mutateAsync: deleteTemplate } = useDeleteTemplate()
  const { successNotification, errorNotification } = useNotification()

  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEditTemplate = () => {
    router.push(`/questionnaires/questionnaire-editor?id=${templateId}`)
  }

  const handleDeleteTemplate = async () => {
    try {
      await deleteTemplate({ deleteTemplateId: templateId })
      successNotification({
        title: 'Questionnaire deleted successfully',
      })
    } catch {
      errorNotification({
        title: 'Something went wrong while deleting the questionnaire',
        variant: 'destructive',
      })
    }
  }

  const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  })

  type FormData = zInfer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const handleSendForm: SubmitHandler<FormData> = async (data) => {
    successNotification({
      title: 'Email sent successfully to ' + data.email,
    })

    form.reset()
    setIsSendDialogOpen(false)
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <Edit
          size={ICON_SIZE}
          onClick={(e) => {
            e.stopPropagation()
            handleEditTemplate()
          }}
          className="cursor-pointer"
        />
        <Send
          size={ICON_SIZE}
          onClick={(e) => {
            e.stopPropagation()
            setIsSendDialogOpen(true)
          }}
          className="cursor-pointer"
        />
        <Trash2
          size={ICON_SIZE}
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteDialogOpen(true)
          }}
          className="cursor-pointer"
        />
      </div>

      <AlertDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Questionnaire</AlertDialogTitle>
            <AlertDialogDescription>Send the questionnaire to recipient</AlertDialogDescription>
          </AlertDialogHeader>
          <div className={emailRow()}>
            Email:{' '}
            <Form {...form}>
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input variant="medium" autoComplete="email" type="email" {...field} />
                    </FormControl>
                    {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
                  </FormItem>
                )}
              />
            </Form>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="filled" type="submit" onClick={handleSubmit(handleSendForm)}>
                Send
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone, this will permanently remove the questionnaire from the organization.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="filled"
                onClick={handleDeleteTemplate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteTemplate()
                  }
                }}
              >
                Delete Questionnaire
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
