'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { type FieldErrors, FormProvider } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useDeleteFinding, useFinding, useUpdateFinding } from '@/lib/graphql-hooks/finding'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canDelete, canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useNotification } from '@/hooks/useNotification'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { useDirtyInput } from '@/hooks/useDirtyInput'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import AIChat from '@/components/shared/ai-suggetions/chat'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, FINDING_ASSOCIATION_SECTIONS, buildAssociationSections } from '@/components/shared/object-association/object-association-config'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import { useDetailTabs } from '@/components/shared/detail-tabs/use-detail-tabs'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CVSS_VECTOR_ERROR, parseCvssVector } from '@/utils/cvss-vector'
import useFormSchema, { type FindingFormData } from '../hooks/use-form-schema'
import { FINDING_UPDATE_FIELDS } from '../hooks/finding-update-fields'
import { useFindingAssociationUpdate } from '../hooks/use-finding-association-update'
import { getFindingSeverity, getFindingTitle } from '../finding-display'
import { FINDING_RESPONSIBILITIES, normalizeFindingData } from '../finding-responsibility'
import { ExposurePropertiesCard } from '../../exposure/detail/exposure-properties-card'
import { breadcrumbs as FINDING_BREADCRUMBS } from '../table/table-config'
import FindingDetailHeader from './finding-detail-header'
import FindingQuickActions from './finding-quick-actions'
import FindingAdditionalDetailsCard from './finding-additional-details-card'
import FindingDetailTabs from './tabs/finding-detail-tabs'
import { FINDING_TABS, type TFindingTabValue } from './tabs/finding-tab-values'

const LIST_HREF = '/exposure/findings'
const NO_REMEDIATION_TAB: ReadonlySet<TFindingTabValue> = new Set(['remediation'])
const CACHE_TARGETS = [{ queryKey: ['findings'], dataRootField: 'finding', exact: false }]

type TFindingDetailPageProps = {
  findingId: string
}

