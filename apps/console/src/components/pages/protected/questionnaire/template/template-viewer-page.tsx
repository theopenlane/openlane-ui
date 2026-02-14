'use client'

import React, { useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import { useDeleteTemplate } from '@/lib/graphql-hooks/templates'
import { useNotification } from '@/hooks/useNotification'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const ViewTemplate = dynamic(() => import('@/components/pages/protected/questionnaire/template/template-viewer'), {
  ssr: false,
})

const TemplateViewerPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingId = searchParams.get('id') as string

  const { data: permission, isLoading } = useOrganizationRoles()
  const editAllowed = canEdit(permission?.roles)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteTemplate } = useDeleteTemplate()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleEdit = () => {
    router.push(`/questionnaires/templates/template-editor?id=${existingId}`)
  }

  const handleDelete = async () => {
    try {
      await deleteTemplate({ deleteTemplateId: existingId })
      successNotification({ title: 'Template deleted successfully' })
      router.push('/questionnaires/templates')
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
        <PageHeading eyebrow="Templates" heading="Preview" />
        {!isLoading && (
          <div className="flex gap-2 items-center">
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

      <ViewTemplate existingId={existingId} />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone and will permanently delete the template.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Template
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TemplateViewerPage
