'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigationGuard } from 'next-navigation-guard'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetRiskById, useGetRiskAssociations, useUpdateRisk, useDeleteRisk } from '@/lib/graphql-hooks/risk'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { useHasScrollbar } from '@/hooks/useHasScrollbar'
import { useOrganization } from '@/hooks/useOrganization'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type UpdateRiskInput, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { ASSOCIATION_REMOVAL_CONFIG } from '@/components/shared/object-association/object-association-config'
import AssetDetailsSheet from '@/components/pages/protected/controls/tabs/assets-scans/asset-details-sheet'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import RiskDetailHeader from './risk-detail-header'
import RiskPropertiesSidebar from './risk-properties-sidebar'
import type { EditRisksFormData } from '../hooks/use-form-schema'
import RiskDetailTabs from './tabs/risk-detail-tabs'
import QuickActions from '@/components/pages/protected/risks/quick-actions/quick-actions.tsx'
import { Badge } from '@repo/ui/badge'
import RiskLabel from '../../risk-label'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import TaskDetailsSheet from '../../../tasks/create-task/sidebar/task-details-sheet'

interface RiskDetailPageProps {
  riskId: string
}

type RiskFormValues = EditRisksFormData

const RiskDetailPage: React.FC<RiskDetailPageProps> = ({ riskId }) => {
  const router = useRouter()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')

  const { data, isLoading, isError } = useGetRiskById(riskId)
  const { data: associationsData } = useGetRiskAssociations(riskId)
  const { data: permission } = useAccountRoles(ObjectTypes.RISK, riskId)
  const { mutateAsync: updateRisk } = useUpdateRisk()
  const { mutateAsync: deleteRisk } = useDeleteRisk()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<RiskFormValues>>({})

  const plateEditorHelper = usePlateEditor()

  const hasScrollbar = useHasScrollbar([isEditing, data?.risk, associationsData?.risk])

  const form = useForm<RiskFormValues>({
    defaultValues: {},
  })

  const { isDirty } = form.formState
  const navGuard = useNavigationGuard({ enabled: isDirty })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Exposure', href: '/exposure/risks' },
      { label: 'Risks', href: '/exposure/risks' },
      { label: data?.risk?.name || '', isLoading },
    ])
  }, [setCrumbs, data?.risk, isLoading])

  useEffect(() => {
    if (data?.risk) {
      const newValues: Partial<RiskFormValues> = {
        name: data.risk.name ?? '',
        riskKindName: data.risk.riskKindName ?? '',
        riskCategoryName: data.risk.riskCategoryName ?? '',
        score: data.risk.score ?? 0,
        residualScore: data.risk.residualScore ?? 0,
        impact: data.risk.impact ?? RiskRiskImpact.LOW,
        likelihood: data.risk.likelihood ?? RiskRiskLikelihood.UNLIKELY,
        status: data.risk.status ?? RiskRiskStatus.OPEN,
        dueDate: data.risk.dueDate ?? '',
        details: data.risk.details ?? undefined,
        detailsJSON: data.risk.detailsJSON ?? undefined,
        mitigation: data.risk.mitigation ?? undefined,
        businessCosts: data.risk.businessCosts ?? undefined,
        tags: data.risk.tags || [],
        stakeholder: data.risk.stakeholder ? { type: 'group', value: data.risk.stakeholder.id, displayName: data.risk.stakeholder.displayName, noClearOtherFields: true } : undefined,
        delegate: data.risk.delegate ? { type: 'group', value: data.risk.delegate.id, displayName: data.risk.delegate.displayName, noClearOtherFields: true } : undefined,
        reviewRequired: data.risk.reviewRequired ?? true,
        reviewFrequency: data.risk.reviewFrequency ?? '',
        nextReviewDueAt: data.risk.nextReviewDueAt ?? '',
        riskDecision: data.risk.riskDecision ?? '',
        mitigatedAt: data.risk.mitigatedAt ?? '',
        environmentName: data.risk.environmentName ?? '',
        scopeName: data.risk.scopeName ?? '',
      }
      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.risk, form])

  const onSubmit = async (values: RiskFormValues) => {
    try {
      const changedFields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
        const initialValue = initialValues[key as keyof RiskFormValues]
        if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
          acc[key] = value
        }
        return acc
      }, {})

      const detailsJSON = values.detailsJSON ? (values.detailsJSON as Value) : undefined
      const details = changedFields.detailsJSON ? await plateEditorHelper.convertToHtml(changedFields.detailsJSON as Value) : undefined
      const businessCosts = changedFields.businessCosts ? await plateEditorHelper.convertToHtml(changedFields.businessCosts as Value) : undefined
      const mitigation = changedFields.mitigation ? await plateEditorHelper.convertToHtml(changedFields.mitigation as Value) : undefined

      const input: UpdateRiskInput = {
        ...changedFields,
        details,
        businessCosts,
        mitigation,
        detailsJSON: detailsJSON,
      } as UpdateRiskInput

      if (Object.keys(input).length === 0) {
        setIsEditing(false)
        return
      }

      await updateRisk({ updateRiskId: riskId, input })

      successNotification({
        title: 'Risk updated',
        description: 'The risk was successfully updated.',
      })

      setIsEditing(false)
      form.reset(values)
    } catch {
      errorNotification({ title: 'Failed to update risk' })
    }
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset(initialValues as RiskFormValues)
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleUpdateField = async (input: UpdateRiskInput, options?: { throwOnError?: boolean }) => {
    try {
      await updateRisk({ updateRiskId: riskId, input })
      successNotification({
        title: 'Risk updated',
        description: 'The risk was successfully updated.',
      })
    } catch (error) {
      errorNotification({ title: 'Failed to update risk' })

      if (options?.throwOnError) {
        throw error
      }
    }
  }

  const handleDeleteRisk = async () => {
    try {
      await deleteRisk({ deleteRiskId: riskId })
      successNotification({ title: 'Risk deleted successfully.' })
      router.push('/exposure/risks')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const queryClient = useQueryClient()

  const memoizedSections = useMemo(() => {
    if (!associationsData?.risk) return {}
    return {
      assets: associationsData.risk.assets,
      scans: associationsData.risk.scans,
      controls: associationsData.risk.controls,
      subcontrols: associationsData.risk.subcontrols,
      policies: associationsData.risk.internalPolicies,
      actionPlans: associationsData.risk.actionPlans,
      reviews: associationsData.risk.reviews,
      remediations: associationsData.risk.remediations,
      entities: associationsData.risk.entities,
      programs: associationsData.risk.programs,
      procedures: associationsData.risk.procedures,
      tasks: associationsData.risk.tasks,
    }
  }, [associationsData?.risk])

  const memoizedCenterNode = useMemo(() => {
    if (!data?.risk) return null
    return {
      node: data.risk,
      type: ObjectAssociationNodeEnum.RISKS,
    }
  }, [data?.risk])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: riskId,
    handleUpdateField: (input: UpdateRiskInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: [{ queryKey: ['risks'], dataRootField: 'risk', exact: false }],
    invalidateQueryKeys: [['risks']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.risk.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.risk.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.risk.sectionKeyToInvalidateQueryKey,
  })

  const risk = data?.risk
  const canEditRisk = canEdit(permission?.roles)

  if (isLoading) {
    return null
  }

  if (isError || !risk) {
    return <div className="p-4 text-red-500">Risk not found</div>
  }

  const mainContent = (
    <div className="space-y-6 px-2">
      <RiskDetailHeader
        risk={risk}
        isEditing={isEditing}
        canEditRisk={canEditRisk}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDeleteClick={() => setIsDeleteDialogOpen(true)}
        permissionRoles={permission?.roles}
        handleUpdateField={handleUpdateField}
      />

      <div className="grid gap-4 sm:grid-cols-[160px_160px_1fr]">
        {risk.status && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <Badge variant={'outline'} className="shrink-0">
              <RiskLabel fieldName="status" status={risk.status} isEditing={isEditing} showIcon={true} />
            </Badge>
          </div>
        )}
        {risk.riskKindName && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Kind</p>
            <Badge variant={'secondary'} className="shrink-0 ml-[-10px]">
              <RiskLabel fieldName="riskKindName" riskKindName={risk.riskKindName} isEditing={isEditing} showIcon={false} />
            </Badge>
          </div>
        )}
        {risk.riskCategoryName && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Category</p>
            <Badge variant={'secondary'} className="shrink-0 ml-[-10px]">
              <RiskLabel fieldName="riskCategoryName" riskCategoryName={risk.riskCategoryName} isEditing={isEditing} showIcon={false} />
            </Badge>
          </div>
        )}
      </div>

      <QuickActions riskId={riskId} handleUpdate={handleUpdateField} canEdit={canEdit(permission?.roles)} />

      <RiskDetailTabs risk={risk} associations={associationsData} isEditing={isEditing} canEdit={canEditRisk} handleUpdateField={handleUpdateField} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEditRisk} onRemoveAssociation={handleRemoveAssociation} />}
      <RiskPropertiesSidebar data={risk} isEditing={isEditing} handleUpdate={handleUpdateField} canEdit={canEditRisk} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Risks - ${risk.name}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout
            sidebarTitle="Details"
            sidebarContent={sidebarContent}
            slideOpen={isEditing}
            minWidth={430}
            collapsedContentClassName="pr-6"
            collapsedButtonClassName="-translate-x-4"
            hasScrollbar={hasScrollbar}
          >
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteRisk}
        title="Delete Risk"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{risk.name}</b> from the organization.
          </>
        }
      />

      <EvidenceDetailsSheet />
      <AssetDetailsSheet queryParamKey="assetId" />
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default RiskDetailPage
