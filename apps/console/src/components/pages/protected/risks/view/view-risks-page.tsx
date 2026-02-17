import React, { useEffect, useMemo, useState } from 'react'
import { useDeleteRisk, useGetRiskById, useGetRiskDiscussionById, useUpdateRisk } from '@/lib/graphql-hooks/risk'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus, UpdateRiskInput } from '@repo/codegen/src/schema.ts'
import useFormSchema, { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRisk } from '@/components/pages/protected/risks/create/hooks/use-risk.tsx'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'
import { ASSOCIATION_REMOVAL_CONFIG } from '@/components/shared/object-association/object-association-config'
import { Form } from '@repo/ui/form'
import { PencilIcon, Trash2 } from 'lucide-react'
import Menu from '@/components/shared/menu/menu.tsx'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'
import { useRouter } from 'next/navigation'
import TitleField from './fields/title-field'
import DetailsField from './fields/details-field'
import AuthorityCard from './cards/authority-card'
import PropertiesCard from '@/components/pages/protected/risks/view/cards/properties-card.tsx'
import TagsCard from './cards/tags-card'
import { Value } from 'platejs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import BusinessCostField from '@/components/pages/protected/risks/view/fields/business-cost-field.tsx'
import MitigationField from '@/components/pages/protected/risks/view/fields/mitigation-field.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Loading from '@/app/(protected)/risks/[id]/loading'
import { Card } from '@repo/ui/cardpanel'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type TRisksPageProps = {
  riskId: string
}

