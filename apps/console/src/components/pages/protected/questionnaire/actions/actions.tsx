'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
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
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import React from 'react'
import { useRouter } from 'next/navigation'

type TemplateActionsProps = {
  templateId: string
  refetchTemplates: UseQueryExecute
}

const ICON_SIZE = 14

export const Actions = ({
  templateId: templateId,
  refetchTemplates: refetchTemplates,
}: TemplateActionsProps) => {
  const router = useRouter()
  const { actionIcon, dropDownButton } = pageStyles()
  const { toast } = useToast()
  const [ _, deleteTemplate] = useDeleteTemplateMutation()

  const handleEditTemplate = () => {
    router.push(`/documents/questionnaire-editor?id=${templateId}`)
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className={actionIcon()} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-10">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleEditTemplate}>
            <Edit width={ICON_SIZE} /> Edit Questionnaire
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => {
              e.preventDefault();
            }} >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className={dropDownButton()}>
                  <Trash2 width={ICON_SIZE} /> Delete Questionnaire
                </div>
              </AlertDialogTrigger>
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
                    <Button variant="aquamarine" onClick={handleDeleteTemplate}>
                    Delete Questionnaire
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
