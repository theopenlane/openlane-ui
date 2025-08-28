'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetControlById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import { FormProvider, useForm } from 'react-hook-form'
import { Value } from 'platejs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { CirclePlus, InfoIcon, PanelRightClose, PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import TitleField from '../../../../components/pages/protected/controls/form-fields/title-field.tsx'
import DescriptionField from '../../../../components/pages/protected/controls/form-fields/description-field.tsx'
import PropertiesCard from '../../../../components/pages/protected/controls/properties-card.tsx'
import InfoCard from '../../../../components/pages/protected/controls/info-card.tsx'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { Control, ControlControlSource, ControlControlStatus, ControlControlType, EvidenceEdge, UpdateControlInput } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import SubcontrolsTable from '@/components/pages/protected/controls/subcontrols-table.tsx'
import { useAccountRole, useOrganizationRole } from '@/lib/authz/access-api.ts'
import { useSession } from 'next-auth/react'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canCreate, canEdit } from '@/lib/authz/utils.ts'
import EvidenceDetailsSheet from '@/components/pages/protected/controls/control-evidence/evidence-details-sheet.tsx'
import ControlEvidenceTable from '@/components/pages/protected/controls/control-evidence/control-evidence-table.tsx'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { TaskIconBtn } from '@/components/shared/enum-mapper/task-enum.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import DeleteControlDialog from '@/components/pages/protected/controls/delete-control-dialog.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum.tsx'
import Link from 'next/link'
import { useNotification } from '@/hooks/useNotification.tsx'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/control-implementation/create-control-implementation-sheet.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import RelatedControls from '@/components/pages/protected/controls/related-controls.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch.tsx'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Loading from './loading.tsx'
import ControlImplementationsSection from '@/components/pages/protected/controls/control-implementations-section.tsx'
import ControlObjectivesSection from '@/components/pages/protected/controls/control-objectives-section.tsx'

interface FormValues {
  refCode: string
  description: Value | string
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: ControlControlStatus
  mappedCategories: string[]
  controlType?: ControlControlType
  source?: ControlControlSource
  referenceID?: string
  auditorReferenceID?: string
}

interface SheetData {
  refCode: string
  content: React.ReactNode
}

const initialDataObj = {
  refCode: '',
  description: '',
  delegateID: '',
  controlOwnerID: '',
  category: '',
  subcategory: '',
  status: ControlControlStatus.NOT_IMPLEMENTED,
  mappedCategories: [],
}

const ControlDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [showSheet, setShowSheet] = useState<boolean>(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.CONTROL, id)
  const { data: orgPermission } = useOrganizationRole(session)

  const { successNotification, errorNotification } = useNotification()
  const [showCreateObjectiveSheet, setShowCreateObjectiveSheet] = useState(false)
  const [showCreateImplementationSheet, setShowCreateImplementationSheet] = useState(false)
  const isSourceFramework = data?.control.source === ControlControlSource.FRAMEWORK
  const { mutateAsync: updateControl } = useUpdateControl()
  const plateEditorHelper = usePlateEditor()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const memoizedSections = useMemo(() => {
    if (!data?.control) return {}
    return {
      policies: data?.control.internalPolicies,
      procedures: data?.control.procedures,
      tasks: data?.control.tasks,
      programs: data?.control.programs,
      risks: data?.control.risks,
      subcontrols: data?.control.subcontrols,
    }
  }, [data?.control])

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
      const description = await plateEditorHelper.convertToHtml(values.description as Value)

      await updateControl({
        updateControlId: id!,
        input: {
          ...values,
          description,
          controlOwnerID: values.controlOwnerID || undefined,
          delegateID: values.delegateID || undefined,
          referenceID: values.referenceID || undefined,
          auditorReferenceID: values.auditorReferenceID || undefined,
        },
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

  const showInfoDetails = (refCode: string, content: React.ReactNode) => {
    setSheetData({ refCode, content })
    setShowSheet(true)
  }

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setShowSheet(false)
      setTimeout(() => {
        setSheetData(null)
      }, 300)
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
        delegateID: data.control.delegate?.id || '',
        controlOwnerID: data.control.controlOwner?.id || '',
        category: data.control.category || '',
        subcategory: data.control.subcategory || '',
        status: data.control.status || ControlControlStatus.NOT_IMPLEMENTED,
        mappedCategories: data.control.mappedCategories || [],
        controlType: data.control.controlType || undefined,
        source: data.control.source || undefined,
        referenceID: data.control.referenceID || undefined,
        auditorReferenceID: data.control.auditorReferenceID || undefined,
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
  const hasInfoData = control.implementationGuidance || control.exampleEvidence || control.controlQuestions || control.assessmentMethods || control.assessmentObjectives

  const menuComponent = (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
            Cancel
          </Button>
          <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />}>
            Save
          </Button>
        </div>
      )}
      {!isEditing && (
        <div className="flex gap-2 justify-end">
          <Menu
            trigger={CreateBtn}
            content={
              <>
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlImplementation) && (
                  <div onClick={() => setShowCreateImplementationSheet(true)} className="flex items-center space-x-2 hover:bg-muted cursor-pointer">
                    <CirclePlus size={16} strokeWidth={2} />
                    <span>Control Implementation</span>
                  </div>
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlObjective) && (
                  <div onClick={() => setShowCreateObjectiveSheet(true)} className="flex items-center space-x-2 hover:bg-muted cursor-pointer">
                    <CirclePlus size={16} strokeWidth={2} />
                    <span>Control Objective</span>
                  </div>
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlObjective) && (
                  <CreateControlObjectiveSheet
                    open={showCreateObjectiveSheet}
                    onOpenChange={(open) => {
                      setShowCreateObjectiveSheet(open)
                    }}
                  />
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateControlImplementation) && (
                  <CreateControlImplementationSheet
                    open={showCreateImplementationSheet}
                    onOpenChange={(open) => {
                      setShowCreateImplementationSheet(open)
                    }}
                  />
                )}
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateSubcontrol) && (
                  <Link href={`/controls/${id}/create-subcontrol`}>
                    <div className="flex items-center space-x-2 hover:bg-muted">
                      <CirclePlus size={16} strokeWidth={2} />
                      <span>Subcontrol</span>
                    </div>
                  </Link>
                )}
                <CreateTaskDialog
                  trigger={TaskIconBtn}
                  defaultSelectedObject={ObjectTypeObjects.CONTROL}
                  initialData={{
                    programIDs: (control.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    procedureIDs: (control.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    internalPolicyIDs: (control.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    controlObjectiveIDs: (control.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    riskIDs: (control.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    controlIDs: [id],
                  }}
                />
                {canCreate(orgPermission?.roles, AccessEnum.CanCreateMappedControl) && (
                  <Link href={`/controls/${id}/map-control`}>
                    <div className="flex items-center space-x-2 hover:bg-muted">
                      <CirclePlus size={16} strokeWidth={2} />
                      <span>Map Control</span>
                    </div>
                  </Link>
                )}
              </>
            }
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="!p-1 h-8 bg-card" onClick={(e) => handleEdit(e)} aria-label="Edit control">
              <PencilIcon size={16} strokeWidth={2} />
            </Button>
            <DeleteControlDialog controlId={control.id} refCode={control.refCode} />
          </div>
        </div>
      )}
    </div>
  )

  const mainContent = (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-start">
        <TitleField
          isEditAllowed={!isSourceFramework && canEdit(permission?.roles)}
          isEditing={isEditing}
          initialValue={initialValues.refCode}
          handleUpdate={(val) => handleUpdateField(val as UpdateControlInput)}
          referenceFramework={control.referenceFramework}
        />
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
      </div>
      <DescriptionField isEditing={isEditing} initialValue={initialValues.description} isEditAllowed={!isSourceFramework && canEdit(permission?.roles)} />
      <ControlObjectivesSection controlObjectives={control.controlObjectives} canEdit={canEdit(permission?.roles)} />
      <ControlImplementationsSection controlImplementations={control.controlImplementations} canEdit={canEdit(permission?.roles)} />
      <ControlEvidenceTable
        canEdit={canEdit(permission?.roles)}
        control={{
          displayID: control?.refCode,
          tags: control.tags ?? [],
          objectAssociations: {
            controlIDs: [control?.id],
            programIDs: (control?.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
            taskIDs: (control?.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
            subcontrolIDs: (control?.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
            controlObjectiveIDs: (control?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          },
          objectAssociationsDisplayIDs: [
            ...((control?.programs?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...((control?.tasks?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...((control?.subcontrols?.edges?.map((e) => e?.node?.refCode).filter(Boolean) as string[]) ?? []),
            ...((control?.controlObjectives?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...(control.refCode ? [control.refCode] : []),
          ],
        }}
        evidences={control.evidence?.edges?.filter((e): e is EvidenceEdge => !!e && !!e.node) || []}
      />
      <SubcontrolsTable subcontrols={control.subcontrols?.edges || []} totalCount={control.subcontrols.totalCount} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEdit(permission?.roles)} />}

      <PropertiesCard data={control as Control} isEditing={isEditing} handleUpdate={(val) => handleUpdateField(val as UpdateControlInput)} canEdit={canEdit(permission?.roles)} />
      <RelatedControls canCreate={canCreate(orgPermission?.roles, AccessEnum.CanCreateMappedControl)} />
      {hasInfoData && (
        <InfoCard
          implementationGuidance={control.implementationGuidance}
          exampleEvidence={control.exampleEvidence}
          controlQuestions={control.controlQuestions}
          assessmentMethods={control.assessmentMethods}
          assessmentObjectives={control.assessmentObjectives}
          showInfoDetails={showInfoDetails}
        />
      )}
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Controls - ${data.control.refCode}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing} minWidth={431}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />

      <Sheet open={showSheet} onOpenChange={handleSheetClose}>
        <SheetContent
          header={
            <SheetHeader>
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleSheetClose(false)} />
              <SheetTitle>{sheetData?.refCode}</SheetTitle>
            </SheetHeader>
          }
        >
          <div className="py-4">{sheetData?.content}</div>
        </SheetContent>
      </Sheet>

      <EvidenceDetailsSheet controlId={id} />
    </>
  )
}

export default ControlDetailsPage
