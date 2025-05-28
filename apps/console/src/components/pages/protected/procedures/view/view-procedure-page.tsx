import { Loading } from '@/components/shared/loading/loading'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedures.ts'
import React, { useEffect, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import useFormSchema, { EditProcedureMetadataFormData } from '@/components/pages/protected/procedures/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/procedures/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/procedures/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { CirclePlus, PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/procedures/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/procedures/view/cards/properties-card.tsx'
import HistoricalCard from '@/components/pages/protected/procedures/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/procedures/view/cards/tags-card.tsx'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { Value } from '@udecode/plate-common'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import AssociatedObjectsViewAccordion from '@/components/pages/protected/procedures/accordion/associated-objects-view-accordion.tsx'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures.ts'
import { ProcedureDocumentStatus, ProcedureFrequency, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { canDelete } from '@/lib/authz/utils'
import { useDeleteProcedure } from '@/lib/graphql-hooks/procedures'
import Menu from '@/components/shared/menu/menu.tsx'

type TViewProcedurePage = {
  procedureId: string
}

const ViewProcedurePage: React.FC<TViewProcedurePage> = ({ procedureId }) => {
  const { data, isLoading } = useGetProcedureDetailsById(procedureId)
  const plateEditorHelper = usePlateEditor()
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()
  const procedureState = useProcedure()
  const procedure = data?.procedure
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.PROCEDURE, procedureId)
  const deleteAllowed = canDelete(permission?.roles)
  const { mutateAsync: deleteProcedure } = useDeleteProcedure()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (procedure) {
      const procedureAssociations: TObjectAssociationMap = {
        controlIDs: procedure?.controls?.edges?.map((item) => item?.node?.id!) || [],
        riskIDs: procedure?.risks?.edges?.map((item) => item?.node?.id!) || [],
        programIDs: procedure?.programs?.edges?.map((item) => item?.node?.id!) || [],
        internalPolicyIDs: procedure?.internalPolicies?.edges?.map((item) => item?.node?.id!) || [],
        taskIDs: procedure?.tasks?.edges?.map((item) => item?.node?.id!) || [],
      }

      const procedureAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: procedure?.controls?.edges?.map((item) => item?.node?.refCode!) || [],
        riskIDs: procedure?.risks?.edges?.map((item) => item?.node?.displayID!) || [],
        programIDs: procedure?.programs?.edges?.map((item) => item?.node?.displayID!) || [],
        internalPolicyIDs: procedure?.internalPolicies?.edges?.map((item) => item?.node?.displayID!) || [],
        taskIDs: procedure?.tasks?.edges?.map((item) => item?.node?.displayID!) || [],
      }

      form.reset({
        name: procedure.name,
        details: procedure?.details ?? '',
        tags: procedure.tags ?? [],
        approvalRequired: procedure?.approvalRequired ?? true,
        status: procedure.status ?? ProcedureDocumentStatus.DRAFT,
        procedureType: procedure.procedureType ?? '',
        reviewDue: procedure.reviewDue ? new Date(procedure.reviewDue as string) : undefined,
        reviewFrequency: procedure.reviewFrequency ?? ProcedureFrequency.YEARLY,
        approverID: procedure.approver?.id,
        delegateID: procedure.delegate?.id,
      })

      procedureState.setInitialAssociations(procedureAssociations)
      procedureState.setAssociations(procedureAssociations)
      procedureState.setAssociationRefCodes(procedureAssociationsRefCodes)
    }
  }, [procedure])

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleDeleteProcedure = async () => {
    try {
      await deleteProcedure({ deleteProcedureId: procedureId })
      successNotification({ title: 'Procedure deleted successfully' })
      router.push('/procedures')
    } catch {
      errorNotification({ title: 'Error deleting procedure' })
    }
  }

  const onSubmitHandler = async (data: EditProcedureMetadataFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: {
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedure?.id!,
        input: {
          ...data,
          details: detailsField,
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          approverID: data.approverID || undefined,
          delegateID: data.delegateID || undefined,
        },
      }

      await updateProcedure(formData)

      successNotification({
        title: 'Procedure Updated',
        description: 'Procedure has been successfully updated',
      })

      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
      queryClient.invalidateQueries({ queryKey: ['procedure', procedure?.id!] })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error updating the procedure. Please try again.',
      })
    }
  }

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && procedure && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <TitleField isEditing={isEditing} form={form} />
              <DetailsField isEditing={isEditing} form={form} procedure={procedure} />
              <AssociatedObjectsViewAccordion procedure={procedure} />
            </div>
            <div className="space-y-4">
              <div className="flex gap-2 justify-end">
                {isEditing ? (
                  <div className="flex gap-2 justify-end">
                    <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
                      Cancel
                    </Button>
                    <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />} disabled={isSaving}>
                      {isSaving ? 'Saving' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <Menu
                      content={
                        <>
                          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleEdit}>
                            <PencilIcon size={16} strokeWidth={2} />
                            <span>Edit</span>
                          </div>
                          {deleteAllowed && (
                            <>
                              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsDeleteDialogOpen(true)}>
                                <Trash2 size={16} strokeWidth={2} />
                                <span>Delete</span>
                              </div>
                              <ConfirmationDialog
                                open={isDeleteDialogOpen}
                                onOpenChange={setIsDeleteDialogOpen}
                                onConfirm={handleDeleteProcedure}
                                description="This action cannot be undone. This will permanently remove the procedure from the organization."
                              />
                            </>
                          )}
                        </>
                      }
                    />
                  </div>
                )}
              </div>

              <AuthorityCard form={form} approver={procedure.approver} delegate={procedure.delegate} isEditing={isEditing} />
              <PropertiesCard form={form} isEditing={isEditing} procedure={procedure} />
              <HistoricalCard procedure={procedure} />
              <TagsCard form={form} procedure={procedure} isEditing={isEditing} />
            </div>
          </form>
        </Form>
      )}
    </>
  )
}

export default ViewProcedurePage
