'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ArrowRight, PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import AssociatedObjectsAccordion from '../../../../components/pages/protected/controls/associated-objects-accordion.tsx'
import TitleField from '../../../../components/pages/protected/controls/form-fields/title-field.tsx'
import DescriptionField from '../../../../components/pages/protected/controls/form-fields/description-field.tsx'
import AuthorityCard from '../../../../components/pages/protected/controls/authority-card.tsx'
import PropertiesCard from '../../../../components/pages/protected/controls/properties-card.tsx'
import ImplementationDetailsCard from '../../../../components/pages/protected/controls/implementation-details-card.tsx'
import InfoCard from '../../../../components/pages/protected/controls/info-card.tsx'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { Control, ControlControlStatus, EvidenceEdge, SubcontrolControlStatus } from '@repo/codegen/src/schema.ts'
import { useNavigationGuard } from 'next-navigation-guard'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import SubcontrolsTable from '@/components/pages/protected/controls/subcontrols-table.tsx'
import ControlEvidenceTable from '@/components/pages/protected/controls/control-evidence-table.tsx'
import { useGetSubcontrolById, useUpdateSubcontrol } from '@/lib/graphql-hooks/subcontrol.ts'

interface FormValues {
  refCode: string
  description: string
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: SubcontrolControlStatus
  mappedCategories: string[]
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
  status: SubcontrolControlStatus.NULL,
  mappedCategories: [],
}

const ControlDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useGetSubcontrolById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [showSheet, setShowSheet] = useState<boolean>(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)

  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()
  const plateEditorHelper = usePlateEditor()

  const form = useForm<FormValues>({
    defaultValues: initialDataObj,
  })

  const { isDirty } = form.formState

  const navGuard = useNavigationGuard({ enabled: isDirty })

  const onSubmit = async (values: FormValues) => {
    try {
      const description = await plateEditorHelper.convertToHtml(values.description as Value | any)

      await updateSubcontrol({
        updateSubcontrolId: id!,
        input: {
          ...values,
          description,
          controlOwnerID: values.controlOwnerID || undefined,
          delegateID: values.delegateID || undefined,
        },
      })

      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update control:', error)
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

  useEffect(() => {
    if (data?.subcontrol) {
      const newValues: FormValues = {
        refCode: data?.subcontrol?.refCode || '',
        description: data?.subcontrol?.description || '',
        delegateID: data?.subcontrol?.delegate?.id || '',
        controlOwnerID: data?.subcontrol?.controlOwner?.id || '',
        category: data?.subcontrol?.category || '',
        subcategory: data?.subcontrol?.subcategory || '',
        status: data?.subcontrol?.status || SubcontrolControlStatus.NULL,
        mappedCategories: data?.subcontrol?.mappedCategories || [],
      }

      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.subcontrol, form])

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>
  if (isError || !data?.subcontrol) return <div className="p-4 text-red-500">Control not found</div>
  const subcontrol = data?.subcontrol
  const hasInfoData = subcontrol.implementationGuidance || subcontrol.exampleEvidence || subcontrol.controlQuestions || subcontrol.assessmentMethods || subcontrol.assessmentObjectives

  return (
    <>
      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <TitleField isEditing={isEditing} />
            </div>
            <DescriptionField isEditing={isEditing} initialValue={initialValues.description} />
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
            <AssociatedObjectsAccordion policies={subcontrol.internalPolicies} procedures={subcontrol.procedures} tasks={subcontrol.tasks} risks={subcontrol.risks} />
          </div>
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
                <Button className="h-8 !px-2" icon={<PencilIcon />} iconPosition="left" onClick={handleEdit}>
                  Edit Control
                </Button>
              </div>
            )}
            <AuthorityCard controlOwner={subcontrol.controlOwner} delegate={subcontrol.delegate} isEditing={isEditing} />
            <PropertiesCard
              controlData={subcontrol.control as Control}
              category={subcontrol.category}
              subcategory={subcontrol.subcategory}
              status={subcontrol.status}
              mappedCategories={subcontrol.mappedCategories}
              isEditing={isEditing}
            />
            <ImplementationDetailsCard isEditing={isEditing} />
            {hasInfoData && (
              <InfoCard
                implementationGuidance={subcontrol.implementationGuidance}
                exampleEvidence={subcontrol.exampleEvidence}
                controlQuestions={subcontrol.controlQuestions}
                assessmentMethods={subcontrol.assessmentMethods}
                assessmentObjectives={subcontrol.assessmentObjectives}
                showInfoDetails={showInfoDetails}
              />
            )}
          </div>
        </form>

        <Sheet open={showSheet} onOpenChange={handleSheetClose}>
          <SheetContent>
            <SheetHeader>
              <ArrowRight size={16} className="cursor-pointer" onClick={() => handleSheetClose(false)} />
              <SheetTitle>{sheetData?.refCode}</SheetTitle>
            </SheetHeader>
            <div className="py-4">{sheetData?.content}</div>
          </SheetContent>
        </Sheet>
      </FormProvider>
    </>
  )
}

export default ControlDetailsPage
