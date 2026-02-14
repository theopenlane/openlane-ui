'use client'

import { useGetProcedureAssociationsById, useGetProcedureDiscussionById, useUpdateProcedure } from '@/lib/graphql-hooks/procedures.ts'
import React, { useEffect, useMemo, useState } from 'react'
import useFormSchema, { EditProcedureMetadataFormData } from '@/components/pages/protected/procedures/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/procedures/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/procedures/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { LockOpen, PencilIcon } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/procedures/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/procedures/view/cards/properties-card.tsx'
import HistoricalCard from '@/components/pages/protected/procedures/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/procedures/view/cards/tags-card.tsx'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures.ts'
import { ProcedureDocumentStatus, ProcedureFrequency, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'
import { Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
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
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { ASSOCIATION_REMOVAL_CONFIG } from '@/components/shared/objectAssociation/object-assoiation-config'
import Loading from '@/app/(protected)/procedures/[id]/view/loading'
import { Card } from '@repo/ui/cardpanel'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const ViewProcedurePage: React.FC = () => {
  const { id } = useParams()
  const procedureId = id as string
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data, isLoading } = useGetProcedureDetailsById(procedureId, !isDeleting)
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()
  const procedureState = useProcedure()
  const procedure = data?.procedure
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()
  const { data: permission } = useAccountRoles(ObjectEnum.PROCEDURE, procedureId)
  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)
  const { mutateAsync: deleteProcedure } = useDeleteProcedure()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [showPermissionsSheet, setShowPermissionsSheet] = useState(false)
  const { data: discussionData } = useGetProcedureDiscussionById(procedureId)
  const plateEditorHelper = usePlateEditor()

  const { data: assocData } = useGetProcedureAssociationsById(procedureId, !isDeleting)

  const memoizedSections = useMemo(() => {
    if (!assocData) return {}
    return {
      policies: assocData.procedure.internalPolicies,
      controls: assocData.procedure.controls,
      subcontrols: assocData.procedure.subcontrols,
      risks: assocData.procedure.risks,
      tasks: assocData.procedure.tasks,
      programs: assocData.procedure.programs,
    }
  }, [assocData])

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
    if (procedure && assocData && !dataInitialized) {
      const procedureAssociations: TObjectAssociationMap = {
        controlIDs: assocData.procedure?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        riskIDs: assocData.procedure?.risks?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        programIDs: assocData.procedure?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        internalPolicyIDs: assocData.procedure?.internalPolicies?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        taskIDs: assocData.procedure?.tasks?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      }

      const procedureAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: assocData.procedure?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
        riskIDs: assocData.procedure?.risks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        programIDs: assocData.procedure?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        internalPolicyIDs: assocData.procedure?.internalPolicies?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        taskIDs: assocData.procedure?.tasks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
      }

      form.reset({
        name: procedure.name,
        details: procedure?.details ?? '',
        tags: procedure.tags ?? [],
        approvalRequired: procedure?.approvalRequired ?? true,
        status: procedure.status ?? ProcedureDocumentStatus.DRAFT,
        procedureKindName: procedure.procedureKindName ?? '',
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
  }, [procedure, form, procedureState, dataInitialized, assocData])

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      const formData: {
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedure?.id,
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
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
      queryClient.invalidateQueries({ queryKey: ['procedureDiscussion', procedureId] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUpdateField = async (input: UpdateProcedureInput, options?: { throwOnError?: boolean }) => {
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

      if (options?.throwOnError) {
        throw error
      }
    }
  }

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: procedure?.id,
    handleUpdateField: (input: UpdateProcedureInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: [{ queryKey: ['procedures', procedureId, 'associations'], dataRootField: 'procedure' }],
    invalidateQueryKeys: [['procedures']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.procedure.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.procedure.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.procedure.sectionKeyToInvalidateQueryKey,
    onRemoved: () => setDataInitialized(false),
  })

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
          <CancelButton onClick={handleCancel}></CancelButton>
          <SaveButton disabled={isSaving} isSaving={isSaving} />
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
                    <Button size="sm" variant="transparent" className="flex justify-start space-x-2 " onClick={handleEdit}>
                      <PencilIcon size={16} strokeWidth={2} />
                      <span>Edit</span>
                    </Button>
                  )}
                  {deleteAllowed && (
                    <>
                      <Button size="sm" variant="transparent" className="flex justify-start space-x-2 " onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 size={16} strokeWidth={2} />
                        <span>Delete</span>
                      </Button>
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
                      <Button size="sm" variant="transparent" className="flex justify-start space-x-2 " onClick={() => setShowPermissionsSheet(true)}>
                        <LockOpen size={16} strokeWidth={2} />
                        <span>Manage Permissions</span>
                      </Button>
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
      <DetailsField isEditing={isEditing} form={form} procedure={procedure} discussionData={discussionData?.procedure} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={editAllowed} onRemoveAssociation={handleRemoveAssociation} />}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-2">Properties</h3>
        <AuthorityCard
          form={form}
          approver={procedure.approver}
          delegate={procedure.delegate}
          isEditing={isEditing}
          editAllowed={editAllowed}
          handleUpdate={handleUpdateField}
          activeField={editingField}
          setActiveField={setEditingField}
        />
        <PropertiesCard
          form={form}
          isEditing={isEditing}
          procedure={procedure}
          editAllowed={editAllowed}
          handleUpdate={handleUpdateField}
          activeField={editingField}
          setActiveField={setEditingField}
        />
        <HistoricalCard procedure={procedure} />
        <TagsCard form={form} procedure={procedure} isEditing={isEditing} handleUpdate={handleUpdateField} editAllowed={editAllowed} activeField={editingField} setActiveField={setEditingField} />
      </Card>
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Procedures - ${data.procedure.name}`}</title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing} minWidth={430}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </Form>
      <ManagePermissionSheet open={showPermissionsSheet} onOpenChange={(val) => setShowPermissionsSheet(val)} />
    </>
  )
}

export default ViewProcedurePage
