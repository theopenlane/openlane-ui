import { useDeleteInternalPolicy, useGetInternalPolicyAssociationsById, useGetInternalPolicyDetailsById, useGetPolicyDiscussionById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import React, { useEffect, useMemo, useState } from 'react'
import useFormSchema, { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/policies/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/policies/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { LockOpen, PencilIcon, Trash2 } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/policies/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/policies/view/cards/properties-card.tsx'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency, UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import HistoricalCard from '@/components/pages/protected/policies/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/policies/view/cards/tags-card.tsx'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePolicy } from '@/components/pages/protected/policies/create/hooks/use-policy.tsx'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useRouter } from 'next/navigation'
import Menu from '@/components/shared/menu/menu.tsx'
import CreateItemsFromPolicyToolbar from './create-items-from-policy-toolbar'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import { ManagePermissionSheet } from '@/components/shared/policy-procedure.tsx/manage-permissions-sheet'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Loading from '@/app/(protected)/policies/[id]/view/loading'
import { Card } from '@repo/ui/cardpanel'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TViewPolicyPage = {
  policyId: string
}

const ViewPolicyPage: React.FC<TViewPolicyPage> = ({ policyId }) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId, !isDeleting)
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()
  const policyState = usePolicy()
  const policy = data?.internalPolicy
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(ObjectEnum.POLICY, policyId)
  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)
  const { mutateAsync: deletePolicy } = useDeleteInternalPolicy()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [showPermissionsSheet, setShowPermissionsSheet] = useState(false)
  const { data: assocData } = useGetInternalPolicyAssociationsById(policyId, !isDeleting)
  const { data: discussionData } = useGetPolicyDiscussionById(policyId)
  const plateEditorHelper = usePlateEditor()

  const memoizedSections = useMemo(() => {
    if (!assocData) return {}
    return {
      procedures: assocData.internalPolicy.procedures,
      controls: assocData.internalPolicy.controls,
      subcontrols: assocData.internalPolicy.subcontrols,
      controlObjectives: assocData.internalPolicy.controlObjectives,
      tasks: assocData.internalPolicy.tasks,
      programs: assocData.internalPolicy.programs,
    }
  }, [assocData])

  const memoizedCenterNode = useMemo(() => {
    if (!policy) return null
    return {
      node: policy,
      type: ObjectAssociationNodeEnum.POLICY,
    }
  }, [policy])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Policies', href: '/policies' },
      { label: policy?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, policy, isLoading])

  useEffect(() => {
    if (policy && assocData && !dataInitialized) {
      const policyAssociations: TObjectAssociationMap = {
        controlIDs: assocData.internalPolicy?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        procedureIDs: assocData.internalPolicy?.procedures?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        programIDs: assocData.internalPolicy?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        controlObjectiveIDs: assocData.internalPolicy?.controlObjectives?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
        taskIDs: assocData.internalPolicy?.tasks?.edges?.map((item) => item?.node?.id).filter((id): id is string => typeof id === 'string') || [],
      }

      const policyAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: assocData.internalPolicy?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => typeof id === 'string') || [],
        procedureIDs: assocData.internalPolicy?.procedures?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
        programIDs: assocData.internalPolicy?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
        controlObjectiveIDs: assocData.internalPolicy?.controlObjectives?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
        taskIDs: assocData.internalPolicy?.tasks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => typeof id === 'string') || [],
      }

      form.reset({
        name: policy.name,
        details: policy?.details ?? '',
        tags: policy.tags ?? [],
        approvalRequired: policy?.approvalRequired ?? true,
        status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
        internalPolicyKindName: policy.internalPolicyKindName ?? '',
        reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
        reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
        approverID: policy.approver?.id,
        delegateID: policy.delegate?.id,
      })

      policyState.setInitialAssociations(policyAssociations)
      policyState.setAssociations(policyAssociations)
      policyState.setAssociationRefCodes(policyAssociationsRefCodes)
      setDataInitialized(true)
    }
  }, [policy, form, policyState, dataInitialized, assocData])

  const initialData: TObjectAssociationMap = {
    ...(policyId ? { internalPolicyIDs: [policyId] } : {}),
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleDeletePolicy = async () => {
    try {
      setIsDeleting(true)
      await deletePolicy({ deleteInternalPolicyId: policyId })
      successNotification({ title: 'Policy deleted successfully' })
      router.push('/policies')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const onSubmitHandler = async (data: EditPolicyMetadataFormData) => {
    if (!policy?.id) {
      return
    }

    try {
      const formData: {
        updateInternalPolicyId: string
        input: UpdateInternalPolicyInput
      } = {
        updateInternalPolicyId: policy?.id,
        input: {
          ...data,
          detailsJSON: data.detailsJSON,
          details: await plateEditorHelper.convertToHtml(data.detailsJSON as Value),
          tags: data?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          approverID: data.approverID || undefined,
          delegateID: data.delegateID || undefined,
        },
      }

      await updatePolicy(formData)

      successNotification({
        title: 'Policy Updated',
        description: 'Policy has been successfully updated',
      })

      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      queryClient.invalidateQueries({ queryKey: ['policyDiscussion', policyId] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleCreateNewPolicy = async () => {
    router.push(`/policies/create`)
  }

  const handleCreateNewProcedure = async () => {
    router.push(`/procedures/create?policyId=${policyId}`)
  }

  const handleUpdateField = async (input: UpdateInternalPolicyInput) => {
    if (!policy?.id) {
      return
    }
    try {
      await updatePolicy({ updateInternalPolicyId: policy?.id, input })
      successNotification({
        title: 'Policy Updated',
        description: 'Policy has been successfully updated',
      })

      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
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

  if (!policy) {
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
          <CreateItemsFromPolicyToolbar
            initialData={initialData}
            handleCreateNewPolicy={handleCreateNewPolicy}
            handleCreateNewProcedure={handleCreateNewProcedure}
            objectAssociationsDisplayIDs={policy?.name ? [policy?.name] : []}
          />
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
                      <Button size="sm" variant="transparent" className="flex justify-start space-x-2" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 size={16} strokeWidth={2} />
                        <span>Delete</span>
                      </Button>
                      <ConfirmationDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        onConfirm={handleDeletePolicy}
                        title={`Delete Internal Policy`}
                        description={
                          <>
                            This action cannot be undone. This will permanently remove <b>{policy.name}</b> from the organization.
                          </>
                        }
                      />
                    </>
                  )}
                  <Button size="sm" variant="transparent" className="flex justify-start space-x-2" onClick={() => setShowPermissionsSheet(true)}>
                    <LockOpen size={16} strokeWidth={2} />
                    <span>Manage Permissions</span>
                  </Button>
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
      <TitleField isEditing={isEditing} form={form} handleUpdate={handleUpdateField} initialData={policy.name} editAllowed={editAllowed} />
      <DetailsField isEditing={isEditing} form={form} policy={policy} discussionData={discussionData?.internalPolicy} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={editAllowed} />}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-2">Properties</h3>

        <AuthorityCard
          form={form}
          approver={policy.approver}
          delegate={policy.delegate}
          isEditing={isEditing}
          editAllowed={editAllowed}
          handleUpdate={handleUpdateField}
          activeField={editingField}
          setActiveField={setEditingField}
        />
        <PropertiesCard form={form} isEditing={isEditing} policy={policy} editAllowed={editAllowed} handleUpdate={handleUpdateField} activeField={editingField} setActiveField={setEditingField} />
        <HistoricalCard policy={policy} />
        <TagsCard form={form} policy={policy} isEditing={isEditing} handleUpdate={handleUpdateField} editAllowed={editAllowed} activeField={editingField} setActiveField={setEditingField} />
      </Card>
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Internal Policies - ${policy.name}`}</title>
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

export default ViewPolicyPage
