'use client'

import { Edit, MoreHorizontal, Send, Trash2, View } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { useDeleteTemplateMutation } from '@repo/codegen/src/schema'
import { type UseQueryExecute } from 'urql'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, InputRow } from '@repo/ui/input'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormItem,
  FormField,
  FormControl,
  FormMessage,
} from '@repo/ui/form'
import { z, infer as zInfer } from 'zod'

type TemplateActionsProps = {
  templateId: string
  refetchTemplates: UseQueryExecute
}

const ICON_SIZE = 12

export const Actions = ({
  templateId: templateId,
  refetchTemplates: refetchTemplates,
}: TemplateActionsProps) => {
  const router = useRouter()
  const { actionIcon, dropDownButton, emailRow } = pageStyles()
  const { toast } = useToast()
  const [ _, deleteTemplate] = useDeleteTemplateMutation()
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditTemplate = () => {
    router.push(`/documents/questionnaire-editor?id=${templateId}`)
  }

  const handleViewTemplate = () => {
    router.push(`/documents/questionnaire-viewer?id=${templateId}`)
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
    // TODO: Implement sending email
    toast({
      title: 'Email sent successfully to ' + data.email,
      variant: 'success',
    })

    form.reset()
    refetchTemplates({
      requestPolicy: 'network-only',
    })
  }


  const handleDeleteTemplate = async () => {
    const response = await deleteTemplate({ deleteTemplateId: templateId })

    if (response.error) {
      toast({
        title: 'There was a problem deleting the questionnaire, please try again',
        variant: 'destructive',
      })
    }

    if (response.data) {
      toast({
        title: 'Questionnaire deleted successfully',
        variant: 'success',
      })
      refetchTemplates({
        requestPolicy: 'network-only',
      })
    }
  }

  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className={actionIcon()} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-10">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleEditTemplate}>
            <Edit width={ICON_SIZE} /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleViewTemplate}>
            <View width={ICON_SIZE} /> View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
							setIsSendDialogOpen(true);
						}} >
            <Send width={ICON_SIZE} /> Send to Recipient
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
							setIsDeleteDialogOpen(true);
						}} >
              <Trash2 width={ICON_SIZE} /> Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Questionnaire</AlertDialogTitle>
          <AlertDialogDescription>
            Send the questionnaire to recipient
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className={emailRow()}>
          Email: {' '}
          <Form {...form}>
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input variant="medium" autoComplete='email' type="email" {...field} />
                  </FormControl>
                  {errors.email && (
                  <FormMessage>{errors.email.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />
          </Form>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" type="submit">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="aquamarine" type="submit" onClick={handleSubmit((data) => handleSendForm(data))}>
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
          <AlertDialogDescription>
            This action cannot be undone, this will permanently remove the questionnaire from the organization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="aquamarine" onClick={handleDeleteTemplate} onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleDeleteTemplate();
            }
            }}>
            Delete Questionnaire
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