const ViewRisksPage: React.FC<TRisksPageProps> = ({ riskId }) => {
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { queryClient } = useGraphQLClient()
  const { risk, isLoading } = useGetRiskById(riskId)
  const { mutateAsync: updateRisk, isPending } = useUpdateRisk()
  const { mutateAsync: deleteRisk } = useDeleteRisk()
  const plateEditorHelper = usePlateEditor()

  const { successNotification, errorNotification } = useNotification()
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const { data: permission } = useAccountRoles(ObjectTypes.RISK, riskId)
  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const riskState = useRisk()
  const [dataInitialized, setDataInitialized] = useState(false)
  const { data: discussionData } = useGetRiskDiscussionById(riskId)

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: risk?.id,
    handleUpdateField: (input: UpdateRiskInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: [{ queryKey: ['risks', riskId], dataRootField: 'risk' }],
    invalidateQueryKeys: [['risks']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.risk.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.risk.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.risk.sectionKeyToInvalidateQueryKey,
    onRemoved: () => setDataInitialized(false),
  })

  const memoizedSections = useMemo(() => {
    if (!risk) return {}
    return {
      controls: risk.controls,
      policies: risk.internalPolicies,
      procedures: risk.procedures,
      subcontrols: risk.subcontrols,
      tasks: risk.tasks,
      programs: risk.programs,
    }
  }, [risk])

  const memoizedCenterNode = useMemo(() => {
    if (!risk) return null
    return {
      node: risk,
      type: ObjectAssociationNodeEnum.RISKS,
    }
  }, [risk])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Risks', href: '/risks' },
      { label: risk?.name, isLoading: isLoading },
    ])
  }, [setCrumbs, risk, isLoading])

  useEffect(() => {
    if (risk) {
      form.reset({
        name: risk.name ?? '',
        riskKindName: risk.riskKindName ?? undefined,
        riskCategoryName: risk.riskCategoryName ?? undefined,
        score: risk.score ?? 0,
        impact: risk.impact ?? RiskRiskImpact.LOW,
        likelihood: risk.likelihood ?? RiskRiskLikelihood.UNLIKELY,
        status: risk.status ?? RiskRiskStatus.OPEN,
        details: risk.details ?? '',
        detailsJSON: risk.detailsJSON ?? undefined,
        mitigation: risk.mitigation ?? '',
        businessCosts: risk.businessCosts ?? '',
        tags: risk.tags || [],
        stakeholderID: risk.stakeholder?.id,
        delegateID: risk.delegate?.id,
      })
    }
  }, [risk, form])

  useEffect(() => {
    if (risk && !dataInitialized) {
      const riskAssociations: TObjectAssociationMap = {
        controlIDs: risk.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        procedureIDs: risk.procedures?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        subcontrolIDs: risk.subcontrols?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        programIDs: risk.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        taskIDs: risk.tasks?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
        internalPolicyIDs: risk.internalPolicies?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      }

      const riskAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: risk.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
        procedureIDs: risk.procedures?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        subcontrolIDs: risk.subcontrols?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
        programIDs: risk.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        taskIDs: risk.tasks?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
        internalPolicyIDs: risk.internalPolicies?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
      }

      riskState.setInitialAssociations(riskAssociations)
      riskState.setAssociations(riskAssociations)
      riskState.setAssociationRefCodes(riskAssociationsRefCodes)
      setDataInitialized(true)
    }
  }, [risk, riskState, dataInitialized])

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset()
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleDeleteRisk = async () => {
    try {
      router.push('/risks')
      await deleteRisk({ deleteRiskId: riskId })
      successNotification({ title: 'Risk deleted successfully' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const onSubmitHandler = async (values: EditRisksFormData) => {
    if (!risk?.id) {
      return
    }

    let businessCostsField = values?.businessCosts

    if (businessCostsField) {
      businessCostsField = await plateEditorHelper.convertToHtml(businessCostsField as Value)
    }

    let mitigationField = values?.mitigation

    if (mitigationField) {
      mitigationField = await plateEditorHelper.convertToHtml(mitigationField as Value)
    }

    try {
      await updateRisk({
        updateRiskId: risk.id,
        input: {
          ...values,
          detailsJSON: values.detailsJSON,
          details: await plateEditorHelper.convertToHtml(values.detailsJSON as Value),
          businessCosts: businessCostsField,
          mitigation: mitigationField,
          tags: values?.tags?.filter((tag): tag is string => typeof tag === 'string') ?? [],
          stakeholderID: values.stakeholderID || undefined,
          delegateID: values.delegateID || undefined,
        },
      })

      successNotification({
        title: 'Risk updated',
        description: 'The risk was successfully updated.',
      })

      setIsEditing(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUpdateField = async (input: UpdateRiskInput, options?: { throwOnError?: boolean }) => {
    if (!risk.id) return
    try {
      await updateRisk({ updateRiskId: risk.id, input })
      successNotification({
        title: 'Risk updated',
        description: 'The risk was successfully updated.',
      })
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

  if (isLoading) {
    return <Loading />
  }

  if (!risk) {
    return null
  }

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} onRemoveAssociation={handleRemoveAssociation} />}
      <Card className="p-4 mt-2! flex flex-col gap-4">
        <AuthorityCard
          form={form}
          stakeholder={risk.stakeholder}
          delegate={risk.delegate}
          isEditing={isEditing}
          handleUpdate={handleUpdateField}
          isEditAllowed={editAllowed}
          risk={risk}
          activeField={editingField}
          setActiveField={setEditingField}
        />
        <PropertiesCard form={form} isEditing={isEditing} risk={risk} handleUpdate={handleUpdateField} isEditAllowed={editAllowed} activeField={editingField} setActiveField={setEditingField} />
        <TagsCard form={form} risk={risk} isEditing={isEditing} handleUpdate={handleUpdateField} isEditAllowed={editAllowed} activeField={editingField} setActiveField={setEditingField} />
      </Card>
    </>
  )

  const menuComponent = (
    <div className="space-y-4">
      {isEditing ? (
        <div className="flex gap-2 justify-end">
          <CancelButton onClick={handleCancel}></CancelButton>
          <SaveButton disabled={isPending} isSaving={isPending} />
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
                    <div className="flex items-center space-x-2  cursor-pointer" onClick={handleEdit}>
                      <PencilIcon size={16} strokeWidth={2} />
                      <span>Edit</span>
                    </div>
                  )}
                  {deleteAllowed && (
                    <>
                      <div className="flex items-center space-x-2  cursor-pointer" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 size={16} strokeWidth={2} />
                        <span>Delete</span>
                      </div>
                      <ConfirmationDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        onConfirm={handleDeleteRisk}
                        title={`Delete Risk`}
                        description={
                          <>
                            This action cannot be undone. This will permanently remove <b>{risk.name}</b> from the organization.
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
    <div className="space-y-6 p-2">
      <TitleField isEditing={isEditing} form={form} handleUpdate={handleUpdateField} isEditAllowed={editAllowed} initialValue={risk.name} />
      <DetailsField isEditing={isEditing} form={form} risk={risk} isEditAllowed={editAllowed} discussionData={discussionData?.risk} />
      <BusinessCostField isEditing={isEditing} form={form} risk={risk} isEditAllowed={editAllowed} />
      <MitigationField isEditing={isEditing} form={form} risk={risk} isEditAllowed={editAllowed} />
    </div>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Risks - ${risk.name}`}</title>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing} minWidth={430}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </Form>
    </>
  )
}

export default ViewRisksPage
