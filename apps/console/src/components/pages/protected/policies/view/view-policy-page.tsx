import { Loading } from '@/components/shared/loading/loading'
import { useDeleteInternalPolicy, useGetInternalPolicyDetailsById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import React, { useEffect, useState, useMemo } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import useFormSchema, { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { Form } from '@repo/ui/form'
import DetailsField from '@/components/pages/protected/policies/view/fields/details-field.tsx'
import TitleField from '@/components/pages/protected/policies/view/fields/title-field.tsx'
import { Button } from '@repo/ui/button'
import { PencilIcon, Router, SaveIcon, Trash2, XIcon } from 'lucide-react'
import AuthorityCard from '@/components/pages/protected/policies/view/cards/authority-card.tsx'
import PropertiesCard from '@/components/pages/protected/policies/view/cards/properties-card.tsx'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency, UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import HistoricalCard from '@/components/pages/protected/policies/view/cards/historical-card.tsx'
import TagsCard from '@/components/pages/protected/policies/view/cards/tags-card.tsx'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'
import { Value } from '@udecode/plate-common'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import { usePolicy } from '@/components/pages/protected/policies/create/hooks/use-policy.tsx'
import AssociatedObjectsViewAccordion from '@/components/pages/protected/policies/accordion/associated-objects-view-accordion.tsx'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useAccountRole } from '@/lib/authz/access-api'
import { useSession } from 'next-auth/react'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useRouter } from 'next/navigation'
import Menu from '@/components/shared/menu/menu.tsx'
import CreateItemsFromPolicyToolbar from './create-items-from-policy-toolbar'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationNameById } from '@/lib/graphql-hooks/organization'

type TViewPolicyPage = {
  policyId: string
}

const ViewPolicyPage: React.FC<TViewPolicyPage> = ({ policyId }) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { data, isLoading } = useGetInternalPolicyDetailsById(policyId, !isDeleting)
  const plateEditorHelper = usePlateEditor()
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()
  const policyState = usePolicy()
  const policy = data?.internalPolicy
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.POLICY, policyId)
  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)
  const { mutateAsync: deletePolicy } = useDeleteInternalPolicy()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { currentOrgId } = useOrganization()
  const { data: orgNameData } = useGetOrganizationNameById(currentOrgId)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Policies', href: '/policies' },
      { label: policy?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, policy, isLoading])

  useEffect(() => {
    if (policy) {
      const policyAssociations: TObjectAssociationMap = {
        controlIDs: policy?.controls?.edges?.map((item) => item?.node?.id!) || [],
        procedureIDs: policy?.procedures?.edges?.map((item) => item?.node?.id!) || [],
        programIDs: policy?.programs?.edges?.map((item) => item?.node?.id!) || [],
        controlObjectiveIDs: policy?.controlObjectives?.edges?.map((item) => item?.node?.id!) || [],
        taskIDs: policy?.tasks?.edges?.map((item) => item?.node?.id!) || [],
      }

      const policyAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: policy?.controls?.edges?.map((item) => item?.node?.refCode!) || [],
        procedureIDs: policy?.procedures?.edges?.map((item) => item?.node?.displayID!) || [],
        programIDs: policy?.programs?.edges?.map((item) => item?.node?.displayID!) || [],
        controlObjectiveIDs: policy?.controlObjectives?.edges?.map((item) => item?.node?.displayID!) || [],
        taskIDs: policy?.tasks?.edges?.map((item) => item?.node?.displayID!) || [],
      }

      form.reset({
        name: policy.name,
        details: policy?.details ?? '',
        tags: policy.tags ?? [],
        approvalRequired: policy?.approvalRequired ?? true,
        status: policy.status ?? InternalPolicyDocumentStatus.DRAFT,
        policyType: policy.policyType ?? '',
        reviewDue: policy.reviewDue ? new Date(policy.reviewDue as string) : undefined,
        reviewFrequency: policy.reviewFrequency ?? InternalPolicyFrequency.YEARLY,
        approverID: policy.approver?.id,
        delegateID: policy.delegate?.id,
      })

      policyState.setInitialAssociations(policyAssociations)
      policyState.setAssociations(policyAssociations)
      policyState.setAssociationRefCodes(policyAssociationsRefCodes)
    }
  }, [policy])

  const initialData: TObjectAssociationMap = {
    ...(policyId ? { internalPolicyIDs: [policyId] } : {}),
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleDeletePolicy = async () => {
    try {
      setIsDeleting(true)
      await deletePolicy({ deleteInternalPolicyId: policyId })
      successNotification({ title: 'Policy deleted successfully' })
      router.push('/policies')
    } catch {
      errorNotification({ title: 'Error deleting policy' })
    }
  }

  const onSubmitHandler = async (data: EditPolicyMetadataFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: {
        updateInternalPolicyId: string
        input: UpdateInternalPolicyInput
      } = {
        updateInternalPolicyId: policy?.id!,
        input: {
          ...data,
          details: detailsField,
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
      queryClient.invalidateQueries({ queryKey: ['internalPolicy', policy?.id!] })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error updating the policy. Please try again.',
      })
    }
  }

  const handleCreateNewPolicy = async () => {
    router.push(`/policies/create`)
  }

  const handleCreateNewProcedure = async () => {
    router.push(`/procedures/create?policyId=${policyId}`)
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
          <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
            Cancel
          </Button>
          <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />} disabled={isSaving}>
            {isSaving ? 'Saving' : 'Save'}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <CreateItemsFromPolicyToolbar
            initialData={initialData}
            handleCreateNewPolicy={handleCreateNewPolicy}
            handleCreateNewProcedure={handleCreateNewProcedure}
            objectAssociationsDisplayIDs={policy?.displayID ? [policy?.displayID] : []}
          ></CreateItemsFromPolicyToolbar>
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
                </>
              }
            />
          )}
        </div>
      )}
    </div>
  )

  const mainContent = (
    <div className="space-y-6 p-6">
      <TitleField isEditing={isEditing} form={form} />
      <DetailsField isEditing={isEditing} form={form} policy={policy} />
    </div>
  )

  const sidebarContent = (
    <>
      <AuthorityCard form={form} approver={policy.approver} delegate={policy.delegate} isEditing={isEditing} />
      <PropertiesCard form={form} isEditing={isEditing} policy={policy} />
      <HistoricalCard policy={policy} />
      <TagsCard form={form} policy={policy} isEditing={isEditing} />
      <AssociatedObjectsViewAccordion policy={policy} />
    </>
  )

  return (
    <>
      <title>{`${orgNameData?.organization.displayName}: Internal Policies - ${policy.name}`}</title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </Form>
    </>
  )
}

export default ViewPolicyPage
