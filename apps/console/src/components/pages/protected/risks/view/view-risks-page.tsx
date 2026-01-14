import React, { useEffect, useMemo, useState } from 'react'
import { useDeleteRisk, useGetRiskById, useGetRiskDiscussionById, useUpdateRisk } from '@/lib/graphql-hooks/risks.ts'
import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus, UpdateRiskInput } from '@repo/codegen/src/schema.ts'
import useFormSchema, { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { Form } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { PencilIcon, SaveIcon, Trash2, XIcon } from 'lucide-react'
import Menu from '@/components/shared/menu/menu.tsx'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canDelete, canEdit } from '@/lib/authz/utils.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
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

type TRisksPageProps = {
  riskId: string
}

const ViewRisksPage: React.FC<TRisksPageProps> = ({ riskId }) => {
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { risk, isLoading } = useGetRiskById(riskId)
  const { mutateAsync: updateRisk, isPending } = useUpdateRisk()
  const { mutateAsync: deleteRisk } = useDeleteRisk()
  const plateEditorHelper = usePlateEditor()

  const { successNotification, errorNotification } = useNotification()
  const { form } = useFormSchema()
  const [isEditing, setIsEditing] = useState(false)
  const { data: permission } = useAccountRoles(ObjectEnum.RISK, riskId)
  const deleteAllowed = canDelete(permission?.roles)
  const editAllowed = canEdit(permission?.roles)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: discussionData } = useGetRiskDiscussionById(riskId)
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

  const handleUpdateField = async (input: UpdateRiskInput) => {
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
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} />}
      <Card className="p-4 mt-2! flex flex-col gap-4">
        <AuthorityCard form={form} stakeholder={risk.stakeholder} delegate={risk.delegate} isEditing={isEditing} handleUpdate={handleUpdateField} isEditAllowed={editAllowed} risk={risk} />
        <PropertiesCard form={form} isEditing={isEditing} risk={risk} handleUpdate={handleUpdateField} isEditAllowed={editAllowed} />
        <TagsCard form={form} risk={risk} isEditing={isEditing} handleUpdate={handleUpdateField} isEditAllowed={editAllowed} />
      </Card>
    </>
  )

  const menuComponent = (
    <div className="space-y-4">
      {isEditing ? (
        <div className="flex gap-2 justify-end">
          <Button className="h-8 px-2!" onClick={handleCancel} icon={<XIcon />}>
            Cancel
          </Button>
          <Button type="submit" iconPosition="left" className="h-8 px-2!" icon={<SaveIcon />} disabled={isPending}>
            {isPending ? 'Saving' : 'Save'}
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
