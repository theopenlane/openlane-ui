'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { type FieldErrors, FormProvider } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TabsContent } from '@repo/ui/tabs'
import { ControlImplementationDocumentStatus, type UpdateControlImplementationInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import {
  type ControlImplementationDetailNode,
  useControlImplementation,
  useControlImplementationAssociations,
  useControlImplementationLinkedControls,
  useDeleteControlImplementation,
  useUpdateControlImplementation,
} from '@/lib/graphql-hooks/control-implementation'
import { getNodes } from '@/lib/graphql-hooks/connection'
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
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ASSOCIATION_REMOVAL_CONFIG, CONTROL_IMPLEMENTATION_ASSOCIATION_SECTIONS, buildAssociationSections } from '@/components/shared/object-association/object-association-config'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { type TDetailTab, useDetailTabs } from '@/components/shared/detail-tabs/use-detail-tabs'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import ActivityTasksSection from '@/components/pages/protected/controls/tabs/activity/activity-tasks-section'
import { CONTROL_IMPLEMENTATIONS_HREF, controlImplementationHref, getControlImplementationTitle } from '@/utils/control-implementation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import CreateControlImplementationSheet from '../../controls/tabs/implementation/control-implementation-components/create-control-implementation-sheet'
import { CONTROL_IMPLEMENTATION_UPDATE_FIELDS } from '../../controls/tabs/implementation/control-implementation-components/form/build-update-input'
import useFormSchema, { type TFormData } from '../../controls/tabs/implementation/control-implementation-components/form/use-form-schema'
import { breadcrumbs } from '../table/table-config'
import { useControlImplementationVerification } from '../use-control-implementation-verification'
import ControlImplementationAskAI from './control-implementation-ask-ai'
import ControlImplementationDetailHeader from './control-implementation-detail-header'
import ControlImplementationDetails from './control-implementation-details'
import ControlImplementationPropertiesCard from './control-implementation-properties-card'
import ControlImplementationQuickActions from './control-implementation-quick-actions'
import { hasUnloadedLinkedControls } from './linked-controls/linked-control-groups'
import LinkedControlsSection from './linked-controls/linked-controls-section'

type TTabValue = 'overview' | 'activity'

const TABS: readonly TDetailTab<TTabValue>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
]

const CACHE_TARGETS = [{ queryKey: ['controlImplementations'], dataRootField: 'controlImplementation', exact: false }]

const toFormValues = (implementation: ControlImplementationDetailNode): TFormData => ({
  details: implementation.details ?? '',
  status: implementation.status ?? undefined,
  implementationDate: implementation.implementationDate ? new Date(implementation.implementationDate) : null,
  tags: implementation.tags ?? [],
  verified: !!implementation.verified,
})

type TControlImplementationDetailPageProps = {
  controlImplementationId: string
}

