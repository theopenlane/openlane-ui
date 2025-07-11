'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ArrowRight, PencilIcon, SaveIcon, XIcon, CirclePlus } from 'lucide-react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { EvidenceEdge, Subcontrol, SubcontrolControlSource, SubcontrolControlStatus, SubcontrolControlType } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useGetSubcontrolById, useUpdateSubcontrol } from '@/lib/graphql-hooks/subcontrol.ts'
import TitleField from '@/components/pages/protected/controls/form-fields/title-field'
import DescriptionField from '@/components/pages/protected/controls/form-fields/description-field'
import AssociatedObjectsAccordion from '@/components/pages/protected/controls/associated-objects-accordion'
import AuthorityCard from '@/components/pages/protected/controls/authority-card'
import PropertiesCard from '@/components/pages/protected/controls/properties-card'
import DetailsCard from '@/components/pages/protected/controls/details'
import InfoCardWithSheet from '@/components/pages/protected/controls/info-card'
import ControlEvidenceTable from '@/components/pages/protected/controls/control-evidence/control-evidence-table.tsx'
import EvidenceDetailsSheet from '@/components/pages/protected/controls/control-evidence/evidence-details-sheet.tsx'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import Menu from '@/components/shared/menu/menu'
import { TaskIconBtn } from '@/components/shared/icon-enum/task-enum.tsx'
import DeleteSubcontrolDialog from '@/components/pages/protected/controls/delete-subcontrol-dialog.tsx'
import { CreateBtn } from '@/components/shared/icon-enum/common-enum.tsx'
import { useNotification } from '@/hooks/useNotification'
import CreateControlObjectiveSheet from '@/components/pages/protected/controls/control-objectives/create-control-objective-sheet'
import CreateControlImplementationSheet from '@/components/pages/protected/controls/control-implementation/create-control-implementation-sheet.tsx'
import Link from 'next/link'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar.tsx'
import RelatedControls from '@/components/pages/protected/controls/related-controls'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useOrganization } from '@/hooks/useOrganization'

interface FormValues {
  refCode: string
  description: string | Value
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: SubcontrolControlStatus
  mappedCategories: string[]
  source?: SubcontrolControlSource
  controlType?: SubcontrolControlType
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
  status: SubcontrolControlStatus.NOT_IMPLEMENTED,
  mappedCategories: [],
}

