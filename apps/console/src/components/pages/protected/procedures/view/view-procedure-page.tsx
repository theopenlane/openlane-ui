'use client'

import { useUpdateProcedure } from '@/lib/graphql-hooks/procedures.ts'
import React, { useEffect, useMemo, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import useFormSchema, { EditProcedureMetadataFormData } from '@/components/pages/protected/procedures/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/procedures/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/procedures/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { LockOpen, PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/procedures/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/procedures/view/cards/properties-card.tsx'
import HistoricalCard from '@/components/pages/protected/procedures/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/procedures/view/cards/tags-card.tsx'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { Value } from 'platejs'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures.ts'
import { ProcedureDocumentStatus, ProcedureFrequency, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'
import { Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useDeleteProcedure } from '@/lib/graphql-hooks/procedures'
import Menu from '@/components/shared/menu/menu.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import { ManagePermissionSheet } from '@/components/shared/policy-procedure.tsx/manage-permissions-sheet'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Loading from '@/app/(protected)/procedures/[id]/view/loading'

const ViewProcedurePage: React.FC = () => {
  const { id } = useParams()
  const procedureId = id as string
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data, isLoading } = useGetProcedureDetailsById(procedureId, !isDeleting)
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
  const editAllowed = canEdit(permission?.roles)
  const { mutateAsync: deleteProcedure } = useDeleteProcedure()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [showPermissionsSheet, setShowPermissionsSheet] = useState(false)
  const memoizedSections = useMemo(() => {
    if (!procedure) return {}
    return {
      policies: procedure.internalPolicies,
      controls: procedure.controls,
      subcontrols: procedure.subcontrols,
      risks: procedure.risks,
      tasks: procedure.tasks,
      programs: procedure.programs,
    }
  }, [procedure])

  const memoizedCenterNode = useMemo(() => {
    if (!procedure) return null
    return {
      node: procedure,
      type: ObjectAssociationNodeEnum.PROCEDURE,
    }
  }, [procedure])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Procedures', href: '/procedures' },
      { label: procedure?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, procedure, isLoading])

  useEffect(() => {
    if (procedure && !dataInitialized) {
      const procedureAssociations: TObjectAssociationMap = {
        controlIDs: procedure?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        riskIDs: procedure?.risks?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        programIDs: procedure?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        internalPolicyIDs: procedure?.internalPolicies?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        taskIDs: procedure?.tasks?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      }

      const procedureAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: procedure?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
        riskIDs: procedure?.risks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        programIDs: procedure?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        internalPolicyIDs: procedure?.internalPolicies?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        taskIDs: procedure?.tasks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
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
      setDataInitialized(true)
    }
  }, [procedure, form, procedureState, dataInitialized])

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
      setIsDeleting(true)
      await deleteProcedure({ deleteProcedureId: procedureId })
      successNotification({ title: 'Procedure deleted successfully' })
      router.push('/procedures')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const onSubmitHandler = async (data: EditProcedureMetadataFormData) => {
    if (!procedure?.id) {
      return
    }
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: {
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedure?.id,
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
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUpdateField = async (input: UpdateProcedureInput) => {
    if (!procedure?.id) {
      return
    }
    try {
      await updateProcedure({ updateProcedureId: procedure?.id, input })
      successNotification({
        title: 'Procedure Updated',
        description: 'Procedure has been successfully updated',
      })

      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  if (isLoading) {
    return <Loading />
  }

  if (!procedure) {
    return null
  }

  const menuComponent = (
    <div className="space-y-4">
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
          {!editAllowed && !deleteAllowed ? (
            <></>
          ) : (
            <Menu
              content={
                <>
                  {editAllowed && (
                    <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleEdit}>
                      <PencilIcon size={16} strokeWidth={2} />
                      <span>Edit</span>
                    </div>
                  )}
                  {deleteAllowed && (
                    <>
                      <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 size={16} strokeWidth={2} />
                        <span>Delete</span>
                      </div>
                      <ConfirmationDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        onConfirm={handleDeleteProcedure}
                        title={`Delete Procedure`}
                        description={
                          <>
                            This action cannot be undone. This will permanently remove <b>{procedure.name}</b> from the organization.
                          </>
                        }
                      />
                      <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={() => setShowPermissionsSheet(true)}>
                        <LockOpen size={16} strokeWidth={2} />
                        <span>Manage Permissions</span>
                      </div>
                    </>
                  )}
                </>
              }
            />
          )}
        </div>
      )}
    </div>
  )

  const mainContent = (
    <div className="p-2">
      <TitleField isEditing={isEditing} form={form} handleUpdate={handleUpdateField} initialData={procedure.name} editAllowed={editAllowed} />
      <DetailsField isEditing={isEditing} form={form} procedure={procedure} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={editAllowed} />}
      <AuthorityCard form={form} approver={procedure.approver} delegate={procedure.delegate} isEditing={isEditing} editAllowed={editAllowed} />
      <PropertiesCard form={form} isEditing={isEditing} procedure={procedure} editAllowed={editAllowed} />
      <HistoricalCard procedure={procedure} />
      <TagsCard form={form} procedure={procedure} isEditing={isEditing} handleUpdate={handleUpdateField} editAllowed={editAllowed} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Procedures - ${data.procedure.name}`}</title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </Form>
      <ManagePermissionSheet open={showPermissionsSheet} onOpenChange={(val) => setShowPermissionsSheet(val)} />
    </>
  )
}

export default ViewProcedurePage