const ControlImplementationDetailPage: React.FC<TControlImplementationDetailPageProps> = ({ controlImplementationId }) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { successNotification, errorNotification, warningNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const organizationName = getOrganizationByID(currentOrgId ?? '')?.node?.displayName
  const { data: session } = useSession()

  const { data, isPending, error, refetch } = useControlImplementation(controlImplementationId)
  const implementation = data?.controlImplementation
  useQueryErrorNotification({ error: implementation ? error : null, description: 'Failed to refresh control implementation' })
  const { data: associationsData } = useControlImplementationAssociations(controlImplementationId)
  const { data: linkedControlsData } = useControlImplementationLinkedControls(controlImplementationId)
  const linkedControls = linkedControlsData?.controlImplementation
  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL_IMPLEMENTATION, controlImplementationId)
  const { data: orgPermission } = useOrganizationRoles()
  const { mutateAsync: updateImplementation, isPending: isUpdating } = useUpdateControlImplementation()
  const { mutateAsync: deleteImplementation } = useDeleteControlImplementation()
  const { setVerified, isPending: isVerifying } = useControlImplementationVerification()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [cloneDefaults, setCloneDefaults] = useState<Partial<TFormData>>()
  const [isCloneOpen, setIsCloneOpen] = useState(false)
  const [isAskAIOpen, setIsAskAIOpen] = useState(false)

  const { form } = useFormSchema()
  const isSaving = isUpdating || isVerifying || form.formState.isSubmitting
  const buildDirtyInput = useDirtyInput(form)
  const navGuard = useNavigationGuard({ enabled: form.formState.isDirty })
  const tabs = useDetailTabs<TTabValue>({ page: 'control-implementation', tabs: TABS, defaultTab: 'overview' })

  const title = getControlImplementationTitle(implementation)

  const isEditingRef = useRef(isEditing)
  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    if (implementation && !isEditingRef.current) {
      form.reset(toFormValues(implementation))
    }
  }, [implementation, form])

  useEffect(() => {
    setCrumbs([...breadcrumbs, { label: title, isLoading: isPending }])
  }, [setCrumbs, title, isPending])

  const sections = useMemo(() => buildAssociationSections(CONTROL_IMPLEMENTATION_ASSOCIATION_SECTIONS, associationsData?.controlImplementation), [associationsData])
  const centerNode = useMemo(
    () => ({ node: { id: controlImplementationId, name: title, details: implementation?.details }, type: ObjectAssociationNodeEnum.CONTROL_IMPLEMENTATION }),
    [controlImplementationId, title, implementation?.details],
  )
  const taskFilter = useMemo(() => ({ hasControlImplementationsWith: [{ id: controlImplementationId }] }), [controlImplementationId])

  const handleUpdate = useCallback(
    async (input: UpdateControlImplementationInput, options?: { throwOnError?: boolean }) => {
      try {
        await updateImplementation({ updateControlImplementationId: controlImplementationId, input })
        successNotification({ title: 'Control Implementation updated' })
      } catch (error) {
        errorNotification({ title: 'Failed to update control implementation', description: parseErrorMessage(error) })
        if (options?.throwOnError) throw error
      }
    },
    [updateImplementation, controlImplementationId, successNotification, errorNotification],
  )

  const handleVerifiedChange = useCallback((verified: boolean) => void setVerified(controlImplementationId, verified), [setVerified, controlImplementationId])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: controlImplementationId,
    handleUpdateField: (input: UpdateControlImplementationInput) => handleUpdate(input, { throwOnError: true }),
    queryClient,
    cacheTargets: CACHE_TARGETS,
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.controlImplementation.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.controlImplementation.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.controlImplementation.sectionKeyToInvalidateQueryKey,
  })

  const onSubmit = async (values: TFormData) => {
    try {
      const input = await buildDirtyInput<UpdateControlImplementationInput>(values, CONTROL_IMPLEMENTATION_UPDATE_FIELDS)
      if (Object.keys(input).length === 0) {
        form.reset()
        setIsEditing(false)
        return
      }
      await updateImplementation({ updateControlImplementationId: controlImplementationId, input })
      successNotification({ title: 'Control Implementation updated' })
      form.reset(values)
      await refetch({ cancelRefetch: false })
      setIsEditing(false)
    } catch (error) {
      errorNotification({ title: 'Failed to update control implementation', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteImplementation({ deleteControlImplementationId: controlImplementationId })
      successNotification({ title: 'Control Implementation deleted' })
      router.push(CONTROL_IMPLEMENTATIONS_HREF)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const openClone = () => {
    if (!implementation) return
    setCloneDefaults({
      ...toFormValues(implementation),
      status: ControlImplementationDocumentStatus.DRAFT,
      verified: undefined,
      controlIDs: getNodes(implementation.controls).map(({ id }) => id),
      subcontrolIDs: getNodes(implementation.subcontrols).map(({ id }) => id),
    })
    setIsCloneOpen(true)
    if (linkedControls && hasUnloadedLinkedControls(linkedControls)) {
      warningNotification({ title: 'Not every linked control is selected', description: 'Only the first 100 controls and subcontrols are preselected. Link the rest after creating the clone.' })
    }
  }

  const openImplementation = (id: string) => router.push(controlImplementationHref(id))

  if (isPending) {
    return <ObjectWithDetailsSkeleton />
  }

  if (!implementation) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Control implementation not found.</p>
        <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(CONTROL_IMPLEMENTATIONS_HREF)}>
          Back to Implementations
        </Button>
      </div>
    )
  }

  const canEditImplementation = canEdit(permission?.roles, session)

  const discardEdits = () => {
    form.reset(toFormValues(implementation))
    setIsEditing(false)
  }

  const handleInvalidSubmit = (errors: FieldErrors<TFormData>) => {
    tabs.onTabChange('overview')
    errorNotification({ title: 'Control implementation not saved', description: Object.values(errors)[0]?.message?.toString() ?? 'Fix the highlighted fields and try again.' })
  }

  const sidebarContent = (
    <>
      <ObjectAssociationSwitch sections={sections} centerNode={centerNode} canEdit={canEditImplementation} onRemoveAssociation={handleRemoveAssociation} />
      <ControlImplementationPropertiesCard implementation={implementation} isEditing={isEditing} />
    </>
  )

  return (
    <>
      <title>{`${organizationName ?? 'Openlane'} | Implementations - ${title}`}</title>
      <FormProvider {...form}>
        <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} slideOpen={isEditing} minWidth={430} collapsedContentClassName="pr-6">
          <div className="space-y-6 px-2">
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}>
              <ControlImplementationDetailHeader
                implementation={implementation}
                title={title}
                isEditing={isEditing}
                isSaving={isSaving}
                canEdit={canEditImplementation}
                canDelete={canDelete(permission?.roles)}
                canClone={hasPermission(orgPermission?.roles, AccessEnum.CanCreateControlImplementation, session)}
                onEdit={() => {
                  form.reset(toFormValues(implementation))
                  tabs.onTabChange('overview')
                  setIsEditing(true)
                }}
                onCancel={discardEdits}
                onAskAI={() => setIsAskAIOpen(true)}
                onClone={openClone}
                onDelete={() => setIsDeleteDialogOpen(true)}
                onStatusChange={(status) => void handleUpdate({ status })}
                onVerifiedChange={handleVerifiedChange}
              />
            </form>
            {!isEditing && (
              <ControlImplementationQuickActions implementation={implementation} title={title} canEdit={canEditImplementation} isSaving={isSaving} onVerifiedChange={handleVerifiedChange} />
            )}
            <DetailTabs state={tabs}>
              <TabsContent value="overview" className="space-y-6" forceMount hidden={tabs.activeTab !== 'overview'}>
                <ControlImplementationDetails details={implementation.details} isEditing={isEditing} />
                <div className="border-t pt-6">
                  <LinkedControlsSection
                    key={controlImplementationId}
                    controlImplementationId={controlImplementationId}
                    details={implementation.details}
                    canEdit={canEditImplementation && !isEditing}
                  />
                </div>
              </TabsContent>
              <TabsContent value="activity" forceMount hidden={tabs.activeTab !== 'activity'}>
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Tasks</h2>
                  <ActivityTasksSection associationFilter={taskFilter} emptyDescription="Use tasks to track work related to this implementation. Add a task to get started." />
                </section>
              </TabsContent>
            </DetailTabs>
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
        title="Delete Control Implementation"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{title}</b> from the organization.
          </>
        }
      />

      <CreateControlImplementationSheet open={isCloneOpen} onOpenChange={setIsCloneOpen} createDefaults={cloneDefaults} showControlPicker onCreated={openImplementation} />
      <ControlImplementationAskAI open={isAskAIOpen} onOpenChange={setIsAskAIOpen} implementation={implementation} title={title} organizationName={organizationName} />
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default ControlImplementationDetailPage