const ControlDetailsPage: React.FC = () => {
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { subcontrolId, id } = useParams<{ subcontrolId: string; id: string }>()

  const [isEditing, setIsEditing] = useState(false)
  const [showSheet, setShowSheet] = useState<boolean>(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)
  const { successNotification, errorNotification } = useNotification()
  const [showCreateObjectiveSheet, setShowCreateObjectiveSheet] = useState(false)
  const [showCreateImplementationSheet, setShowCreateImplementationSheet] = useState(false)

  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const plateEditorHelper = usePlateEditor()

  const { data, isLoading, isError } = useGetSubcontrolById(subcontrolId)
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)

  const form = useForm<FormValues>({
    defaultValues: initialDataObj,
  })

  const isSourceFramework = data?.subcontrol.source === SubcontrolControlSource.FRAMEWORK

  const { isDirty } = form.formState

  const navGuard = useNavigationGuard({ enabled: isDirty })

  const onSubmit = async (values: FormValues) => {
    try {
      const description = await plateEditorHelper.convertToHtml(values.description as Value)

      await updateSubcontrol({
        updateSubcontrolId: subcontrolId!,
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

  const handleEdit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: controlData?.control?.refCode, isLoading: isLoadingControl },
      { label: data?.subcontrol?.refCode, isLoading: isLoading },
    ])
  }, [setCrumbs, controlData, isLoading, data, isLoadingControl])

  useEffect(() => {
    if (data?.subcontrol) {
      const newValues: FormValues = {
        refCode: data?.subcontrol?.refCode || '',
        description: data?.subcontrol?.description || '',
        delegateID: data?.subcontrol?.delegate?.id || '',
        controlOwnerID: data?.subcontrol?.controlOwner?.id || '',
        category: data?.subcontrol?.category || '',
        subcategory: data?.subcontrol?.subcategory || '',
        status: data?.subcontrol?.status || SubcontrolControlStatus.NOT_IMPLEMENTED,
        mappedCategories: data?.subcontrol?.mappedCategories || [],
        controlType: data.subcontrol.controlType || undefined,
        source: data.subcontrol.source || undefined,
        referenceID: data.subcontrol.referenceID || undefined,
        auditorReferenceID: data.subcontrol.auditorReferenceID || undefined,
      }

      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.subcontrol, form])

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>
  if (isError || !data?.subcontrol) return <div className="p-4 text-red-500">Control not found</div>
  const subcontrol = data?.subcontrol
  const hasInfoData = subcontrol.implementationGuidance || subcontrol.exampleEvidence || subcontrol.controlQuestions || subcontrol.assessmentMethods || subcontrol.assessmentObjectives

  const menuComponent = (
    <div className="space-y-4">
      {isEditing ? (
        <div className="flex gap-2 justify-end">
          <Button className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
            Cancel
          </Button>
          <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />}>
            Save
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <Menu
            trigger={CreateBtn}
            content={
              <>
                <div onClick={() => setShowCreateImplementationSheet(true)} className="flex items-center space-x-2 hover:bg-muted cursor-pointer">
                  <CirclePlus size={16} strokeWidth={2} />
                  <span>Control Implementation</span>
                </div>
                <div onClick={() => setShowCreateObjectiveSheet(true)} className="flex items-center space-x-2 hover:bg-muted cursor-pointer">
                  <CirclePlus size={16} strokeWidth={2} />
                  <span>Control Objective</span>
                </div>
                <CreateControlObjectiveSheet
                  open={showCreateObjectiveSheet}
                  onOpenChange={(open) => {
                    setShowCreateObjectiveSheet(open)
                  }}
                />
                <CreateControlImplementationSheet
                  open={showCreateImplementationSheet}
                  onOpenChange={(open) => {
                    setShowCreateImplementationSheet(open)
                  }}
                />
                <CreateTaskDialog
                  trigger={TaskIconBtn}
                  defaultSelectedObject={ObjectTypeObjects.SUB_CONTROL}
                  initialData={{
                    procedureIDs: (subcontrol.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    internalPolicyIDs: (subcontrol.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    controlObjectiveIDs: (subcontrol.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    riskIDs: (subcontrol.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
                    subcontrolIDs: [subcontrolId],
                  }}
                />
                <Link href={`/controls/${id}/${subcontrolId}/map-control`}>
                  <div className="flex items-center space-x-2 hover:bg-muted">
                    <CirclePlus size={16} strokeWidth={2} />
                    <span>Map Control</span>
                  </div>
                </Link>
              </>
            }
          />
          <Menu
            content={
              <>
                <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={(e) => handleEdit(e)}>
                  <PencilIcon size={16} strokeWidth={2} />
                  <span>Edit</span>
                </div>
                <DeleteSubcontrolDialog subcontrolId={subcontrolId} controlId={subcontrol.control.id} refCode={subcontrol.refCode} />
              </>
            }
          />
        </div>
      )}
    </div>
  )

  const mainContent = (
    <div className="space-y-6 p-6">
      <TitleField isEditing={!isSourceFramework && isEditing} />
      <DescriptionField isEditing={!isSourceFramework && isEditing} initialValue={initialValues.description} />
      <ControlEvidenceTable
        control={{
          displayID: subcontrol?.refCode,
          tags: subcontrol.tags ?? [],
          objectAssociations: {
            controlIDs: [subcontrol?.id],
            taskIDs: (subcontrol?.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
            controlObjectiveIDs: (subcontrol?.controlObjectives?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
          },
          objectAssociationsDisplayIDs: [
            ...((subcontrol?.tasks?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...((subcontrol?.controlObjectives?.edges?.map((e) => e?.node?.displayID).filter(Boolean) as string[]) ?? []),
            ...(subcontrol.refCode ? [subcontrol.refCode] : []),
          ],
        }}
        evidences={subcontrol.evidence?.edges?.filter((e): e is EvidenceEdge => !!e && !!e.node) || []}
      />
    </div>
  )

  const sidebarContent = (
    <>
      <AuthorityCard controlOwner={subcontrol.controlOwner} delegate={subcontrol.delegate} isEditing={isEditing} />
      <PropertiesCard data={subcontrol as Subcontrol} isEditing={isEditing} />
      <RelatedControls />

      <DetailsCard />
      {hasInfoData && (
        <InfoCardWithSheet
          implementationGuidance={subcontrol.implementationGuidance}
          exampleEvidence={subcontrol.exampleEvidence}
          controlQuestions={subcontrol.controlQuestions}
          assessmentMethods={subcontrol.assessmentMethods}
          assessmentObjectives={subcontrol.assessmentObjectives}
          showInfoDetails={showInfoDetails}
        />
      )}
      <AssociatedObjectsAccordion policies={subcontrol.internalPolicies} procedures={subcontrol.procedures} tasks={subcontrol.tasks} risks={subcontrol.risks} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Subcontrols - ${data.subcontrol.refCode}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} menu={menuComponent} slideOpen={isEditing}>
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <Sheet open={showSheet} onOpenChange={handleSheetClose}>
        <SheetContent>
          <SheetHeader>
            <ArrowRight size={16} className="cursor-pointer" onClick={() => handleSheetClose(false)} />
            <SheetTitle>{sheetData?.refCode}</SheetTitle>
          </SheetHeader>
          <div className="py-4">{sheetData?.content}</div>
        </SheetContent>
      </Sheet>

      <EvidenceDetailsSheet controlId={subcontrolId} />

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </>
  )
}

export default ControlDetailsPage
