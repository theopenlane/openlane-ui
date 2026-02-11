'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useHasScrollbar } from '@/hooks/useHasScrollbar'
import { useParams, useRouter } from 'next/navigation'
import { useGetControlAssociationsById, useGetControlById, useGetControlDiscussionById, useUpdateControl, useDeleteControl, ControlByIdNode } from '@/lib/graphql-hooks/controls'
import { FormProvider, useForm } from 'react-hook-form'
import { Value } from 'platejs'
import { InfoIcon } from 'lucide-react'
import TitleField from '@/components/pages/protected/controls/form-fields/title-field.tsx'
import DescriptionField from '@/components/pages/protected/controls/form-fields/description-field.tsx'
import PropertiesCard from '@/components/pages/protected/controls/propereties-card/properties-card.tsx'
import { ControlControlSource, ControlControlStatus, UpdateControlInput } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet.tsx'
import ControlHeaderActions from '@/components/pages/protected/controls/control-header-actions'
import Link from 'next/link'
import { useNotification } from '@/hooks/useNotification.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import Loading from './loading.tsx'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import ControlTabs from '@/components/pages/protected/controls/tabs/tabs.tsx'
import QuickActions from '@/components/pages/protected/controls/quick-actions/quick-actions.tsx'
import AIChat from '@/components/shared/ai-suggetions/chat.tsx'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface FormValues {
  refCode: string
  description: Value | string
  descriptionJSON?: Value
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: ControlControlStatus
  mappedCategories: string[]
  source?: ControlControlSource
  referenceID?: string
  auditorReferenceID?: string
  title: string
  controlKindName?: string
}

const initialDataObj = {
  refCode: '',
  description: '',
  descriptionJSON: undefined,
  delegateID: '',
  controlOwnerID: '',
  category: '',
  subcategory: '',
  status: ControlControlStatus.NOT_IMPLEMENTED,
  mappedCategories: [],
  title: '',
}

const ControlDetailsPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)

  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)
  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL, id)
  const { data: orgPermission } = useOrganizationRoles()

  const { successNotification, errorNotification } = useNotification()
  const [showAskAIDialog, setShowAskAIDialog] = useState(false)
  const isSourceFramework = data?.control.source === ControlControlSource.FRAMEWORK
  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: deleteControl } = useDeleteControl()
  const plateEditorHelper = usePlateEditor()
  const { data: discussionData } = useGetControlDiscussionById(id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: associationsData } = useGetControlAssociationsById(id)
  const hasScrollbar = useHasScrollbar([isEditing, data?.control, associationsData?.control])

  const memoizedSections = useMemo(() => {
    if (!associationsData?.control || !data) return {}
    return {
      policies: associationsData.control.internalPolicies,
      procedures: associationsData.control.procedures,
      tasks: associationsData.control.tasks,
      programs: associationsData.control.programs,
      risks: associationsData.control.risks,
      subcontrols: data.control.subcontrols,
    }
  }, [associationsData?.control, data])

  const memoizedCenterNode = useMemo(() => {
    if (!data?.control) return null
    return {
      node: data?.control,
      type: ObjectAssociationNodeEnum.CONTROL,
    }
  }, [data?.control])

  const form = useForm<FormValues>({
    defaultValues: initialDataObj,
  })

  const { isDirty } = form.formState

  const navGuard = useNavigationGuard({ enabled: isDirty })

  const onSubmit = async (values: FormValues) => {
    try {
      const changedFields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
        const initialValue = initialValues[key as keyof FormValues]
        if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
          acc[key] = value
        }
        return acc
      }, {})

      if (changedFields.descriptionJSON) {
        changedFields.descriptionJSON = values?.descriptionJSON
        changedFields.description = await plateEditorHelper.convertToHtml(values.descriptionJSON as Value)
      }

      if (isSourceFramework) {
        delete changedFields.title
        delete changedFields.refCode
        delete changedFields.descriptionJSON
        delete changedFields.description
      }

      const input: UpdateControlInput = Object.fromEntries(Object.entries(changedFields).map(([key, value]) => [key, value || undefined])) as UpdateControlInput

      if (Object.keys(input).length === 0) {
        setIsEditing(false)
        return
      }

      await updateControl({
        updateControlId: id!,
        input,
      })

      successNotification({
        title: 'Control updated',
        description: 'The control was successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({
        title: 'Failed to update control',
      })
    }
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset(initialValues)
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleUpdateField = async (input: UpdateControlInput) => {
    try {
      await updateControl({ updateControlId: id, input })
      successNotification({
        title: 'Control updated',
        description: 'The control was successfully updated.',
      })
    } catch {
      errorNotification({
        title: 'Failed to update control',
      })
    }
  }

  const handleDeleteControl = async () => {
    if (!id) return

    try {
      await deleteControl({ deleteControlId: id })
      successNotification({ title: 'Control deleted successfully.' })
      router.push('/controls')
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

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: data?.control?.refCode, isLoading: isLoading },
    ])
  }, [setCrumbs, data?.control, isLoading])

  useEffect(() => {
    if (data?.control) {
      const newValues: FormValues = {
        refCode: data.control.refCode || '',
        description: data.control.description || '',
        descriptionJSON: data.control?.descriptionJSON ? (data.control.descriptionJSON as Value) : undefined,
        delegateID: data.control.delegate?.id || '',
        controlOwnerID: data.control.controlOwner?.id || '',
        category: data.control.category || '',
        subcategory: data.control.subcategory || '',
        status: data.control.status || ControlControlStatus.NOT_IMPLEMENTED,
        mappedCategories: data.control.mappedCategories || [],
        source: data.control.source || undefined,
        referenceID: data.control.referenceID || undefined,
        auditorReferenceID: data.control.auditorReferenceID || undefined,
        title: data.control.title ? `${data.control.refCode} ${data.control.title}` : data.control.refCode,
        controlKindName: data.control?.controlKindName || undefined,
      }
      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.control, form])

  if (isLoading) {
    return <Loading />
  }
  if (isError || !data?.control) return <div className="p-4 text-red-500">Control not found</div>
  const control: ControlByIdNode = data?.control
  const isVerified = control.controlImplementations?.edges?.some((edge) => !!edge?.node?.verificationDate) ?? false

  const mainContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <TitleField
              isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
              isEditing={isEditing}
              initialValue={initialValues.title}
              handleUpdate={(val) => handleUpdateField(val as UpdateControlInput)}
              referenceFramework={control.referenceFramework}
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
            controlId={id}
            isEditing={isEditing}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onDeleteClick={() => setIsDeleteDialogOpen(true)}
            onAskAI={() => setShowAskAIDialog(true)}
            permissionRoles={permission?.roles}
            orgPermissionRoles={orgPermission?.roles}
          />
        </div>
      </div>
      {isEditing && isSourceFramework && (
        <div className="w-3/5 flex items-start gap-2 border rounded-lg p-1 bg-card">
          <InfoIcon size={14} className="mt-1 shrink-0" />
          <p>
            This control was created via a reference framework and the details are not editable. If you need to edit it, consider{' '}
            <Link className="text-blue-500" href={`/controls/${id}/create-subcontrol`}>
              creating a subcontrol
            </Link>
            &nbsp;or&nbsp;
            <Link className="text-blue-500" href={`/controls/create-control?mapControlId=${id}`}>
              creating a new control
            </Link>
            &nbsp;and linking it.
          </p>
        </div>
      )}
      <DescriptionField
        isEditing={isEditing}
        initialValue={initialValues.descriptionJSON ?? initialValues.description}
        isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
        discussionData={discussionData?.control}
      />

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Framework</p>
          <StandardChip referenceFramework={control.referenceFramework ?? ''} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Source</p>
          <Badge variant="document">{getEnumLabel(control.source ?? 'custom')}</Badge>
        </div>
      </div>

      <QuickActions kind="control" controlId={id} control={control} />

      <ControlTabs kind="control" control={control} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch controlId={data?.control.id} sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} />}

      <PropertiesCard data={control} isEditing={isEditing} handleUpdate={handleUpdateField} canEdit={canEdit(permission?.roles)} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Controls - ${data.control.refCode}`}</title>
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
            refCode: control.refCode,
            title: control.title,
            framework: control.referenceFramework,
            description: control.description,
          },
          organization: {
            organizationName: currentOrganization?.node?.displayName,
          },
          user: {
            name: userData?.user?.displayName,
          },
          background: "Control Details for the provided request, use this information to answer the user's question or provide suggestions.",
        }}
        contextKey={control.id}
        object={{
          type: 'control',
          name: control.refCode,
        }}
      />

      <EvidenceDetailsSheet controlId={id} />
      <TaskDetailsSheet queryParamKey="taskId" />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteControl}
        title="Delete Control"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{control?.refCode}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default ControlDetailsPage
