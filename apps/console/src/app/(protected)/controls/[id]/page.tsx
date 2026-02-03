'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGetControlAssociationsById, useGetControlById, useGetControlDiscussionById, useUpdateControl, useDeleteControl } from '@/lib/graphql-hooks/controls'
import { FormProvider, useForm } from 'react-hook-form'
import { Value } from 'platejs'
import { Button } from '@repo/ui/button'
import { CopyPlus, InfoIcon, PencilIcon, MoreHorizontal, Trash2 } from 'lucide-react'
import TitleField from '../../../../components/pages/protected/controls/form-fields/title-field.tsx'
import DescriptionField from '../../../../components/pages/protected/controls/form-fields/description-field.tsx'
import PropertiesCard from '../../../../components/pages/protected/controls/propereties-card/properties-card.tsx'
import { Control, ControlControlSource, ControlControlStatus, EvidenceEdge, UpdateControlInput } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canCreate, canDelete, canEdit } from '@/lib/authz/utils.ts'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import Link from 'next/link'
import { useNotification } from '@/hooks/useNotification.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Loading from './loading.tsx'
import ControlCommentsCard from '@/components/pages/protected/controls/comments-card.tsx'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { SaveButton } from '@/components/shared/save-button/save-button.tsx'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Badge } from '@repo/ui/badge'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { ImplementationTab, ObjectivesTab, EvidenceTab, LinkedControlsTab, GuidanceTab, DocumentationTab } from './tabs'
import QuickActions from './components/quick-actions'

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
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('implementation')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)
  const { data: permission } = useAccountRoles(ObjectEnum.CONTROL, id)
  const { data: orgPermission } = useOrganizationRoles()

  const { successNotification, errorNotification } = useNotification()
  const isSourceFramework = data?.control.source === ControlControlSource.FRAMEWORK
  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: deleteControl } = useDeleteControl()
  const plateEditorHelper = usePlateEditor()
  const { data: discussionData } = useGetControlDiscussionById(id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { data: associationsData } = useGetControlAssociationsById(id)

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
      router.push('/controls')
      await deleteControl({ deleteControlId: id })
      successNotification({ title: 'Control deleted successfully.' })
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
  const control = data?.control
  const isVerified = control.controlImplementations?.edges?.some((edge) => !!edge?.node?.verificationDate) ?? false

  const menuComponent = (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <CancelButton onClick={handleCancel}></CancelButton>
          <SaveButton />
        </div>
      )}
      {!isEditing && (
        <div className="flex gap-2 justify-end">
          {(canEdit(permission?.roles) || canDelete(permission?.roles)) && (
            <div className="flex gap-2">
              {canEdit(permission?.roles) && (
                <Button type="button" variant="secondary" onClick={(e) => handleEdit(e)} aria-label="Edit control" icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
                  Edit
                </Button>
              )}
            </div>
          )}
          <Menu
            trigger={
              <Button type="button" variant="secondary" className="h-8 px-2">
                <MoreHorizontal size={16} />
              </Button>
            }
            content={
              <>
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControl) && (
                  <Link href={`/controls/${id}/clone-control?mapControlId=${id}`}>
                    <button className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer">
                      <CopyPlus size={16} strokeWidth={2} />
                      <span>Clone Control</span>
                    </button>
                  </Link>
                )}
                {canDelete(permission?.roles) && (
                  <button onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer text-destructive">
                    <Trash2 size={16} strokeWidth={2} />
                    <span>Delete</span>
                  </button>
                )}
              </>
            }
          />
        </div>
      )}
    </div>
  )

  const evidenceControlParam = {
    id: control.id,
    referenceFramework: {
      [control?.id ?? 'default']: control?.referenceFramework ?? '',
    },
    controlRefCodes: [control?.refCode],
  }

  const evidenceFormData = {
    displayID: control?.refCode,
    controlID: control.id,
    controlRefCodes: [control?.refCode],
    referenceFramework: {
      [control?.id ?? 'default']: control?.referenceFramework ?? '',
    },
    programDisplayIDs: (associationsData?.control?.programs?.edges?.map((e) => e?.node?.name).filter(Boolean) as string[]) ?? [],
    objectAssociations: {
      controlIDs: [control?.id],
      programIDs: (associationsData?.control?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlObjectiveIDs: (control?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    },
    objectAssociationsDisplayIDs: [
      ...((associationsData?.control?.programs?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
      ...((control?.controlObjectives?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
      ...(control.refCode ? [control.refCode] : []),
    ],
  }

  const mainContent = (
    <div className="space-y-6 p-2">
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
        <div className="flex items-center gap-2">{menuComponent}</div>
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
          <Badge variant="secondary" className="capitalize">
            {control.source?.toLowerCase() ?? 'custom'}
          </Badge>
        </div>
      </div>

      <QuickActions
        controlId={id}
        evidenceFormData={evidenceFormData}
        evidenceControlParam={evidenceControlParam}
        taskInitialData={{
          programIDs: (associationsData?.control.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          procedureIDs: (associationsData?.control.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          internalPolicyIDs: (associationsData?.control.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          controlObjectiveIDs: (control.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          riskIDs: (associationsData?.control.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          controlIDs: [id],
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="implementation">Implementations</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="linked-controls">Linked Controls</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="implementation" className="space-y-6">
          <ImplementationTab />
        </TabsContent>

        <TabsContent value="objectives" className="space-y-6">
          <ObjectivesTab />
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          <EvidenceTab
            evidenceFormData={evidenceFormData}
            evidences={control.evidence?.edges?.filter((e): e is EvidenceEdge => !!e && !!e.node) || []}
            exampleEvidence={control.exampleEvidence as string | { documentationType: string; description: string }[] | null}
          />
        </TabsContent>

        <TabsContent value="linked-controls" className="space-y-6">
          <LinkedControlsTab
            subcontrols={control.subcontrols?.edges || []}
            totalCount={control.subcontrols.totalCount}
            refCode={control.refCode}
            referenceFramework={control.referenceFramework}
            canCreateMappedControl={canCreate(orgPermission?.roles, AccessEnum.CanCreateMappedControl)}
          />
        </TabsContent>

        <TabsContent value="guidance" className="space-y-6">
          <GuidanceTab
            implementationGuidance={control.implementationGuidance as { referenceId: string; guidance: string[] }[] | null}
            controlQuestions={control.controlQuestions as string[] | null}
            assessmentMethods={control.assessmentMethods as { id: string; method: string }[] | string[] | null}
            assessmentObjectives={control.assessmentObjectives as { id: string; objective: string }[] | string[] | null}
          />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <DocumentationTab procedures={associationsData?.control?.procedures} internalPolicies={associationsData?.control?.internalPolicies} />
        </TabsContent>
      </Tabs>
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch controlId={data?.control.id} sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} />}

      <PropertiesCard data={control as Control} isEditing={isEditing} handleUpdate={(val) => handleUpdateField(val as UpdateControlInput)} canEdit={canEdit(permission?.roles)} />
      <ControlCommentsCard />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Controls - ${data.control.refCode}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} slideOpen={isEditing} minWidth={430}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />

      <EvidenceDetailsSheet controlId={id} />

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
