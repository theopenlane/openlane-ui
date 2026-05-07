'use client'

import React, { useState, useMemo } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import { Edit, Send, Trash2 } from 'lucide-react'
import { useDeleteAssessment, useGetAssessment } from '@/lib/graphql-hooks/assessment'
import { useCreateTemplate } from '@/lib/graphql-hooks/template'
import { useNotification } from '@/hooks/useNotification'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { TemplateDocumentType } from '@repo/codegen/src/schema'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SendQuestionnaireDialog } from './dialog/send-questionnaire-dialog'

const ViewQuestionnaire = dynamic(() => import('@/components/pages/protected/questionnaire/questionnaire-viewer'), {
  ssr: false,
})

const QuestionnaireViewerPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingId = searchParams.get('id') as string

  const { data: permission, isLoading } = useOrganizationRoles()

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteAssessment } = useDeleteAssessment()
  const { mutateAsync: createTemplate } = useCreateTemplate()
  const { data: assessmentData } = useGetAssessment(existingId)

  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const questionnaire = assessmentData?.assessment
  const hasTemplate = !!questionnaire?.templateID

  const handleEdit = () => {
    router.push(`/automation/assessments/questionnaire-editor?id=${existingId}`)
  }

  const canEditAssessment = useMemo(() => {
    if (!assessmentData?.assessment?.templateID) {
      return true
    }

    return Object.entries(assessmentData?.assessment?.template?.transformConfiguration).length === 0
  }, [assessmentData])

  const editAllowed = canEdit(permission?.roles) && canEditAssessment

  const handleDelete = async () => {
    try {
      await deleteAssessment({ deleteAssessmentId: existingId })
      successNotification({ title: 'Questionnaire deleted successfully' })
      router.push('/automation/assessments')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!questionnaire?.jsonconfig) {
      errorNotification({
        title: 'Error',
        description: 'No questionnaire data to save as template',
      })
      return
    }

    setIsSaving(true)
    try {
      const suffix = `-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const response = await createTemplate({
        input: {
          name: `${questionnaire.name} - Template${suffix}`,
          jsonconfig: questionnaire.jsonconfig,
          templateType: TemplateDocumentType.DOCUMENT,
        },
      })

      const templateId = response.createTemplate?.template?.id
      if (templateId) {
        successNotification({
          title: 'Template created successfully',
        })
        setIsSaveAsTemplateDialogOpen(false)
        router.push(`/automation/assessments/templates/template-viewer?id=${templateId}`)
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <PageHeading eyebrow="Questionnaires" heading="Preview" />
        {!isLoading && (
          <div className="flex gap-2 items-center">
            {editAllowed && !hasTemplate && <SaveButton type="button" variant="secondary" title="Save as Template" onClick={() => setIsSaveAsTemplateDialogOpen(true)} disabled={isSaving} />}

            {editAllowed && (
              <>
                <Button type="button" variant="secondary" className="h-8 px-3" icon={<Edit />} iconPosition="left" onClick={handleEdit}>
                  Edit
                </Button>
                <Button type="button" variant="secondary" className="h-8 px-3" icon={<Trash2 />} iconPosition="left" onClick={() => setIsDeleteDialogOpen(true)}>
                  Delete
                </Button>
              </>
            )}

            <Button type="button" className="h-8 px-3" icon={<Send />} iconPosition="left" onClick={() => setIsSendDialogOpen(true)}>
              Send
            </Button>
          </div>
        )}
      </div>

      <ViewQuestionnaire existingId={existingId} />

      <SendQuestionnaireDialog
        open={isSendDialogOpen}
        onOpenChange={setIsSendDialogOpen}
        assessmentId={existingId}
        assessmentName={questionnaire?.name}
        responseDueDuration={questionnaire?.responseDueDuration}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone and will permanently delete the questionnaire.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <CancelButton />
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Questionnaire
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isSaveAsTemplateDialogOpen} onOpenChange={setIsSaveAsTemplateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save as Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new template from the questionnaire &quot;{questionnaire?.name}&quot;. The template can be used to create new questionnaires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <CancelButton />
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <SaveButton onClick={handleSaveAsTemplate} disabled={isSaving} />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default QuestionnaireViewerPage
