'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useHasScrollbar } from '@/hooks/useHasScrollbar'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { FormProvider, useForm } from 'react-hook-form'
import { type Value } from 'platejs'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import ControlHeaderActions from '@/components/pages/protected/controls/control-header-actions'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { SubcontrolControlSource, SubcontrolControlStatus, type UpdateSubcontrolInput } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'nextjs-nav-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import {
  useGetSubcontrolAssociationsById,
  useGetSubcontrolById,
  useGetSubcontrolDiscussionById,
  useUpdateSubcontrol,
  useDeleteSubcontrol,
  type SubcontrolByIdNode,
} from '@/lib/graphql-hooks/subcontrol.ts'
import TitleField from '@/components/pages/protected/controls/form-fields/title-field'
import DescriptionField from '@/components/pages/protected/controls/form-fields/description-field'
import PropertiesCard from '@/components/pages/protected/controls/propereties-card/properties-card.tsx'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet.tsx'
import { useNotification } from '@/hooks/useNotification'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { useOrganization } from '@/hooks/useOrganization'
import { canEdit } from '@/lib/authz/utils'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { ASSOCIATION_REMOVAL_CONFIG, SUBCONTROL_ASSOCIATION_SECTIONS, buildAssociationSections } from '@/components/shared/object-association/object-association-config'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import Loading from './loading.tsx'
import { useAccountRoles } from '@/lib/query-hooks/permissions.ts'
import { buildControlUpdateFields, type TControlFormValues } from '@/components/pages/protected/controls/build-control-update-input'
import { orClear, useDirtyInput, type TFieldMappers } from '@/hooks/useDirtyInput'
import AIChat from '@/components/shared/ai-suggetions/chat.tsx'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import ControlTabs from '@/components/pages/protected/controls/tabs/tabs.tsx'
import QuickActions from '@/components/pages/protected/controls/quick-actions/quick-actions.tsx'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Callout } from '@/components/shared/callout/callout'

type FormValues = TControlFormValues & {
  status: SubcontrolControlStatus
  source?: SubcontrolControlSource
  subcontrolKindName?: string
}

const buildSubcontrolUpdateFields = (isSourceFramework: boolean) =>
  ({
    ...buildControlUpdateFields(isSourceFramework),
    status: orClear('clearStatus'),
    source: orClear('clearSource'),
    subcontrolKindName: orClear('clearSubcontrolKindName'),
  }) satisfies TFieldMappers<FormValues, UpdateSubcontrolInput>

const initialDataObj = {
  refCode: '',
  description: '',
  descriptionJSON: undefined,
  delegateID: '',
  controlOwnerID: '',
  responsiblePartyID: '',
  category: '',
  subcategory: '',
  status: SubcontrolControlStatus.NOT_IMPLEMENTED,
  mappedCategories: [],
  title: '',
  sourceName: '',
  publicRepresentation: '',
}

const ControlDetailsPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)

  const { setCrumbs } = React.use(BreadcrumbContext)
  const { subcontrolId, id } = useParams<{ subcontrolId: string; id: string }>()
  const router = useRouter()

  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showAskAIDialog, setShowAskAIDialog] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: deleteSubcontrol } = useDeleteSubcontrol()

  const { data, isLoading, isError } = useGetSubcontrolById(subcontrolId)
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')

  const { data: permission } = useAccountRoles(ObjectTypes.SUBCONTROL, subcontrolId ?? '')
  const { data: discussionData } = useGetSubcontrolDiscussionById(subcontrolId)

  const { data: associationsData } = useGetSubcontrolAssociationsById(subcontrolId)
  const hasScrollbar = useHasScrollbar([isEditing, data?.subcontrol, associationsData?.subcontrol])

  const memoizedSections = useMemo(() => {
    if (!data?.subcontrol) return {}
    return {
      ...buildAssociationSections(SUBCONTROL_ASSOCIATION_SECTIONS, associationsData?.subcontrol),
      controls: data?.subcontrol.control,
    }
  }, [associationsData, data])

  const memoizedCenterNode = useMemo(() => {
    if (!data?.subcontrol) return null
    return {
      node: data?.subcontrol,
      type: ObjectAssociationNodeEnum.SUBCONTROL,
    }
  }, [data?.subcontrol])

  const form = useForm<FormValues>({
    defaultValues: initialDataObj,
  })

  const isSourceFramework = data?.subcontrol.source === SubcontrolControlSource.FRAMEWORK

  const { isDirty } = form.formState
  const buildDirtyInput = useDirtyInput(form)

  const navGuard = useNavigationGuard({ enabled: isDirty })

  const onSubmit = async (values: FormValues) => {
    try {
      const input = await buildDirtyInput<UpdateSubcontrolInput>(values, buildSubcontrolUpdateFields(isSourceFramework))

      if (Object.keys(input).length === 0) {
        form.reset()
        setIsEditing(false)
        return
      }

      await updateSubcontrol({
        updateSubcontrolId: subcontrolId ?? '',
        input,
      })

      form.reset(values)

      successNotification({
        title: 'Subcontrol updated',
        description: 'The subcontrol was successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({
        title: 'Failed to update subcontrol',
      })
    }
  }

  const handleDeleteSubcontrol = async () => {
    if (!subcontrolId) return

    try {
      await deleteSubcontrol({ deleteSubcontrolId: subcontrolId })
      successNotification({ title: 'Subcontrol deleted successfully.' })
      router.push(`/controls/${id}`)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
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

  const handleUpdateField = async (input: UpdateSubcontrolInput, options?: { throwOnError?: boolean }) => {
    try {
      await updateSubcontrol({ updateSubcontrolId: subcontrolId, input })
      successNotification({
        title: 'Subcontrol updated',
        description: 'The subcontrol was successfully updated.',
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

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: subcontrolId,
    handleUpdateField: (input: UpdateSubcontrolInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: [{ queryKey: ['subcontrols'], dataRootField: 'subcontrol' }],
    invalidateQueryKeys: [['subcontrols']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.subcontrol.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.subcontrol.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.subcontrol.sectionKeyToInvalidateQueryKey,
  })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Controls', href: '/controls' },
      { label: controlData?.control?.refCode, isLoading: isLoadingControl, href: `/controls/${controlData?.control.id}` },
      { label: data?.subcontrol?.refCode, isLoading: isLoading },
    ])
  }, [setCrumbs, controlData, isLoading, data, isLoadingControl])

  useEffect(() => {
    if (data?.subcontrol) {
      const newValues: FormValues = {
        refCode: data?.subcontrol?.refCode || '',
        description: data?.subcontrol?.description || '',
        descriptionJSON: data.subcontrol?.descriptionJSON ? (data.subcontrol.descriptionJSON as Value) : undefined,
        delegateID: data?.subcontrol?.delegate?.id || '',
        controlOwnerID: data?.subcontrol?.controlOwner?.id || '',
        responsiblePartyID: data?.subcontrol?.responsibleParty?.id || '',
        category: data?.subcontrol?.category || '',
        subcategory: data?.subcontrol?.subcategory || '',
        status: data?.subcontrol?.status || SubcontrolControlStatus.NOT_IMPLEMENTED,
        mappedCategories: data?.subcontrol?.mappedCategories || [],
        subcontrolKindName: data.subcontrol.subcontrolKindName || undefined,
        source: data.subcontrol.source || undefined,
        referenceID: data.subcontrol.referenceID || undefined,
        auditorReferenceID: data.subcontrol.auditorReferenceID || undefined,
        title: data.subcontrol.title || '',
        publicRepresentation: data.subcontrol.publicRepresentation || '',
        sourceName: data.subcontrol.sourceName || '',
      }

      form.reset(newValues, { keepDirtyValues: true })
    }
  }, [data?.subcontrol, form])

  if (isLoading) {
    return <Loading />
  }
  if (isError || !data?.subcontrol) return <div className="p-4 text-red-500">Subcontrol not found</div>
  const subcontrol: SubcontrolByIdNode = data.subcontrol
  const storedDescriptionJSON = subcontrol.descriptionJSON ? (subcontrol.descriptionJSON as Value) : undefined
  const isVerified = subcontrol.controlImplementations?.edges?.some((edge) => !!edge?.node?.verificationDate) ?? false

  const mainContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <TitleField
              isEditAllowed={!isSourceFramework && canEdit(permission?.roles, sessionData)}
              isEditing={isEditing}
              handleUpdate={(val) => handleUpdateField(val as UpdateSubcontrolInput)}
              initialRefCode={subcontrol.refCode || ''}
              initialTitle={subcontrol.title || ''}
              referenceFramework={subcontrol.referenceFramework}
            />
            {isVerified && (
              <Badge variant="green" className="h-6 px-2 text-xs">
                Verified
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ControlHeaderActions
            controlId={subcontrolId}
            isEditing={isEditing}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onDeleteClick={() => setIsDeleteDialogOpen(true)}
            onAskAI={() => setShowAskAIDialog(true)}
            permissionRoles={permission?.roles}
            showClone={false}
          />
        </div>
      </div>
      {isEditing && isSourceFramework && (
        <Callout variant="info" compact className="w-3/5">
          This subcontrol was created via a reference framework and the details are not editable. If you need to edit it, consider&nbsp;
          <Link href={`/controls/${id}/create-subcontrol?mapSubcontrolId=${subcontrolId}`}>creating a new subcontrol</Link>
          &nbsp;and linking it.
        </Callout>
      )}
      <DescriptionField
        isEditing={isEditing}
        initialValue={storedDescriptionJSON ?? subcontrol.description ?? ''}
        isEditAllowed={!isSourceFramework && canEdit(permission?.roles, sessionData)}
        discussionData={discussionData?.subcontrol}
        systemCreated={!storedDescriptionJSON && !!subcontrol.description}
        source={subcontrol.source ?? undefined}
      />

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Framework</p>
          <StandardChip referenceFramework={subcontrol.referenceFramework ?? ''} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Source</p>
          <Badge variant="document">{getEnumLabel(subcontrol.source ?? 'custom')}</Badge>
        </div>
      </div>

      <QuickActions kind="subcontrol" controlId={id} subcontrolId={subcontrolId} subcontrol={subcontrol} canEdit={canEdit(permission?.roles, sessionData)} />

      <ControlTabs kind="subcontrol" subcontrol={subcontrol} isEditing={isEditing} data={subcontrol} handleUpdate={handleUpdateField} canEdit={canEdit(permission?.roles, sessionData)} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && (
        <ObjectAssociationSwitch
          controlId={subcontrol.control?.id}
          sections={memoizedSections}
          centerNode={memoizedCenterNode}
          canEdit={canEdit(permission?.roles, sessionData)}
          onRemoveAssociation={handleRemoveAssociation}
        />
      )}

      <PropertiesCard data={subcontrol} isEditing={isEditing} handleUpdate={handleUpdateField} canEdit={canEdit(permission?.roles, sessionData)} />
    </>
  )

  return (
    <>
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

      <AIChat
        open={showAskAIDialog}
        onOpenChange={setShowAskAIDialog}
        providedContext={{
          control: {
            refCode: subcontrol.refCode,
            title: subcontrol.title,
            framework: subcontrol.referenceFramework,
            description: subcontrol.description,
          },
          organization: {
            organizationName: currentOrganization?.node?.displayName,
          },
          user: {
            name: userData?.user?.displayName,
          },
          background: "Subcontrol Details for the provided request, use this information to answer the user's question or provide suggestions.",
        }}
        contextKey={subcontrol.id}
        object={{
          type: 'subcontrol',
          name: subcontrol.refCode,
        }}
      />

      <EvidenceDetailsSheet controlId={subcontrolId} />
      <TaskDetailsSheet queryParamKey="taskId" />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteSubcontrol}
        title="Delete Subcontrol"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{subcontrol?.refCode}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default ControlDetailsPage