const FindingDetailPage: React.FC<TFindingDetailPageProps> = ({ findingId }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const organizationName = getOrganizationByID(currentOrgId ?? '')?.node?.displayName
  const { data: session } = useSession()
  const { data: userData } = useGetCurrentUser(session?.user?.userId)

  const { data, isPending, error } = useFinding(findingId)
  useQueryErrorNotification({ error: data?.finding ? error : null, description: 'Failed to refresh finding' })
  const { associationsData, applyUpdate } = useFindingAssociationUpdate(findingId)
  const { data: permission } = useAccountRoles(ObjectTypes.FINDING, findingId)
  const { data: orgPermission } = useOrganizationRoles()
  const { mutateAsync: updateFinding, isPending: isSaving } = useUpdateFinding()
  const { mutateAsync: deleteFinding } = useDeleteFinding()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAskAIOpen, setIsAskAIOpen] = useState(false)
  const [railOverride, setRailOverride] = useState<{ tab: TFindingTabValue; open: boolean } | null>(null)

  const { form } = useFormSchema()
  const buildDirtyInput = useDirtyInput(form)
  const navGuard = useNavigationGuard({ enabled: form.formState.isDirty })
  const associations = associationsData?.finding
  const hasNoRemediationWork = !!associations && associations.remediations.totalCount === 0 && associations.tasks.totalCount === 0 && associations.actionPlans.totalCount === 0
  const tabs = useDetailTabs<TFindingTabValue>({
    page: 'finding',
    tabs: FINDING_TABS,
    defaultTab: 'overview',
    unavailableTabs: hasNoRemediationWork && searchParams.get('tab') !== 'remediation' ? NO_REMEDIATION_TAB : undefined,
    isResolving: !associations,
  })

  const finding = data?.finding
  const title = finding ? getFindingTitle(finding) : ''

  const isEditingRef = useRef(isEditing)
  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    if (finding && !isEditingRef.current) {
      form.reset(normalizeFindingData(finding))
    }
  }, [finding, form])

  useEffect(() => {
    setCrumbs([...FINDING_BREADCRUMBS, { label: title, isLoading: isPending }])
  }, [setCrumbs, title, isPending])

  const sections = useMemo(() => buildAssociationSections(FINDING_ASSOCIATION_SECTIONS, associations), [associations])
  const centerNode = useMemo(() => (finding ? { node: finding, type: ObjectAssociationNodeEnum.FINDING } : null), [finding])

  const canEditFinding = canEdit(permission?.roles, session)
  const canDeleteFinding = canDelete(permission?.roles)
  const canCreateRemediation = hasPermission(orgPermission?.roles, AccessEnum.CanCreateRemediation, session)

  const handleUpdateField = async (input: UpdateFindingInput, options?: TPersistOptions) => {
    try {
      await applyUpdate(input)
      successNotification({ title: 'Finding updated' })
    } catch (error) {
      errorNotification({ title: 'Failed to update finding', description: parseErrorMessage(error) })
      if (options?.throwOnError) throw error
    }
  }

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: findingId,
    handleUpdateField: (input: UpdateFindingInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: CACHE_TARGETS,
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.finding.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.finding.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.finding.sectionKeyToInvalidateQueryKey,
  })

  const onSubmit = async (values: FindingFormData) => {
    const vector = values.vector?.trim()
    if (form.getFieldState('vector').isDirty && vector && !parseCvssVector(vector)) {
      form.setError('vector', { message: CVSS_VECTOR_ERROR })
      tabs.onTabChange('overview')
      return
    }

    try {
      const input = await buildDirtyInput<UpdateFindingInput>({ ...values, vector }, FINDING_UPDATE_FIELDS)
      if (Object.keys(input).length === 0) {
        form.reset()
        setIsEditing(false)
        return
      }
      await updateFinding({ updateFindingId: findingId, input })
      successNotification({ title: 'Finding updated', description: 'The finding was successfully updated.' })
      setIsEditing(false)
      form.reset({ ...values, vector })
    } catch (error) {
      errorNotification({ title: 'Failed to update finding', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteFinding({ deleteFindingId: findingId })
      queryClient.removeQueries({ queryKey: ['findings', findingId] })
      successNotification({ title: 'Finding deleted successfully.' })
      router.push(LIST_HREF)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  if (isPending) {
    return <ObjectWithDetailsSkeleton />
  }

  if (!finding) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Finding not found.</p>
        <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(LIST_HREF)}>
          Back to Findings
        </Button>
      </div>
    )
  }

  const discardEdits = () => {
    form.reset(normalizeFindingData(finding))
    setIsEditing(false)
  }

  const handleInvalidSubmit = (errors: FieldErrors<FindingFormData>) => {
    tabs.onTabChange('overview')
    errorNotification({ title: 'Finding not saved', description: Object.values(errors)[0]?.message?.toString() ?? 'Fix the highlighted fields and try again.' })
  }

  const sidebarContent = (
    <>
      {centerNode && <ObjectAssociationSwitch sections={sections} centerNode={centerNode} canEdit={canEditFinding} onRemoveAssociation={handleRemoveAssociation} />}
      <ExposurePropertiesCard
        data={finding}
        responsibilities={FINDING_RESPONSIBILITIES}
        blocking={{ name: 'blocksProduction', value: finding.blocksProduction }}
        isEditing={isEditing}
        canEdit={canEditFinding}
        handleUpdate={handleUpdateField}
      />
      <FindingAdditionalDetailsCard finding={finding} isEditing={isEditing} canEdit={canEditFinding} handleUpdate={handleUpdateField} />
    </>
  )

  return (
    <>
      <title>{`${organizationName ?? 'Openlane'} | Findings - ${title}`}</title>
      <FormProvider {...form}>
        <SlideBarLayout
          sidebarTitle="Details"
          sidebarContent={sidebarContent}
          slideOpen={isEditing}
          open={railOverride?.tab === tabs.activeTab ? railOverride.open : true}
          onOpenChange={(open) => setRailOverride({ tab: tabs.activeTab, open })}
          minWidth={430}
          collapsedContentClassName="pr-6"
        >
          <div className="space-y-6 px-2">
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}>
              <FindingDetailHeader
                finding={finding}
                isEditing={isEditing}
                isSaving={isSaving}
                canEdit={canEditFinding}
                canDelete={canDeleteFinding}
                onEdit={(event) => {
                  event.preventDefault()
                  tabs.onTabChange('overview')
                  setIsEditing(true)
                }}
                onCancel={(event) => {
                  event.preventDefault()
                  discardEdits()
                }}
                onDeleteClick={() => setIsDeleteDialogOpen(true)}
                onAskAI={() => setIsAskAIOpen(true)}
                handleUpdateField={handleUpdateField}
              />
            </form>
            {!isEditing && <FindingQuickActions finding={finding} canEdit={canEditFinding} canCreateRemediation={canCreateRemediation} onShowRemediationTab={() => tabs.onTabChange('remediation')} />}
            <FindingDetailTabs tabs={tabs} finding={finding} isEditing={isEditing} canEdit={canEditFinding} canCreateRemediation={canCreateRemediation} handleUpdateField={handleUpdateField} />
          </div>
        </SlideBarLayout>
      </FormProvider>

      <CancelDialog
        isOpen={navGuard.active}
        onConfirm={() => {
          discardEdits()
          navGuard.accept()
        }}
        onCancel={navGuard.reject}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Finding"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{title}</b> from the organization.
          </>
        }
      />

      <AIChat
        open={isAskAIOpen}
        onOpenChange={setIsAskAIOpen}
        providedContext={{
          organization: { organizationName },
          user: { name: userData?.user?.displayName },
          background: `Finding details for the provided request, use this information to answer the user's question or provide suggestions: ${JSON.stringify({
            name: title,
            category: finding.category,
            findingClass: finding.findingClass,
            severity: getFindingSeverity(finding),
            score: finding.score,
            vector: finding.vector,
            status: finding.findingStatusName,
            recommendedActions: finding.recommendedActions,
            stepsToReproduce: finding.stepsToReproduce,
            resource: finding.resourceName,
            source: finding.source,
          })}`,
        }}
        contextKey={finding.id}
        object={{ type: 'finding', name: title }}
      />

      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default FindingDetailPage
