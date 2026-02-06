'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { Value } from 'platejs'
import { InfoIcon } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import ControlHeaderActions from '@/components/pages/protected/controls/control-header-actions'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { SubcontrolControlSource, SubcontrolControlStatus, UpdateSubcontrolInput } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useGetSubcontrolAssociationsById, useGetSubcontrolById, useGetSubcontrolDiscussionById, useUpdateSubcontrol, useDeleteSubcontrol, SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol.ts'
import TitleField from '@/components/pages/protected/controls/form-fields/title-field'
import DescriptionField from '@/components/pages/protected/controls/form-fields/description-field'
import PropertiesCard from '@/components/pages/protected/controls/propereties-card/properties-card.tsx'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet.tsx'
import { useNotification } from '@/hooks/useNotification'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useOrganization } from '@/hooks/useOrganization'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { canEdit } from '@/lib/authz/utils'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Loading from './loading.tsx'
import { useAccountRoles } from '@/lib/query-hooks/permissions.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import AIChat from '@/components/shared/ai-suggetions/chat.tsx'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import ControlTabs from '@/components/pages/protected/controls/tabs/tabs.tsx'
import QuickActions from '@/components/pages/protected/controls/quick-actions/quick-actions.tsx'

interface FormValues {
  refCode: string
  description: string | Value
  descriptionJSON?: Value
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: SubcontrolControlStatus
  mappedCategories: string[]
  source?: SubcontrolControlSource
  referenceID?: string
  auditorReferenceID?: string
  title: string
  subcontrolKindName?: string
}

const initialDataObj = {
  refCode: '',
  description: '',
  descriptionJSON: undefined,
  delegateID: '',
  controlOwnerID: '',
  category: '',
  subcategory: '',
  status: SubcontrolControlStatus.NOT_IMPLEMENTED,
  mappedCategories: [],
  title: '',
}

const ControlDetailsPage: React.FC = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId
  const { data: userData } = useGetCurrentUser(userId)

  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { subcontrolId, id } = useParams<{ subcontrolId: string; id: string }>()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)
  const [showAskAIDialog, setShowAskAIDialog] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [hasScrollbar, setHasScrollbar] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const { mutateAsync: deleteSubcontrol } = useDeleteSubcontrol()

  const { data, isLoading, isError } = useGetSubcontrolById(subcontrolId)
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const plateEditorHelper = usePlateEditor()

  const { data: permission } = useAccountRoles(ObjectEnum.SUBCONTROL, subcontrolId)
  const { data: discussionData } = useGetSubcontrolDiscussionById(subcontrolId)

  const { data: associationsData } = useGetSubcontrolAssociationsById(subcontrolId)

  const memoizedSections = useMemo(() => {
    if (!data?.subcontrol) return {}
    return {
      policies: associationsData?.subcontrol.internalPolicies,
      procedures: associationsData?.subcontrol.procedures,
      tasks: associationsData?.subcontrol.tasks,
      risks: associationsData?.subcontrol.risks,
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

      const input = Object.fromEntries(Object.entries(changedFields).map(([key, value]) => [key, value || undefined]))

      if (Object.keys(input).length === 0) {
        setIsEditing(false)
        return
      }

      await updateSubcontrol({
        updateSubcontrolId: subcontrolId!,
        input,
      })

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
      router.push(`/controls/${id}`)
      await deleteSubcontrol({ deleteSubcontrolId: subcontrolId })
      successNotification({ title: 'Subcontrol deleted successfully.' })
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
    form.reset(initialValues)
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleUpdateField = async (input: UpdateSubcontrolInput) => {
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
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
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
        category: data?.subcontrol?.category || '',
        subcategory: data?.subcontrol?.subcategory || '',
        status: data?.subcontrol?.status || SubcontrolControlStatus.NOT_IMPLEMENTED,
        mappedCategories: data?.subcontrol?.mappedCategories || [],
        subcontrolKindName: data.subcontrol.subcontrolKindName || undefined,
        source: data.subcontrol.source || undefined,
        referenceID: data.subcontrol.referenceID || undefined,
        auditorReferenceID: data.subcontrol.auditorReferenceID || undefined,
        title: data.subcontrol.title ? `${data.subcontrol.refCode} ${data.subcontrol.title}` : data.subcontrol.refCode,
      }

      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.subcontrol, form])

  useEffect(() => {
    let rafId = 0
    const checkScrollbar = () => {
      const container = document.querySelector('[data-scroll-container="main"]') as HTMLElement | null
      if (!container) {
        const root = document.documentElement
        setHasScrollbar(root.scrollHeight > root.clientHeight)
        return
      }
      setHasScrollbar(container.scrollHeight > container.clientHeight)
    }

    const scheduleCheck = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        checkScrollbar()
      })
    }

    const container = document.querySelector('[data-scroll-container="main"]') as HTMLElement | null
    const resizeObserver = container ? new ResizeObserver(scheduleCheck) : null

    if (container) {
      resizeObserver?.observe(container)
    }

    checkScrollbar()
    window.addEventListener('resize', scheduleCheck)
    return () => {
      window.removeEventListener('resize', scheduleCheck)
      resizeObserver?.disconnect()
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isEditing, data?.subcontrol, associationsData?.subcontrol])

  if (isLoading) {
    return <Loading />
  }
  if (isError || !data?.subcontrol) return <div className="p-4 text-red-500">Subcontrol not found</div>
  const subcontrol: SubcontrolByIdNode = data.subcontrol
  const isVerified = subcontrol.controlImplementations?.edges?.some((edge) => !!edge?.node?.verificationDate) ?? false

  const mainContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <TitleField
              isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
              isEditing={isEditing}
              handleUpdate={(val) => handleUpdateField(val as UpdateSubcontrolInput)}
              initialValue={initialValues.title}
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
        <div className="w-3/5 flex items-start gap-2 border rounded-lg p-1 bg-card">
          <InfoIcon size={14} className="mt-1 shrink-0" />
          <p>
            This subcontrol was created via a reference framework and the details are not editable. If you need to edit it, consider&nbsp;
            <Link className="text-blue-500" href={`/controls/${id}/create-subcontrol?mapSubcontrolId=${subcontrolId}`}>
              creating a new subcontrol
            </Link>
            &nbsp;and linking it.
          </p>
        </div>
      )}
      <DescriptionField
        isEditing={isEditing}
        initialValue={initialValues.descriptionJSON ?? initialValues.description}
        isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
        discussionData={discussionData?.subcontrol}
      />

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Framework</p>
          <StandardChip referenceFramework={subcontrol.referenceFramework ?? ''} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Source</p>
          <Badge variant="secondary" className="capitalize">
            {subcontrol.source?.toLowerCase() ?? 'custom'}
          </Badge>
        </div>
      </div>

      <QuickActions kind="subcontrol" controlId={id} subcontrolId={subcontrolId} subcontrol={subcontrol} />

      <ControlTabs kind="subcontrol" subcontrol={subcontrol} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch controlId={subcontrol.control?.id} sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} />}

      <PropertiesCard data={subcontrol} isEditing={isEditing} handleUpdate={handleUpdateField} canEdit={canEdit(permission?.roles)} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Subcontrols - ${data.subcontrol.refCode}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout
            sidebarTitle="Details"
            sidebarContent={sidebarContent}
            slideOpen={isEditing}
            minWidth={430}
            collapsedContentClassName="pr-6"
            collapsedButtonClassName="-translate-x-2"
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
